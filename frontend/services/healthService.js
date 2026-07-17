import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/health`
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

export const healthService = {
  getSubcategories: async () => {
    const response = await axios.get(`${API_URL}/subcategories`);
    return response.data;
  },
  searchPlaces: async (params = {}) => {
    const response = await axios.get(`${API_URL}/places`, { params });
    return response.data;
  },
  getPlace: async (id) => {
    const response = await axios.get(`${API_URL}/places/${encodeURIComponent(id)}`);
    return response.data;
  },
  createPlace: async (data) => {
    const response = await axios.post(`${API_URL}/places`, data, authHeaders());
    return response.data;
  },
  updatePlace: async (id, data) => {
    const response = await axios.put(`${API_URL}/places/${id}`, data, authHeaders());
    return response.data;
  },
  adminList: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/places`, { ...authHeaders(), params });
    return response.data;
  },
  deletePlace: async (id) => {
    const response = await axios.delete(`${API_URL}/places/${id}`, authHeaders());
    return response.data;
  },
  importFile: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const response = await axios.post(`${API_URL}/admin/import`, form, multipartAuthHeaders());
    return response.data;
  },
  templateUrl: () => `${API_URL}/admin/import-template`,
};
