/**
 * frontend/services/messageService.js
 * Gère les appels API pour les messages internes Business.
 */

import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const messageService = {
  /**
   * Liste paginée des messages du user connecté.
   * @param {string} token
   * @param {number} page
   * @param {number} limit
   */
  getMessages: async (token, page = 1, limit = 20) => {
    const { data } = await axios.get(`${API_URL}/api/messages`, {
      params:  { page, limit },
      headers: { Authorization: `Bearer ${token}` },
    })
    return data // { success, data, unreadCount, pagination }
  },

  /**
   * Marquer un message comme lu.
   * @param {string} id
   * @param {string} token
   */
  markAsRead: async (id, token) => {
    const { data } = await axios.patch(`${API_URL}/api/messages/${id}/read`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },

  /**
   * Marquer tous les messages comme lus.
   * @param {string} token
   */
  markAllAsRead: async (token) => {
    const { data } = await axios.patch(`${API_URL}/api/messages/read-all`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return data
  },
}
