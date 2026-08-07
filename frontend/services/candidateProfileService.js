import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export const candidateProfileService = {
  getMine: async (token) => {
    const res = await axios.get(`${API}/api/candidate-profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  update: async (formData, token) => {
    const res = await axios.put(`${API}/api/candidate-profile/me`, formData, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};