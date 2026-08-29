import axios from "axios";
const API = process.env.NEXT_PUBLIC_API_URL;

export const alertService = {
  getMine: async (module, token) => {
    const params = module ? `?module=${module}` : "";
    const res = await axios.get(`${API}/api/alerts${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  create: async (module, filters, token) => {
    const res = await axios.post(
      `${API}/api/alerts`,
      { module, filters },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
  update: async (id, filters, token) => {
    const res = await axios.put(
      `${API}/api/alerts/${id}`,
      { filters },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
  toggle: async (id, token) => {
    const res = await axios.patch(
      `${API}/api/alerts/${id}/toggle`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
  remove: async (id, token) => {
    const res = await axios.delete(`${API}/api/alerts/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};