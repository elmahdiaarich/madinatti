/**
 * lib/adminApi.js
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

function getToken(explicitToken) {
  if (explicitToken) return explicitToken
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function apiFetch(path, options = {}, token = null) {
  const resolvedToken = getToken(token)
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(resolvedToken), ...(options.headers ?? {}) },
  })

  if (!res.ok) {
    let message = `HTTP ${res.status}`
    try {
      const body = await res.json()
      console.error('API error body:', body)
      message = body.message || body.error || message
    } catch (_) {}
    throw new Error(message)
  }

  return res.json()
}

// ── Mock data (sera remplacé par real API) ────────────────────────────────────

let mockReports = [
  {
    id: 'r1', listingId: 'l3', listingTitle: 'Comptable Principal', listingModule: 'emploi',
    reportedBy: 'Karim Benali', reportedByEmail: 'karim.benali@gmail.com',
    reason: 'Informations trompeuses.',
    status: 'OPEN', createdAt: '2026-04-10T12:00:00Z',
  },
  {
    id: 'r2', listingId: 'l8', listingTitle: 'Studio meublé — Agdal, Rabat', listingModule: 'immobilier',
    reportedBy: 'Youssef Lahlou', reportedByEmail: 'y.lahlou@outlook.com',
    reason: 'Annonce en double.',
    status: 'OPEN', createdAt: '2026-04-09T16:45:00Z',
  },
  {
    id: 'r3', listingId: 'l9', listingTitle: 'Mercedes-Benz Classe C 200 — 2022', listingModule: 'vehicule',
    reportedBy: 'Salma Idrissi', reportedByEmail: 'salma.idrissi@gmail.com',
    reason: 'Possible arnaque.',
    status: 'OPEN', createdAt: '2026-04-11T09:30:00Z',
  },
  {
    id: 'r4', listingId: 'l2', listingTitle: 'Responsable Marketing Digital', listingModule: 'emploi',
    reportedBy: 'Nadia Cherkaoui', reportedByEmail: 'nadia.cherkaoui@gmail.com',
    reason: "Offre d'emploi fictive.",
    status: 'DISMISSED', createdAt: '2026-04-07T14:00:00Z',
  },
]

// ── LISTINGS ──────────────────────────────────────────────────────────────────

export async function getListings({
  module: mod = 'tous',
  status = '',
  search = '',
  userId = '',
  page = 1,
  token = null,
} = {}) {
  const params = new URLSearchParams({ page })
  if (mod && mod !== 'tous') params.set('module', mod)
  if (status)  params.set('status', status)
  if (search)  params.set('search', search)
  if (userId)  params.set('userId', userId)

  const json = await apiFetch(`/api/admin/listings?${params}`, {}, token)
  return {
    data:       json.data ?? [],
    pagination: json.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
  }
}

// ── OVERVIEW ──────────────────────────────────────────────────────────────────

export async function getOverview(token) {
  const json = await apiFetch('/api/admin/overview', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  return json.data ?? { pending: 0, approvedToday: 0, openReports: 0, totalUsers: 0 }
}

export async function adminDeleteListing(id, token = null) {
  return apiFetch(`/api/admin/listings/${id}`, { method: 'DELETE' }, token)
}

// ── APPROVE / REJECT / UPDATE STATUS ─────────────────────────────────────────

export async function approveListing(id, token = null) {
  const json = await apiFetch(`/api/admin/listings/${id}/approve`, { method: 'PATCH' }, token)
  return { success: true, listing: json.data }
}

/**
 * rejectListing — PATCH /api/admin/listings/:id/reject
 * @param {string} id
 * @param {string} note        — adminNote (raisons internes, stockées en base)
 * @param {string} messageToSend — message envoyé à l'entreprise (BusinessMessage + Notification)
 * @param {string|null} token
 */
export async function rejectListing(id, note, messageToSend = '', token = null) {
  const json = await apiFetch(
    `/api/admin/listings/${id}/reject`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        adminNote:     note,
        messageToSend, // → stocké dans businessMessage.adminMessage
      }),
    },
    token
  )
  return { success: true, listing: json.data }
}

