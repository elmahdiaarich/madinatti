import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/education`
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

export const educationService = {
  getOptions: async () => {
    const response = await axios.get(`${API_URL}/options`);
    return response.data;
  },
  searchInstitutions: async (params = {}) => {
    const response = await axios.get(`${API_URL}/institutions`, { params });
    return response.data;
  },
  getInstitution: async (slug) => {
    const response = await axios.get(`${API_URL}/institutions/${encodeURIComponent(slug)}`);
    return response.data;
  },
  adminList: async (params = {}) => {
    const response = await axios.get(`${API_URL}/admin/institutions`, { ...authHeaders(), params });
    return response.data;
  },
  createInstitution: async (data) => {
    const response = await axios.post(`${API_URL}/admin/institutions`, data, authHeaders());
    return response.data;
  },
  updateInstitution: async (id, data) => {
    const response = await axios.put(`${API_URL}/admin/institutions/${id}`, data, authHeaders());
    return response.data;
  },
  deleteInstitution: async (id) => {
    const response = await axios.delete(`${API_URL}/admin/institutions/${id}`, authHeaders());
    return response.data;
  },
  publishInstitution: async (id, isPublished) => {
    const response = await axios.patch(`${API_URL}/admin/institutions/${id}/publish`, { isPublished }, authHeaders());
    return response.data;
  },
  importFile: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const response = await axios.post(`${API_URL}/admin/import`, form, multipartAuthHeaders());
    return response.data;
  },
  previewImport: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const response = await axios.post(`${API_URL}/admin/import/preview`, form, multipartAuthHeaders());
    return response.data;
  },
  templateUrl: () => `${API_URL}/admin/import-template`,
};
