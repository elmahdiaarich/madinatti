'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginService, logout as logoutService, register as registerService } from '../services/authService'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

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

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)