const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api";

export const realEstateService = {
  // ── PUBLIC ──────────────────────────────────────────────────────────────────

  getListings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/real-estate?${query}`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des annonces");
    return res.json();
  },

  getCategories: async () => {
    const res = await fetch(`${API_URL}/real-estate/categories`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des catégories");
    return res.json();
  },

  getListingById: async (id) => {
    const res = await fetch(`${API_URL}/real-estate/${id}`);
    if (!res.ok) throw new Error("Annonce introuvable");
    return res.json();
  },

  // ── AUTHENTICATED ────────────────────────────────────────────────────────────

  toggleFavorite: async (id, token) => {
    const res = await fetch(`${API_URL}/real-estate/favorites/${id}/toggle`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur favoris");
    return res.json();
  },

  getFavorites: async (token) => {
    const res = await fetch(`${API_URL}/real-estate/favorites/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur favoris");
    return res.json();
  },

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
    if (!res.ok) throw new Error(result.error || "Erreur envoi message");
    return result;
  },

  // ── BUSINESS ─────────────────────────────────────────────────────────────────

  createListing: async (data, token) => {
    const res = await fetch(`${API_URL}/real-estate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    console.log(data);
    const result = await res.json();
    if (!res.ok) {
      throw new Error(
        result.message || result.errors?.join(", ") || "Erreur création annonce"
      );
    }
    return result;
  },

  getMyListings: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/real-estate/business/my-listings?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération annonces");
    return res.json();
  },

  getMyListingById: async (id, token) => {
    const res = await fetch(`${API_URL}/real-estate/business/my-listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Annonce introuvable");
    return res.json();
  },

  updateMyListing: async (id, data, token) => {
    const res = await fetch(`${API_URL}/real-estate/business/my-listings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur mise à jour");
    return result;
  },

  deleteMyListing: async (id, token) => {
    const res = await fetch(`${API_URL}/real-estate/business/my-listings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur suppression");
    return res.json();
  },

  getMyListingInquiries: async (id, params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(
      `${API_URL}/real-estate/business/my-listings/${id}/inquiries?${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Erreur récupération messages");
    return res.json();
  },

  updateInquiryStatus: async (inquiryId, status, token) => {
    const res = await fetch(`${API_URL}/real-estate/business/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur mise à jour statut");
    return result;
  },

  // ── ADMIN ─────────────────────────────────────────────────────────────────────

  adminGetAllListings: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/real-estate/admin/listings?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération annonces");
    return res.json();
  },

  adminGetListingById: async (id, token) => {
    const res = await fetch(`${API_URL}/real-estate/admin/listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Annonce introuvable");
    return res.json();
  },

  getPendingListings: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/real-estate/admin/pending?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération annonces en attente");
    return res.json();
  },

  moderateListing: async (id, action, adminNotes = "", token) => {
    const res = await fetch(`${API_URL}/real-estate/admin/${id}/moderate`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, adminNotes }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur modération");
    return result;
  },

  adminUpdateListing: async (id, data, token) => {
    const res = await fetch(`${API_URL}/real-estate/admin/listings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur mise à jour");
    return result;
  },

  adminDeleteListing: async (id, token) => {
    const res = await fetch(`${API_URL}/real-estate/admin/listings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur suppression");
    return res.json();
  },

  adminGetListingInquiries: async (id, params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(
      `${API_URL}/real-estate/admin/listings/${id}/inquiries?${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Erreur récupération messages");
    return res.json();
  },

  adminGetStats: async (token) => {
    const res = await fetch(`${API_URL}/real-estate/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération statistiques");
    return res.json();
  },
};