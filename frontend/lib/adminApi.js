/**
 * lib/adminApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single data layer for the admin dashboard.
 * All components import exclusively from this file — zero direct fetch calls.
 *
 * Real API endpoints (backend/routes/admin.js):
 *  GET  /api/admin/overview
 *  GET  /api/admin/listings?module=&status=&search=&userId=&page=&limit=
 *  PATCH /api/admin/listings/:id/approve
 *  PATCH /api/admin/listings/:id/reject   body: { adminNote }
 *  PATCH /api/admin/listings/:id/status   body: { status, adminNotes }
 *  GET  /api/admin/users?search=&role=&page=&limit=
 *  PATCH /api/admin/users/:id/toggle
 *  GET  /api/admin/businesses
 *  GET  /api/admin/reports
 *  PATCH /api/admin/reports/:id
 *  GET  /api/admin/categories
 *  POST /api/admin/categories
 *  PATCH /api/admin/categories/:id
 *  PATCH /api/admin/categories/:id/toggle
 *  DELETE /api/admin/categories/:id
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA  (reports, businesses — not yet in backend)
// ─────────────────────────────────────────────────────────────────────────────
 
// let mockUsers = [
//   { id: 'u1', name: 'Karim Benali', email: 'karim.benali@gmail.com', role: 'citizen', city: 'Casablanca', isActive: true, createdAt: '2025-12-10T08:22:00Z', avatar: null },
//   { id: 'u2', name: 'Salma Idrissi', email: 'salma.idrissi@gmail.com', role: 'citizen', city: 'Rabat', isActive: true, createdAt: '2025-12-15T10:45:00Z', avatar: null },
//   { id: 'u3', name: 'TechMaroc SARL', email: 'rh@techmaroc.ma', role: 'business', city: 'Casablanca', isActive: true, createdAt: '2025-11-20T09:00:00Z', avatar: null },
//   { id: 'u4', name: 'Youssef Lahlou', email: 'y.lahlou@outlook.com', role: 'citizen', city: 'Fès', isActive: false, createdAt: '2026-01-03T14:30:00Z', avatar: null },
//   { id: 'u5', name: 'Immo Atlas Group', email: 'contact@immoatlas.ma', role: 'business', city: 'Marrakech', isActive: true, createdAt: '2025-10-05T11:00:00Z', avatar: null },
//   { id: 'u6', name: 'Nadia Cherkaoui', email: 'nadia.cherkaoui@gmail.com', role: 'citizen', city: 'Agadir', isActive: true, createdAt: '2026-02-18T16:00:00Z', avatar: null },
//   { id: 'u7', name: 'AutoElite Maroc', email: 'ventes@autoelite.ma', role: 'business', city: 'Casablanca', isActive: true, createdAt: '2025-09-12T08:30:00Z', avatar: null },
//   { id: 'u8', name: 'Omar Fassi', email: 'o.fassi@gmail.com', role: 'citizen', city: 'Tanger', isActive: true, createdAt: '2026-03-01T12:00:00Z', avatar: null },
// ]
 
// let mockListings = [
//   // ── Emploi ───────────────────────────────────────────────────────────────
//   {
//     id: 'l1',
//     module: 'emploi',
//     title: 'Développeur Full Stack React/Node.js',
//     company: 'TechMaroc SARL',
//     submittedBy: 'TechMaroc SARL',
//     submittedByEmail: 'rh@techmaroc.ma',
//     submittedById: 'u3',
//     city: 'Casablanca',
//     contractType: 'CDI',
//     description: 'Nous recherchons un développeur Full Stack expérimenté pour rejoindre notre équipe tech. Vous travaillerez sur des projets innovants pour des clients marocains et internationaux. Stack : React, Node.js, PostgreSQL, Docker.',
//     status: 'PENDING',
//     adminNote: null,
//     createdAt: '2026-04-10T09:15:00Z',
//     companyHistory: { totalSubmitted: 4, previousRejections: 1 },
//   },
//   {
//     id: 'l2',
//     module: 'emploi',
//     title: 'Responsable Marketing Digital',
//     company: 'CasaMedia Group',
//     submittedBy: 'CasaMedia Group',
//     submittedByEmail: 'rh@casamedia.ma',
//     submittedById: 'u3',
//     city: 'Rabat',
//     contractType: 'CDI',
//     description: 'Pilotez la stratégie marketing digital de notre groupe. Gestion des réseaux sociaux, SEO/SEA, emailing et reporting mensuel. Profil senior requis (5 ans min).',
//     status: 'PENDING',
//     adminNote: null,
//     createdAt: '2026-04-09T14:30:00Z',
//     companyHistory: { totalSubmitted: 2, previousRejections: 0 },
//   },
//   {
//     id: 'l3',
//     module: 'emploi',
//     title: 'Comptable Principal',
//     company: 'Fiduciaire Atlas',
//     submittedBy: 'Fiduciaire Atlas',
//     submittedByEmail: 'contact@fidatlas.ma',
//     submittedById: 'u3',
//     city: 'Casablanca',
//     contractType: 'CDI',
//     description: 'Gestion comptable complète : saisie, rapprochement bancaire, déclarations fiscales (TVA, IS), bilan annuel. Maîtrise de Sage 100 exigée.',
//     status: 'APPROVED',
//     adminNote: null,
//     createdAt: '2026-04-07T11:00:00Z',
//     companyHistory: { totalSubmitted: 6, previousRejections: 0 },
//   },
//   {
//     id: 'l4',
//     module: 'emploi',
//     title: 'Ingénieur DevOps',
//     company: 'CloudSystems Maroc',
//     submittedBy: 'CloudSystems Maroc',
//     submittedByEmail: 'jobs@cloudsystems.ma',
//     submittedById: 'u3',
//     city: 'Casablanca',
//     contractType: 'CDI',
//     description: 'Rejoignez notre équipe infrastructure. Déploiement CI/CD, gestion Kubernetes, monitoring et sécurité cloud. AWS ou GCP requis.',
//     status: 'REJECTED',
//     adminNote: 'Description insuffisante. Veuillez préciser les technologies exactes et les conditions salariales.',
//     createdAt: '2026-04-05T08:45:00Z',
//     companyHistory: { totalSubmitted: 3, previousRejections: 1 },
//   },
//   {
//     id: 'l5',
//     module: 'emploi',
//     title: 'Assistant Ressources Humaines',
//     company: 'Holding Benjelloun',
//     submittedBy: 'Holding Benjelloun',
//     submittedByEmail: 'rh@benjelloun-holding.ma',
//     submittedById: 'u3',
//     city: 'Rabat',
//     contractType: 'CDD',
//     description: 'Gestion administrative RH, suivi des présences, préparation paie, rédaction contrats. Poste à pourvoir immédiatement pour un remplacement de congé maternité.',
//     status: 'PENDING',
//     adminNote: null,
//     createdAt: '2026-04-11T07:00:00Z',
//     companyHistory: { totalSubmitted: 8, previousRejections: 2 },
//   },
 
//   // ── Véhicules ─────────────────────────────────────────────────────────────
//   {
//     id: 'l9',
//     module: 'vehicule',
//     title: 'Mercedes-Benz Classe C 200 — 2022',
//     company: 'AutoElite Maroc',
//     submittedBy: 'AutoElite Maroc',
//     submittedByEmail: 'ventes@autoelite.ma',
//     submittedById: 'u7',
//     city: 'Casablanca',
//     contractType: 'Vente',
//     description: 'Mercedes C200 AMG Line, 45.000 km, première main, carnet d\'entretien complet chez concessionnaire. Toit ouvrant, sièges cuir, caméra 360°. Parfait état.',
//     status: 'PENDING',
//     adminNote: null,
//     createdAt: '2026-04-11T08:00:00Z',
//     companyHistory: { totalSubmitted: 35, previousRejections: 3 },
//   },
//   {
//     id: 'l10',
//     module: 'vehicule',
//     title: 'Dacia Duster 4x4 — 2021',
//     company: 'Omar Fassi',
//     submittedBy: 'Omar Fassi',
//     submittedByEmail: 'o.fassi@gmail.com',
//     submittedById: 'u8',
//     city: 'Tanger',
//     contractType: 'Vente',
//     description: 'Duster 4x4 en excellent état, 62.000 km, révision récente. Climatisation, GPS, régulateur de vitesse. Idéal pour les routes de montagne. Prix ferme.',
//     status: 'PENDING',
//     adminNote: null,
//     createdAt: '2026-04-09T17:00:00Z',
//     companyHistory: { totalSubmitted: 1, previousRejections: 0 },
//   },
//   {
//     id: 'l11',
//     module: 'vehicule',
//     title: 'Hyundai Tucson — 2020',
//     company: 'AutoElite Maroc',
//     submittedBy: 'AutoElite Maroc',
//     submittedByEmail: 'ventes@autoelite.ma',
//     submittedById: 'u7',
//     city: 'Casablanca',
//     contractType: 'Vente',
//     description: 'Tucson 1.6 T-GDI, 78.000 km, options confort complètes. Toit panoramique, Apple CarPlay, freinage d\'urgence autonome.',
//     status: 'REJECTED',
//     adminNote: 'Photos manquantes. Veuillez ajouter au moins 4 photos du véhicule (extérieur + intérieur).',
//     createdAt: '2026-04-03T10:30:00Z',
//     companyHistory: { totalSubmitted: 35, previousRejections: 3 },
//   },
// ]

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

let mockBusinesses = [
  { id: 'b1', name: 'TechMaroc SARL', email: 'rh@techmaroc.ma', city: 'Casablanca', isActive: true, plan: 'Premium', totalListings: 4, pendingListings: 2, rejectedListings: 1, publishedListings: 1, joinedAt: '2025-11-20T09:00:00Z' },
  { id: 'b2', name: 'Immo Atlas Group', email: 'contact@immoatlas.ma', city: 'Marrakech', isActive: true, plan: 'Premium', totalListings: 12, pendingListings: 2, rejectedListings: 1, publishedListings: 9, joinedAt: '2025-10-05T11:00:00Z' },
  { id: 'b3', name: 'AutoElite Maroc', email: 'ventes@autoelite.ma', city: 'Casablanca', isActive: true, plan: 'Standard', totalListings: 35, pendingListings: 1, rejectedListings: 3, publishedListings: 31, joinedAt: '2025-09-12T08:30:00Z' },
  { id: 'b4', name: 'CasaMedia Group', email: 'rh@casamedia.ma', city: 'Rabat', isActive: true, plan: 'Standard', totalListings: 2, pendingListings: 1, rejectedListings: 0, publishedListings: 1, joinedAt: '2026-01-15T10:00:00Z' },
  { id: 'b5', name: 'Fiduciaire Atlas', email: 'contact@fidatlas.ma', city: 'Casablanca', isActive: false, plan: 'Standard', totalListings: 6, pendingListings: 0, rejectedListings: 0, publishedListings: 6, joinedAt: '2025-08-01T09:00:00Z' },
]


// ─────────────────────────────────────────────────────────────────────────────
// LISTINGS — real API for all modules
// ─────────────────────────────────────────────────────────────────────────────

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
 
// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW  (real API — /api/admin/overview)
// ─────────────────────────────────────────────────────────────────────────────

export async function getOverview(token) {
  const json = await apiFetch('/api/admin/overview', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  return json.data ?? { pending: 0, approvedToday: 0, openReports: 0, totalUsers: 0 }
}

export async function adminDeleteListing(id, token = null) {
  return apiFetch(`/api/admin/listings/${id}`, { method: 'DELETE' }, token)
}

// ─────────────────────────────────────────────────────────────────────────────
// APPROVE / REJECT / UPDATE STATUS — real API
// ─────────────────────────────────────────────────────────────────────────────



export async function approveListing(id, token = null) {
  const json = await apiFetch(`/api/admin/listings/${id}/approve`, { method: 'PATCH' }, token)
  return { success: true, listing: json.data }
}

export async function rejectListing(id, note, token = null) {
  const json = await apiFetch(
    `/api/admin/listings/${id}/reject`,
    { method: 'PATCH', body: JSON.stringify({ adminNote: note }) },
    token
  )
  return { success: true, listing: json.data }
}

export async function updateListingStatus(id, status, adminNotes = null, token = null, module) {
  console.log("status apiadmin: ", status )
  console.log("notes in apiadmin: ", adminNotes )
  const json = await apiFetch(
    `/api/admin/listings/${id}/status`,
    { method: 'PATCH', body: JSON.stringify({ status, adminNotes, module }) },
    token
  )
  return { success: true, listing: json.data }
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS  (mock — no Report model yet)
// ─────────────────────────────────────────────────────────────────────────────

// export async function getReports() {
//   return [...mockReports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
// }

// export async function handleReport(id, action) {
//   const report = mockReports.find((r) => r.id === id)
//   if (!report) throw new Error('Signalement introuvable')
//   if (action === 'dismiss') {
//     report.status = 'DISMISSED'
//   } else if (action === 'delete') {
//     report.status = 'DELETED'
//   }
// }

/**
 * handleReport(id, body, token)
 * PATCH /api/admin/reports/:id   body: { status?, adminNotes? }
 */
