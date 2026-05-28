import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL
console.log("API_URL =", API_URL)


export const register = async (data) => {
  const response = await axios.post(`${API_URL}/api/auth/register`, data)
  return response.data
}

export const login = async (data) => {
  const response = await axios.post(`${API_URL}/api/auth/login`, data)
  return response.data
}

export const logout = async (token) => {
  const response = await axios.post(`${API_URL}/api/auth/logout`, {}, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return response.data
}