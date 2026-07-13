const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

export const workerProfilesService = {
  // ── PUBLIC ──────────────────────────────────────────────────────────────
  searchWorkerProfiles: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/worker-profiles?${query}`);
    if (!res.ok) throw new Error('Erreur lors de la récupération des profils prestataire');
    return res.json(); // { success, data: { items, total, page, totalPages } }
  },

  getWorkerProfileById: async (id) => {
    const res = await fetch(`${API_URL}/worker-profiles/${id}`);
    if (!res.ok) throw new Error('Profil introuvable');
    return res.json();
  },

  // ── CITIZEN (auth required) ────────────────────────────────────────────
  getMyWorkerProfiles: async (token) => {
    const res = await fetch(`${API_URL}/worker-profiles/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erreur récupération de vos profils prestataire');
    return res.json();
  },

  createWorkerProfile: async (data, token) => {
    const res = await fetch(`${API_URL}/worker-profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur lors de la création du profil');
    return json;
  },

  updateWorkerProfile: async (id, data, token) => {
    const res = await fetch(`${API_URL}/worker-profiles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur mise à jour du profil');
    return json;
  },

  toggleActive: async (id, isActive, token) => {
    const res = await fetch(`${API_URL}/worker-profiles/${id}/active`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur mise à jour du statut');
    return json;
  },

  deleteWorkerProfile: async (id, token, force = false) => {
    const res = await fetch(`${API_URL}/worker-profiles/${id}${force ? '?force=true' : ''}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.message || 'Erreur suppression du profil');
      err.code = json.code;
      err.activeCount = json.activeCount;
      throw err;
    }
    return json;
  },
};