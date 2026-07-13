import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL + "/api/uploads";

const authHeaders = (token) => ({
  headers: {
    "Content-Type": "multipart/form-data",
    Authorization: `Bearer ${token}`,
  },
});

export const uploadService = {
  uploadImage: async (file, token) => {
    const form = new FormData();
    form.append("file", file);
    const response = await axios.post(BASE, form, authHeaders(token));
    return response.data; // { success, url, publicId }
  },
  uploadDocument: async (file, token) => {
    const form = new FormData();
    form.append("file", file);
    const response = await axios.post(`${BASE}/document`, form, authHeaders(token));
    return response.data; // { success, url, publicId }
  },
};