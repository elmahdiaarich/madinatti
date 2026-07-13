const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api';

export const taskRequestsService = {
  // ── PUBLIC (soft auth — pass token if available for category-priority sort) ──
  searchTaskRequests: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_URL}/task-requests?${query}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Erreur lors de la récupération des demandes');
    return res.json(); // { success, data: { items, total, page, totalPages } }
  },

  getTaskRequestById: async (id) => {
    const res = await fetch(`${API_URL}/task-requests/${id}`);
    if (!res.ok) throw new Error('Demande introuvable');
    return res.json();
  },

  // ── CITIZEN (auth required) ────────────────────────────────────────────
  getMyTaskRequests: async (token) => {
    const res = await fetch(`${API_URL}/task-requests/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Erreur récupération de vos demandes');
    return res.json();
  },

  createTaskRequest: async (data, token) => {
    const res = await fetch(`${API_URL}/task-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur lors de la création de la demande');
    return json;
  },

  markCompleted: async (id, token) => {
    const res = await fetch(`${API_URL}/task-requests/${id}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur lors de la validation');
    return json;
  },

  cancelAcceptance: async (id, cancelReason, token) => {
    const res = await fetch(`${API_URL}/task-requests/${id}/cancel-acceptance`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cancelReason }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Erreur lors de l'annulation");
    return json;
  },

  // ── TASK APPLICATIONS (mounted separately at /api/task-applications) ──────
  applyToTaskRequest: async (taskRequestId, message, token) => {
    const res = await fetch(`${API_URL}/task-applications/task-requests/${taskRequestId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });
    const json = await res.json();
    if (!res.ok) {
      const err = new Error(json.message || 'Erreur lors de la candidature');
      err.code = json.code;
      err.taskRequestId = json.taskRequestId;
      throw err;
    }
    return json;
  },

  getApplicationsForTaskRequest: async (taskRequestId, token) => {
    const res = await fetch(`${API_URL}/task-applications/task-requests/${taskRequestId}/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur récupération des candidatures');
    return json;
  },

  acceptApplication: async (applicationId, token) => {
    const res = await fetch(`${API_URL}/task-applications/${applicationId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Erreur lors de l'acceptation");
    return json;
  },
};