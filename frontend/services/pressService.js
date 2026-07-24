import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL + "/api/press"
  : (() => { throw new Error("NEXT_PUBLIC_API_URL is not defined"); })();

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const pressService = {
  getAll: async (filters = {}) => {
    const response = await axios.get(API_URL, { params: filters });
    return response.data;
  },
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },
  getCities: async (language) => {
    const response = await axios.get(`${API_URL}/cities`, { params: { language } });
    return response.data;
  },
  getCategories: async (language) => {
    const params = language ? { language } : {};
    const response = await axios.get(`${API_URL}/categories`, { params });
    return response.data;
  },
  toggleFavorite: async (id) => {
    const response = await axios.post(`${API_URL}/favorites/${id}/toggle`, {}, getAuthHeaders());
    return response.data;
  },
  getFavorites: async () => {
    const response = await axios.get(`${API_URL}/favorites/me`, getAuthHeaders());
    return response.data;
  },
  // ── JOURNALIST ────────────────────────────────────────────────────────────
  // L'image est uploadée au préalable via /api/upload/images (même pattern que WorkerProfile.photo)
  createArticle: async (data) => {
    const response = await axios.post(API_URL, data, getAuthHeaders());
    return response.data;
  },
  updateArticle: async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
    return response.data;
  },
  getMyArticles: async () => {
    const response = await axios.get(`${API_URL}/mine/list`, getAuthHeaders());
    return response.data;
  },
  createCategory: async (name) => {
    const response = await axios.post(`${API_URL}/categories`, { name }, getAuthHeaders());
    return response.data;
  },
};