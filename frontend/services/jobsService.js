const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

export const jobsService = {
  getJobs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/jobs?${query}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des offres');
    return res.json();
  },

  getCategories: async () => {
    const res = await fetch(`${API_URL}/jobs/categories`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des catégories');
    return res.json();
  },

  getJobById: async (id) => {
    const res = await fetch(`${API_URL}/jobs/${id}`);
    if (!res.ok) throw new Error('Offre introuvable');
    return res.json();
  },

  createJob: async (data, token) => {
    const res = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur lors de la création');
    return json;
  },

  toggleFavorite: async (jobId, token) => {
    const res = await fetch(`${API_URL}/jobs/${jobId}/favorite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur favori');
    return json; // { success, favorited: true | false }
  },

  getMyFavorites: async (token) => {
    const res = await fetch(`${API_URL}/jobs/favorites/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erreur récupération favoris');
    return res.json();
  },
};