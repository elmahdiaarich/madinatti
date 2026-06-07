const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

export const jobsService = {
  // GET /api/jobs
  getJobs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/jobs?${query}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des offres');
    return res.json();
  },

  // GET /api/jobs/:id
  getJobById: async (id) => {
    const res = await fetch(`${API_URL}/jobs/${id}`);
    if (!res.ok) throw new Error('Offre introuvable');
    return res.json();
  },

  // POST /api/jobs  — business only
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
};