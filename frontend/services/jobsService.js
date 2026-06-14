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
  getMyJobs: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/jobs/my?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erreur récupération de vos offres');
    return res.json(); // { success, jobs, pagination }
  },
 
  getMyJobById: async (id, token) => {
    // Reuse the owner's own listing — bypass status check by hitting /my/:id
    // Since we don't have a dedicated route, we fetch from getMyJobs with no filter
    // and find locally — OR we just reuse the admin-style fetch. 
    // Simplest: fetch all owned jobs and find by id (fine for small datasets)
    const res = await fetch(`${API_URL}/jobs/my?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erreur récupération de l\'offre');
    const json = await res.json();
    const job = (json.jobs || []).find((j) => j.id === id);
    if (!job) throw new Error('Offre introuvable');
    return { data: job };
  },
 
  updateMyJob: async (id, data, token) => {
    const res = await fetch(`${API_URL}/jobs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur mise à jour');
    return json;
  },
 
  deleteMyJob: async (id, token) => {
    const res = await fetch(`${API_URL}/jobs/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur suppression');
    return json;
  },
  getJobApplications: async (jobId, token) => {
  const res = await fetch(`${API_URL}/jobs/${jobId}/applications`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Erreur chargement candidatures')
  return json // { success: true, data: [...applications] }
},

updateApplicationStatus: async (appId, status, token) => {
  const res = await fetch(`${API_URL}/jobs/applications/${appId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Erreur mise à jour statut')
  return json
},

getMyApplications: async (token) => {
  const res = await fetch(`${API_URL}/jobs/applications/my`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Erreur chargement mes candidatures')
  return json // { success: true, data: [...] }
},
};
