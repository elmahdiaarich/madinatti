import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/shops`
  : (() => {
      throw new Error("NEXT_PUBLIC_API_URL is not defined");
    })();

const authHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const shopService = {
  plans: async () => {
    const response = await axios.get(`${API_URL}/plans`);
    return response.data;
  },
  publicShop: async (slug) => {
    const response = await axios.get(`${API_URL}/public/${encodeURIComponent(slug)}`);
    return response.data;
  },
  mine: async () => {
    const response = await axios.get(`${API_URL}/me`, authHeaders());
    return response.data;
  },
  dashboard: async () => {
    const response = await axios.get(`${API_URL}/dashboard`, authHeaders());
    return response.data;
  },
  create: async (data) => {
    const response = await axios.post(API_URL, data, authHeaders());
    return response.data;
  },
  update: async (id, data) => {
    const response = await axios.put(`${API_URL}/${encodeURIComponent(id)}`, data, authHeaders());
    return response.data;
  },
  updateAccountBoutique: async (data) => {
    const response = await axios.put(`${API_URL}/account-boutique`, data, authHeaders());
    return response.data;
  },
  changePlan: async (id, planId) => {
    const response = await axios.post(`${API_URL}/${encodeURIComponent(id)}/change-plan`, { planId }, authHeaders());
    return response.data;
  },
  paymentAction: async (action) => {
    const response = await axios.post(`${API_URL}/payment-actions/${encodeURIComponent(action)}`, {}, authHeaders());
    return response.data;
  },
  adminList: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/list`, { ...authHeaders(), params });
    return response.data;
  },
  adminUpdate: async (id, data) => {
    const response = await axios.patch(`${API_URL}/admin/${encodeURIComponent(id)}`, data, authHeaders());
    return response.data;
  },
};
