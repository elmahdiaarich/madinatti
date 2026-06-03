'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginService, logout as logoutService, register as registerService } from '../services/authService'
import axios from "axios";
const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

useEffect(() => {
  const initAuth = async () => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );

      setUser(res.data.user);

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );
    } catch (err) {
      console.log("Auth refresh failed");

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setUser(null);
      setToken(null);
    }

    setLoading(false);
  };

  initAuth();
}, []);
  const register = async (data) => {
    const response = await registerService(data)
    if (response.token) {
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      setToken(response.token)
      setUser(response.user)
    }
    return response
  }

  const login = async (data) => {
    const response = await loginService(data)
    if (response.token) {
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      setToken(response.token)
      setUser(response.user)
    }
    return response
  }

  const logout = async () => {
    await logoutService(token)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

const loginWithGoogle = (user, token) => {
  setUser(user)
  setToken(token)

  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user)) 
}
  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)