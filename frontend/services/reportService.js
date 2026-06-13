const API_URL = process.env.NEXT_PUBLIC_API_URL + '/api'

export const reportService = {
  // ─── Public ──────────────────────────────────────────────────────────────────
  /**
   * Soumettre un signalement
   * Disponible pour visiteurs anonymes et utilisateurs connectés
   *
   * @param {{ targetType, targetId, reason, description?, reporterEmail? }} data
   * @param {string|null} token  — JWT si connecté, null si visiteur
   */
  submitReport: async (data, token = null) => {
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Erreur lors du signalement')
    return json // { success, message, data: { id } }
  },

  // ─── Admin ───────────────────────────────────────────────────────────────────
  /**
   * Récupérer la liste des signalements (admin)
   * @param {{ status?, type?, page?, limit?, search? }} params
   * @param {string} token
   */
  getAdminReports: async (params = {}, token) => {
    const query = new URLSearchParams(params).toString()
    const res = await fetch(`${API_URL}/admin/reports?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Erreur récupération signalements')
    return json // { success, data: Report[], pagination }
  },

  /**
   * Mettre à jour le statut / notes d'un signalement (admin)
   * @param {string} id
   * @param {{ status?, adminNotes? }} body
   * @param {string} token
   */
  updateReport: async (id, body, token) => {
    const res = await fetch(`${API_URL}/admin/reports/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Erreur mise à jour signalement')
    return json // { success, data: Report }
  },

  /**
   * Statistiques des signalements (admin)
   * @param {string} token
   */
  getStats: async (token) => {
    const res = await fetch(`${API_URL}/admin/reports/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Erreur récupération stats')
    return json // { success, data: { total, byStatus, byType, byReason } }
  },

  // ─── Admin — Détail ───────────────────────────────────────────────────────────
  /**
   * Détail complet d'un signalement (admin)
   * @param {string} id
   * @param {string} token
   */
  getReportDetail: async (id, token) => {
    const res = await fetch(`${API_URL}/admin/reports/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Erreur chargement détail')
    return json // { success, data: { report, allReporters, listingInfo, owner, ownerListingsCount } }
  },

  // ─── Admin — Actions ──────────────────────────────────────────────────────────
  /** Innocenter : remet l'annonce en ligne, clôt le signalement en REJECTED */
  dismissReport: async (id, token) => {
    const res = await fetch(`${API_URL}/admin/reports/${id}/dismiss`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Erreur')
    return json
  },

  /** Retirer l'annonce : REJECTED + signalement RESOLVED */
  removeListing: async (id, token) => {
    const res = await fetch(`${API_URL}/admin/reports/${id}/listing`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Erreur')
    return json
  },

  /** Suspendre le compte propriétaire */
  suspendOwner: async (id, token) => {
    const res = await fetch(`${API_URL}/admin/reports/${id}/suspend`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Erreur')
    return json
  },

  /** Contacter le propriétaire par email */
  contactOwner: async (id, message, token) => {
    const res = await fetch(`${API_URL}/admin/reports/${id}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Erreur envoi email')
    return json
  },
}
