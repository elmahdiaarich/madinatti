const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

export const statsService = {
  getOverview: async (token) => {
    const res = await fetch(`${API_URL}/business/stats/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur récupération statistiques');
    return json;
  },

  getViewsTimeline: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/business/stats/views-timeline?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur récupération courbe des vues');
    return json;
  },

  getTopListings: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/business/stats/top-listings?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur récupération classement');
    return json;
  },

  getBoostImpact: async (token) => {
    const res = await fetch(`${API_URL}/business/stats/boost-impact`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Erreur récupération impact boost");
    return json;
  },
};