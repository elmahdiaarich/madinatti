const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api";

export const realEstateService = {
  // GET /api/real-estate
  getListings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/real-estate?${query}`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des annonces");
    return res.json();
  },

  // GET /api/real-estate/:id
  getListingById: async (id) => {
    const res = await fetch(`${API_URL}/real-estate/${id}`);
    if (!res.ok) throw new Error("Annonce introuvable");
    return res.json();
  },

  // POST /api/real-estate/favorites/:id/toggle
  toggleFavorite: async (id, token) => {
    const res = await fetch(`${API_URL}/real-estate/favorites/${id}/toggle`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur favoris");
    return res.json();
  },

  // GET /api/real-estate/favorites/me
  getFavorites: async (token) => {
    const res = await fetch(`${API_URL}/real-estate/favorites/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur favoris");
    return res.json();
  },

  // POST /api/real-estate/inquiries
  createInquiry: async (data, token) => {
    const res = await fetch(`${API_URL}/real-estate/inquiries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error || "Erreur envoi message");
    }

    return result; // ✅ FIXED
  },
};
