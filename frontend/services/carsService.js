// services/carsService.js

const API_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL + "/api"
  : (() => { throw new Error("NEXT_PUBLIC_API_URL is not defined"); })();

export const carsService = {
  // ── PUBLIC ──────────────────────────────────────────────────────────────────

  getListings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/cars?${query}`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des annonces");
    return res.json();
  },

  getCategories: async () => {
    const res = await fetch(`${API_URL}/cars/categories`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des catégories");
    return res.json();
  },

  getCatalog: async () => {
    const res = await fetch(`${API_URL}/cars/catalog`);
    if (!res.ok) throw new Error("Erreur lors de la récupération des marques et modèles");
    return res.json();
  },

  getListingById: async (id) => {
    const res = await fetch(`${API_URL}/cars/${id}`);
    if (!res.ok) throw new Error("Annonce introuvable");
    return res.json();
  },

  // ── AUTHENTICATED ────────────────────────────────────────────────────────────

  toggleFavorite: async (id, token) => {
    const res = await fetch(`${API_URL}/cars/favorites/${id}/toggle`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur favoris");
    return res.json();
  },

  getFavorites: async (token) => {
    const res = await fetch(`${API_URL}/cars/favorites/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur favoris");
    return res.json();
  },

  createInquiry: async (data, token) => {
    const res = await fetch(`${API_URL}/cars/inquiries`, {
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
    const res = await fetch(`${API_URL}/cars`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
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
    const res = await fetch(`${API_URL}/cars/business/my-listings?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération annonces");
    return res.json();
  },

  getMyListingById: async (id, token) => {
    const res = await fetch(`${API_URL}/cars/business/my-listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Annonce introuvable");
    return res.json();
  },

  updateMyListing: async (id, data, token) => {
    const res = await fetch(`${API_URL}/cars/business/my-listings/${id}`, {
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
    const res = await fetch(`${API_URL}/cars/business/my-listings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur suppression");
    return res.json();
  },

  getMyListingInquiries: async (id, params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(
      `${API_URL}/cars/business/my-listings/${id}/inquiries?${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Erreur récupération messages");
    return res.json();
  },

  updateInquiryStatus: async (inquiryId, status, token) => {
    const res = await fetch(`${API_URL}/cars/business/inquiries/${inquiryId}`, {
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
    const res = await fetch(`${API_URL}/cars/admin/listings?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération annonces");
    return res.json();
  },

  adminGetListingById: async (id, token) => {
    const res = await fetch(`${API_URL}/cars/admin/listings/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Annonce introuvable");
    return res.json();
  },

  getPendingListings: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/cars/admin/pending?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération annonces en attente");
    return res.json();
  },

  moderateListing: async (id, action, adminNotes = "", token) => {
    const res = await fetch(`${API_URL}/cars/admin/${id}/moderate`, {
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

  suspendListing: async (id, adminNotes = "", token) => {
    const res = await fetch(`${API_URL}/cars/admin/${id}/suspend`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ adminNotes }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur suspension");
    return result;
  },

  unsuspendListing: async (id, token) => {
    const res = await fetch(`${API_URL}/cars/admin/${id}/unsuspend`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Erreur réactivation");
    return result;
  },

  adminUpdateListing: async (id, data, token) => {
    const res = await fetch(`${API_URL}/cars/admin/listings/${id}`, {
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
    const res = await fetch(`${API_URL}/cars/admin/listings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur suppression");
    return res.json();
  },

  adminGetListingInquiries: async (id, params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(
      `${API_URL}/cars/admin/listings/${id}/inquiries?${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Erreur récupération messages");
    return res.json();
  },

  adminGetStats: async (token) => {
    const res = await fetch(`${API_URL}/cars/admin/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erreur récupération statistiques");
    return res.json();
  },
};
