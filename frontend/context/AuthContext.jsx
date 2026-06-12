"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginService,
  logout as logoutService,
  register as registerService,
} from "../services/authService";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);

  // ✅ 1. SINGLE SOURCE OF TRUTH HYDRATION
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") return;

      const storedToken = localStorage.getItem("token");
      const storedAccounts = JSON.parse(
        localStorage.getItem("accounts") || "[]",
      );

      // Load accounts array into memory immediately on start
      setAccounts(storedAccounts);

      if (!storedToken) {
        setLoading(false);
        return;
      }

      setToken(storedToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;

      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
          { headers: { Authorization: `Bearer ${storedToken}` } },
        );

        if (res.data?.user) {
          const freshUser = res.data.user;
          setUser(freshUser);

          // Re-sync accounts array instantly with fresh fields from /me
          setAccounts((prev) => {
            const clean = prev.filter(
              (a) => a.user?.id && a.user.id !== freshUser.id,
            );
            return [...clean, { token: storedToken, user: freshUser }];
          });
        }
      } catch (err) {
        console.error("Session restoration failed:", err);
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ✅ 2. SECURE WRITING TO STORAGE
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("accounts", JSON.stringify(accounts));
    }
  }, [accounts, loading]);

  const _setActiveAccount = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser);
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
  };

  const _upsertAccount = (newToken, newUser) => {
    if (!newUser || !newUser.id) return;
    setAccounts((prev) => {
      // Eliminate duplicates or corrupt empty configurations cleanly
      const filtered = prev.filter(
        (a) => a.user?.id && a.user.id !== newUser.id,
      );
      return [...filtered, { token: newToken, user: newUser }];
    });
  };

  const register = async (data) => {
    const response = await registerService(data);
    if (response?.token && response?.user) {
      _upsertAccount(response.token, response.user);
      _setActiveAccount(response.token, response.user);
    }
    return response;
  };

  const login = async (data) => {
    const response = await loginService(data);
    if (response?.token && response?.user) {
      _upsertAccount(response.token, response.user);
      _setActiveAccount(response.token, response.user);
    }
    return response;
  };

  const logout = async () => {
    if (token) {
      try {
        await logoutService(token);
      } catch {
        // Soft catch network dropouts
      }
    }
    const remaining = accounts.filter((a) => a.user?.id !== user?.id);
    setAccounts(remaining);

    if (remaining.length > 0) {
      _setActiveAccount(remaining[0].token, remaining[0].user);
    } else {
      localStorage.removeItem("token");
      delete axios.defaults.headers.common["Authorization"];
      setToken(null);
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await Promise.all(
        accounts.map(async (acc) => {
          try {
            await logoutService(acc.token);
          } catch (err) {
            console.warn(
              `Backend remote teardown failed for account: ${acc.user?.id}`,
            );
          }
        }),
      );
    } catch (err) {
      console.error("Global cleanup batch exception:", err);
    }

    setUser(null);
    setToken(null);
    setAccounts([]);
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
    localStorage.removeItem("accounts");
  };

  const loginWithGoogle = (googleUser, googleToken) => {
    if (!googleUser || !googleToken) return;
    _upsertAccount(googleToken, googleUser);
    _setActiveAccount(googleToken, googleUser);
  };

  const updateUser = (updatedUser) => {
    if (!updatedUser) return;
    setUser(updatedUser);
    _upsertAccount(token, updatedUser);
  };

  const switchAccount = (accountUserId) => {
    const account = accounts.find((a) => a.user?.id === accountUserId);
    if (!account) return;
    _setActiveAccount(account.token, account.user);
  };

  // ✅ FIX: Change this to accept credentials, call the API, and handle the response!
  const addAccount = async (email, password) => {
    // 1. Hit the backend login endpoint with the credentials
    const response = await loginService({ email, password });

    // 2. If the backend returns a successful session, save and activate it
    if (response?.token && response?.user) {
      _upsertAccount(response.token, response.user);
      _setActiveAccount(response.token, response.user);
    }

    return response;
  };

  const removeAccount = (accountUserId) => {
    const remaining = accounts.filter((a) => a.user?.id !== accountUserId);
    setAccounts(remaining);

    if (user?.id === accountUserId) {
      if (remaining.length > 0) {
        _setActiveAccount(remaining[0].token, remaining[0].user);
      } else {
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        setToken(null);
        setUser(null);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        accounts,
        login,
        logout,
        logoutAll,
        register,
        loginWithGoogle,
        updateUser,
        switchAccount,
        addAccount,
        removeAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
