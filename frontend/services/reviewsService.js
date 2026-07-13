const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

export const reviewsService = {
  // ── PUBLIC ──────────────────────────────────────────────────────────────
  getReviews: async (targetType, targetId) => {
    const query = new URLSearchParams({ targetType, targetId }).toString();
    const res = await fetch(`${API_URL}/reviews?${query}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des avis');
    return res.json(); // { success, data: { items, ratingAvg, ratingCount } }
  },

  // ── CITIZEN (auth required) ────────────────────────────────────────────
  createReview: async (data, token) => {
    const res = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Erreur lors de l'envoi de l'avis");
    return json;
  },
};