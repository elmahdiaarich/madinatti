import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL + "/api/industriel-zones"
  : (() => { throw new Error("NEXT_PUBLIC_API_URL is not defined"); })();

const getAuthHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const industrielZonesService = {
  getAll: async (filters = {}) => {
    const response = await axios.get(API_URL, { params: filters });
    return response.data;
  },
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },
  create: async (listingData) => {
    const response = await axios.post(API_URL, listingData, getAuthHeaders());
    return response.data;
  },
  update: async (id, listingData) => {
    const response = await axios.put(`${API_URL}/${id}`, listingData, getAuthHeaders());
    return response.data;
  },
  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  },
};