export async function handleReport(id, body, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const json = await apiFetch(`/api/admin/reports/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(body),
    headers,
  })
  return json
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS — real API
// ─────────────────────────────────────────────────────────────────────────────


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

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESSES — real API
// ─────────────────────────────────────────────────────────────────────────────

export async function getBusinesses(token = null) {
  const json = await apiFetch('/api/admin/businesses', {}, token)
  return json.data ?? []
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR COUNTS — real API overview + reports
// ─────────────────────────────────────────────────────────────────────────────

export async function getSidebarCounts(token = null) {
  try {
    const [overview, emploiRes, immoRes] = await Promise.all([
      apiFetch('/api/admin/overview', {}, token),
      apiFetch('/api/admin/listings?module=emploi&status=PENDING&limit=1', {}, token),
      apiFetch('/api/admin/listings?module=immobilier&status=PENDING&limit=1', {}, token),
    ])

    const openReports = mockReports.filter((r) => r.status === 'OPEN').length

    return {
      overview:     0,
      emploi:       emploiRes.pagination?.total ?? 0,
      immobilier:   immoRes.pagination?.total   ?? 0,
      vehicule:     0,
      signalements: openReports,
      entreprises:  0,
      utilisateurs: 0,
    }
  } catch {
    return {
      overview: 0, emploi: 0, immobilier: 0,
      vehicule: 0, signalements: 0, entreprises: 0, utilisateurs: 0,
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES — real API
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdminCategories(parentSlug = '', token = null) {
  const params = new URLSearchParams()
  if (parentSlug) params.set('parentSlug', parentSlug)
  const json = await apiFetch(`/api/admin/categories?${params}`, {}, token)
  return json.data ?? []
}

export async function adminCreateCategory({ name, parentId }, token = null) {
  const json = await apiFetch(
    '/api/admin/categories',
    { method: 'POST', body: JSON.stringify({ name, parentId }) },
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