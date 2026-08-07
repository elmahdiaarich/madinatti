import axios from "axios";
const API = process.env.NEXT_PUBLIC_API_URL;

export const creditService = {
  getPacks: async (token) => {
    const res = await axios.get(`${API}/api/credits/packs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  getMine: async (token) => {
    const res = await axios.get(`${API}/api/credits/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  purchase: async (packId, token) => {
    const res = await axios.post(
      `${API}/api/credits/purchase`,
      { packId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};