export async function updateListingStatus(id, status, adminNotes = null, token = null, module) {
  const json = await apiFetch(
    `/api/admin/listings/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status, adminNotes, module }) },
    token
  )
  return { success: true, listing: json.data }
}

// ── REPORTS ───────────────────────────────────────────────────────────────────

export async function handleReport(id, body, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const json = await apiFetch(`/api/admin/reports/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(body),
    headers,
  })
  return json
}

// ── USERS ─────────────────────────────────────────────────────────────────────

export async function getUsers({ search = '', role = '', page = 1, token = null } = {}) {
  const params = new URLSearchParams({ page })
  if (role)   params.set('role', role)
  if (search) params.set('search', search)

  const json = await apiFetch(`/api/admin/users?${params}`, {}, token)
  return {
    data:       json.data ?? [],
    pagination: json.pagination ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
  }
}

export async function searchUsers(query = '', token = null) {
  if (!query.trim()) return []
  const params = new URLSearchParams({ search: query, limit: 20 })
  const json = await apiFetch(`/api/admin/users?${params}`, {}, token)
  return (json.data ?? []).map((u) => ({
    id:    u.id,
    name:  u.name,
    email: u.email,
    role:  u.role,
  }))
}

export async function toggleUser(id, token = null) {
  const json = await apiFetch(`/api/admin/users/${id}/toggle`, { method: 'PATCH' }, token)
  return { success: true, isActive: json.isActive }
}

// ── BUSINESSES ────────────────────────────────────────────────────────────────

export async function getBusinesses(token = null) {
  const json = await apiFetch('/api/admin/businesses', {}, token)
  return json.data ?? []
}

// ── SIDEBAR COUNTS ────────────────────────────────────────────────────────────

export async function getSidebarCounts(token = null) {
  try {
    const [overview, emploiRes, immoRes, autoRes, miniJobsRes, reportStats] = await Promise.all([
      apiFetch('/api/admin/overview', {}, token),
      apiFetch('/api/admin/listings?module=emploi&status=PENDING&limit=1', {}, token),
      apiFetch('/api/admin/listings?module=immobilier&status=PENDING&limit=1', {}, token),
      apiFetch('/api/admin/listings?module=automobile&status=PENDING&limit=1', {}, token),
      apiFetch('/api/admin/listings?module=miniJobs&status=PENDING&limit=1', {}, token),
      apiFetch('/api/admin/reports/stats', {}, token),
    ])

    const openReports = reportStats.data?.byStatus?.pending ?? 0

    return {
      overview:     0,
      emploi:       emploiRes.pagination?.total ?? 0,
      immobilier:   immoRes.pagination?.total   ?? 0,
      vehicule:     autoRes.pagination?.total   ?? 0,
      miniJobs:     miniJobsRes.pagination?.total ?? 0,
      // TaskRequest has no PENDING concept (publishes immediately, reactive
      // moderation only) — no meaningful pending-queue badge for it.
      taskRequests: 0,
      signalements: openReports,
      entreprises:  0,
      utilisateurs: 0,
      tourisme:     0,
    }
  } catch {
    return { overview: 0, emploi: 0, immobilier: 0, vehicule: 0, miniJobs: 0, taskRequests: 0, signalements: 0, entreprises: 0, utilisateurs: 0 }
  }
}

// ── CATEGORIES ────────────────────────────────────────────────────────────────

export async function getAdminCategories(module = '', token = null) {
  const params = new URLSearchParams()
  if (module) params.set('module', module)
  const json = await apiFetch(`/api/admin/categories?${params}`, {}, token)
  return json.data ?? []
}

export async function adminCreateCategory({ name, module }, token = null) {
  const json = await apiFetch(
    '/api/admin/categories',
    { method: 'POST', body: JSON.stringify({ name, module }) },
    token
  )
  return json.data
}

export async function adminUpdateCategory(id, { name }, token = null) {
  const json = await apiFetch(
    `/api/admin/categories/${id}`,
    { method: 'PATCH', body: JSON.stringify({ name }) },
    token
  )
  return json.data
}

export async function adminToggleCategory(id, token = null) {
  return apiFetch(`/api/admin/categories/${id}/toggle`, { method: 'PATCH' }, token)
}

export async function adminDeleteCategory(id, token = null) {
  return apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' }, token)
}

export async function adminDeleteModule(module, token = null) {
  return apiFetch(`/api/admin/categories/module/${module}`, { method: 'DELETE' }, token)
}