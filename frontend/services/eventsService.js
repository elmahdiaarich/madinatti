import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/events`
  : (() => {
      throw new Error("NEXT_PUBLIC_API_URL is not defined");
    })();

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const multipartAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "multipart/form-data",
    },
  };
};

export const eventsService = {
  categories: async () => {
    const response = await axios.get(`${API_URL}/categories`);
    return response.data;
  },
  list: async (params = {}) => {
    const response = await axios.get(API_URL, { params });
    return response.data;
  },
  adminList: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin`, { ...authHeaders(), params });
    return response.data;
  },
  mine: async (params = {}) => {
    const response = await axios.get(`${API_URL}/mine`, { ...authHeaders(), params });
    return response.data;
  },
  get: async (idOrSlug) => {
    const response = await axios.get(`${API_URL}/${encodeURIComponent(idOrSlug)}`, authHeaders());
    return response.data;
  },
  occurrences: async (id, params = {}) => {
    const response = await axios.get(`${API_URL}/${encodeURIComponent(id)}/occurrences`, { params });
    return response.data;
  },
  create: async (data) => {
    const response = await axios.post(API_URL, data, authHeaders());
    return response.data;
  },
  update: async (id, data) => {
    const response = await axios.patch(`${API_URL}/${encodeURIComponent(id)}`, data, authHeaders());
    return response.data;
  },
  remove: async (id) => {
    const response = await axios.delete(`${API_URL}/${encodeURIComponent(id)}`, authHeaders());
    return response.data;
  },
  updateStatus: async (id, data) => {
    const response = await axios.patch(`${API_URL}/admin/${encodeURIComponent(id)}/status`, data, authHeaders());
    return response.data;
  },
  addFavorite: async (id) => {
    const response = await axios.post(`${API_URL}/${encodeURIComponent(id)}/favorite`, {}, authHeaders());
    return response.data;
  },
  removeFavorite: async (id) => {
    const response = await axios.delete(`${API_URL}/${encodeURIComponent(id)}/favorite`, authHeaders());
    return response.data;
  },
  favorites: async () => {
    const response = await axios.get(`${API_URL}/favorites/me`, authHeaders());
    return response.data;
  },
  importCsv: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const response = await axios.post(`${API_URL}/admin/import-csv`, form, multipartAuthHeaders());
    return response.data;
  },
  importIcs: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const response = await axios.post(`${API_URL}/admin/import-ics`, form, multipartAuthHeaders());
    return response.data;
  },
};
