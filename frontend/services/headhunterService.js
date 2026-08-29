import axios from "axios";
const API = process.env.NEXT_PUBLIC_API_URL;

export const headhunterService = {
  getCandidates: async (filters, token) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, v);
    });
    const res = await axios.get(`${API}/api/headhunter/candidates?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  getFiltersCount: async (token) => {
    const res = await axios.get(`${API}/api/headhunter/filters-count`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  unlockCandidate: async (candidateId, token) => {
    const res = await axios.post(
      `${API}/api/headhunter/candidates/${candidateId}/unlock`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
  getUnlocked: async (filters, token) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, v);
    });
    const res = await axios.get(`${API}/api/headhunter/unlocked?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
  updateUnlockNotes: async (candidateId, notes, token) => {
    const res = await axios.patch(
      `${API}/api/headhunter/candidates/${candidateId}/notes`,
      { notes },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
  exportUnlockedCsv: async (token) => {
    const res = await axios.get(`${API}/api/headhunter/unlocked/export`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob",
    });
    return res.data;
  },
  toggleFavorite: async (candidateId, token) => {
    const res = await axios.post(
      `${API}/api/headhunter/candidates/${candidateId}/favorite`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
  getFavorites: async (filters, token) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, v);
    });
    const res = await axios.get(`${API}/api/headhunter/favorites?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};