"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  login as loginService,
  logout as logoutService,
  logoutAll as logoutAllService,
  register as registerService,
} from "../services/authService";
import axios from "axios";

const AuthContext = createContext();
const API_ME_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`;

function readStoredAccounts() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem("accounts") || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((entry) => entry?.token && entry?.user?.id)
      : [];
  } catch {
    localStorage.removeItem("accounts");
    return [];
  }
}

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
      const storedAccounts = readStoredAccounts();

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

          const mergedUser = { ...freshUser };
          setUser(mergedUser);

          // Upsert without duplicating — deduplication effect below still handles the Set logic
          setAccounts((prev) => {
            const others = prev.filter(
              (a) => a.user?.id && a.user.id !== mergedUser.id,
            );
            return [...others, { token: storedToken, user: mergedUser }];
          });
        }
      } catch (err) {
        console.error("Session restoration failed:", err);
        localStorage.removeItem("token");
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
        setToken(null);
        // ✅ FIX: Also clear corrupt accounts on failed token
        setAccounts((prev) => {
          const clean = prev.filter((a) => a.token !== storedToken);
          return clean;
        });
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // ✅ 2. SECURE WRITING TO STORAGE — deduplicate before saving
  useEffect(() => {
    if (!loading) {
      // Deduplicate by user.id before persisting
      const seen = new Set();
      const deduped = accounts.filter((a) => {
        if (!a.user?.id) return false; // Drop corrupt entries
        if (seen.has(a.user.id)) return false;
        seen.add(a.user.id);
        return true;
      });
      localStorage.setItem("accounts", JSON.stringify(deduped));
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
      // Remove any existing entry for this user, then add fresh one
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
    if (!token) throw new Error("Session absente");
    await logoutAllService(token);

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

  const addGoogleAccount = (googleToken, googleUser) => {
    if (!googleUser || !googleToken) return;
    _upsertAccount(googleToken, googleUser);
  };

  const updateUser = (updatedUser, replacementToken = token) => {
    if (!updatedUser) return;
    setUser(updatedUser);
    if (replacementToken) {
      _upsertAccount(replacementToken, updatedUser);
      if (replacementToken !== token) {
        _setActiveAccount(replacementToken, updatedUser);
      }
    }
  };

  const switchAccount = async (accountUserId) => {
    const account = accounts.find((a) => a.user?.id === accountUserId);
    if (!account) throw new Error("Compte introuvable");
    try {
      const res = await axios.get(
        API_ME_URL,
        { headers: { Authorization: `Bearer ${account.token}` } },
      );
      const freshUser = res.data?.user;
      if (!freshUser) throw new Error("Session invalide");
      _upsertAccount(account.token, freshUser);
      _setActiveAccount(account.token, freshUser);
      return freshUser;
    } catch (error) {
      if ([401, 403].includes(error.response?.status)) {
        setAccounts((prev) => prev.filter((entry) => entry.token !== account.token));
        if (typeof window !== "undefined") {
          const stored = readStoredAccounts().filter((entry) => entry.token !== account.token);
          localStorage.setItem("accounts", JSON.stringify(stored));
        }
      }
      throw error;
    }
  };

  const addAccount = async (email, password, { activate = true } = {}) => {
    // ✅ FIX: Check if this account is already in the list before logging in
    const alreadyAdded = accounts.find(
      (a) => a.user?.email?.toLowerCase() === email.toLowerCase(),
    );
    if (alreadyAdded) {
      const res = await axios.get(API_ME_URL, {
        headers: { Authorization: `Bearer ${alreadyAdded.token}` },
      });
      const freshUser = res.data?.user;
      if (!freshUser) throw new Error("Session invalide");
      _upsertAccount(alreadyAdded.token, freshUser);
      if (activate) _setActiveAccount(alreadyAdded.token, freshUser);
      return { token: alreadyAdded.token, user: freshUser };
    }

    const response = await loginService({ email, password });
    if (response?.token && response?.user) {
      _upsertAccount(response.token, response.user);
      if (activate) _setActiveAccount(response.token, response.user);
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
        addGoogleAccount,
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
