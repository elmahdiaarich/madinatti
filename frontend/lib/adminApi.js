/**
 * lib/adminApi.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single data layer for the admin dashboard.
 * All components import exclusively from this file — zero direct fetch calls.
 *
 * MOCK MODE (current): returns realistic French data from in-memory arrays.
 * REAL MODE (later): replace only the function bodies below — zero component changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

let mockUsers = [
  { id: 'u1', name: 'Karim Benali', email: 'karim.benali@gmail.com', role: 'citizen', city: 'Casablanca', isActive: true, createdAt: '2025-12-10T08:22:00Z', avatar: null },
  { id: 'u2', name: 'Salma Idrissi', email: 'salma.idrissi@gmail.com', role: 'citizen', city: 'Rabat', isActive: true, createdAt: '2025-12-15T10:45:00Z', avatar: null },
  { id: 'u3', name: 'TechMaroc SARL', email: 'rh@techmaroc.ma', role: 'business', city: 'Casablanca', isActive: true, createdAt: '2025-11-20T09:00:00Z', avatar: null },
  { id: 'u4', name: 'Youssef Lahlou', email: 'y.lahlou@outlook.com', role: 'citizen', city: 'Fès', isActive: false, createdAt: '2026-01-03T14:30:00Z', avatar: null },
  { id: 'u5', name: 'Immo Atlas Group', email: 'contact@immoatlas.ma', role: 'business', city: 'Marrakech', isActive: true, createdAt: '2025-10-05T11:00:00Z', avatar: null },
  { id: 'u6', name: 'Nadia Cherkaoui', email: 'nadia.cherkaoui@gmail.com', role: 'citizen', city: 'Agadir', isActive: true, createdAt: '2026-02-18T16:00:00Z', avatar: null },
  { id: 'u7', name: 'AutoElite Maroc', email: 'ventes@autoelite.ma', role: 'business', city: 'Casablanca', isActive: true, createdAt: '2025-09-12T08:30:00Z', avatar: null },
  { id: 'u8', name: 'Omar Fassi', email: 'o.fassi@gmail.com', role: 'citizen', city: 'Tanger', isActive: true, createdAt: '2026-03-01T12:00:00Z', avatar: null },
]

let mockListings = [
  // ── Emploi ───────────────────────────────────────────────────────────────
  {
    id: 'l1',
    module: 'emploi',
    title: 'Développeur Full Stack React/Node.js',
    company: 'TechMaroc SARL',
    submittedBy: 'TechMaroc SARL',
    submittedByEmail: 'rh@techmaroc.ma',
    submittedById: 'u3',
    city: 'Casablanca',
    contractType: 'CDI',
    description: 'Nous recherchons un développeur Full Stack expérimenté pour rejoindre notre équipe tech. Vous travaillerez sur des projets innovants pour des clients marocains et internationaux. Stack : React, Node.js, PostgreSQL, Docker.',
    status: 'PENDING',
    adminNote: null,
    createdAt: '2026-04-10T09:15:00Z',
    companyHistory: { totalSubmitted: 4, previousRejections: 1 },
  },
  {
    id: 'l2',
    module: 'emploi',
    title: 'Responsable Marketing Digital',
    company: 'CasaMedia Group',
    submittedBy: 'CasaMedia Group',
    submittedByEmail: 'rh@casamedia.ma',
    submittedById: 'u3',
    city: 'Rabat',
    contractType: 'CDI',
    description: 'Pilotez la stratégie marketing digital de notre groupe. Gestion des réseaux sociaux, SEO/SEA, emailing et reporting mensuel. Profil senior requis (5 ans min).',
    status: 'PENDING',
    adminNote: null,
    createdAt: '2026-04-09T14:30:00Z',
    companyHistory: { totalSubmitted: 2, previousRejections: 0 },
  },
  {
    id: 'l3',
    module: 'emploi',
    title: 'Comptable Principal',
    company: 'Fiduciaire Atlas',
    submittedBy: 'Fiduciaire Atlas',
    submittedByEmail: 'contact@fidatlas.ma',
    submittedById: 'u3',
    city: 'Casablanca',
    contractType: 'CDI',
    description: 'Gestion comptable complète : saisie, rapprochement bancaire, déclarations fiscales (TVA, IS), bilan annuel. Maîtrise de Sage 100 exigée.',
    status: 'PUBLISHED',
    adminNote: null,
    createdAt: '2026-04-07T11:00:00Z',
    companyHistory: { totalSubmitted: 6, previousRejections: 0 },
  },
  {
    id: 'l4',
    module: 'emploi',
    title: 'Ingénieur DevOps',
    company: 'CloudSystems Maroc',
    submittedBy: 'CloudSystems Maroc',
    submittedByEmail: 'jobs@cloudsystems.ma',
    submittedById: 'u3',
    city: 'Casablanca',
    contractType: 'CDI',
    description: 'Rejoignez notre équipe infrastructure. Déploiement CI/CD, gestion Kubernetes, monitoring et sécurité cloud. AWS ou GCP requis.',
    status: 'REJECTED',
    adminNote: 'Description insuffisante. Veuillez préciser les technologies exactes et les conditions salariales.',
    createdAt: '2026-04-05T08:45:00Z',
    companyHistory: { totalSubmitted: 3, previousRejections: 1 },
  },
  {
    id: 'l5',
    module: 'emploi',
    title: 'Assistant Ressources Humaines',
    company: 'Holding Benjelloun',
    submittedBy: 'Holding Benjelloun',
    submittedByEmail: 'rh@benjelloun-holding.ma',
    submittedById: 'u3',
    city: 'Rabat',
    contractType: 'CDD',
    description: 'Gestion administrative RH, suivi des présences, préparation paie, rédaction contrats. Poste à pourvoir immédiatement pour un remplacement de congé maternité.',
    status: 'PENDING',
    adminNote: null,
    createdAt: '2026-04-11T07:00:00Z',
    companyHistory: { totalSubmitted: 8, previousRejections: 2 },
  },

  // ── Immobilier ────────────────────────────────────────────────────────────
  {
    id: 'l6',
    module: 'immobilier',
    title: 'Appartement 3 pièces — Maarif, Casablanca',
    company: 'Immo Atlas Group',
    submittedBy: 'Immo Atlas Group',
    submittedByEmail: 'contact@immoatlas.ma',
    submittedById: 'u5',
    city: 'Casablanca',
    contractType: 'Location',
    description: 'Bel appartement de 85m² au 4ème étage avec ascenseur. Salon lumineux, 2 chambres, cuisine équipée, balcon. Quartier calme proche commerces. Disponible immédiatement.',
    status: 'PENDING',
    adminNote: null,
    createdAt: '2026-04-10T10:00:00Z',
    companyHistory: { totalSubmitted: 12, previousRejections: 1 },
  },
  {
    id: 'l7',
    module: 'immobilier',
    title: 'Villa avec piscine — Targa, Marrakech',
    company: 'Immo Atlas Group',
    submittedBy: 'Immo Atlas Group',
    submittedByEmail: 'contact@immoatlas.ma',
    submittedById: 'u5',
    city: 'Marrakech',
    contractType: 'Vente',
    description: 'Magnifique villa de 350m² sur terrain de 600m². 5 chambres, 3 salles de bain, piscine chauffée, jardin paysager. Architecture moderne avec touches marocaines.',
    status: 'PENDING',
    adminNote: null,
    createdAt: '2026-04-08T15:20:00Z',
    companyHistory: { totalSubmitted: 12, previousRejections: 1 },
  },
  {
    id: 'l8',
    module: 'immobilier',
    title: 'Studio meublé — Agdal, Rabat',
    company: 'Nadia Cherkaoui',
    submittedBy: 'Nadia Cherkaoui',
    submittedByEmail: 'nadia.cherkaoui@gmail.com',
    submittedById: 'u6',
    city: 'Rabat',
    contractType: 'Location',
    description: 'Studio de 35m² entièrement meublé et équipé. Idéal pour étudiant ou jeune actif. Proche faculté Mohammed V et gare de Rabat.',
    status: 'PUBLISHED',
    adminNote: null,
    createdAt: '2026-04-06T09:30:00Z',
    companyHistory: { totalSubmitted: 2, previousRejections: 0 },
  },

  // ── Véhicules ─────────────────────────────────────────────────────────────
  {
    id: 'l9',
    module: 'vehicule',
    title: 'Mercedes-Benz Classe C 200 — 2022',
    company: 'AutoElite Maroc',
    submittedBy: 'AutoElite Maroc',
    submittedByEmail: 'ventes@autoelite.ma',
    submittedById: 'u7',
    city: 'Casablanca',
    contractType: 'Vente',
    description: 'Mercedes C200 AMG Line, 45.000 km, première main, carnet d\'entretien complet chez concessionnaire. Toit ouvrant, sièges cuir, caméra 360°. Parfait état.',
    status: 'PENDING',
    adminNote: null,
    createdAt: '2026-04-11T08:00:00Z',
    companyHistory: { totalSubmitted: 35, previousRejections: 3 },
  },
  {
    id: 'l10',
    module: 'vehicule',
    title: 'Dacia Duster 4x4 — 2021',
    company: 'Omar Fassi',
    submittedBy: 'Omar Fassi',
    submittedByEmail: 'o.fassi@gmail.com',
    submittedById: 'u8',
    city: 'Tanger',
    contractType: 'Vente',
    description: 'Duster 4x4 en excellent état, 62.000 km, révision récente. Climatisation, GPS, régulateur de vitesse. Idéal pour les routes de montagne. Prix ferme.',
    status: 'PENDING',
    adminNote: null,
    createdAt: '2026-04-09T17:00:00Z',
    companyHistory: { totalSubmitted: 1, previousRejections: 0 },
  },
  {
    id: 'l11',
    module: 'vehicule',
    title: 'Hyundai Tucson — 2020',
    company: 'AutoElite Maroc',
    submittedBy: 'AutoElite Maroc',
    submittedByEmail: 'ventes@autoelite.ma',
    submittedById: 'u7',
    city: 'Casablanca',
    contractType: 'Vente',
    description: 'Tucson 1.6 T-GDI, 78.000 km, options confort complètes. Toit panoramique, Apple CarPlay, freinage d\'urgence autonome.',
    status: 'REJECTED',
    adminNote: 'Photos manquantes. Veuillez ajouter au moins 4 photos du véhicule (extérieur + intérieur).',
    createdAt: '2026-04-03T10:30:00Z',
    companyHistory: { totalSubmitted: 35, previousRejections: 3 },
  },
]

let mockReports = [
  {
    id: 'r1',
    listingId: 'l3',
    listingTitle: 'Comptable Principal',
    listingModule: 'emploi',
    reportedBy: 'Karim Benali',
    reportedByEmail: 'karim.benali@gmail.com',
    reason: 'Informations trompeuses — le salaire affiché ne correspond pas à la réalité selon plusieurs candidats.',
    status: 'OPEN',
    createdAt: '2026-04-10T12:00:00Z',
  },
  {
    id: 'r2',
    listingId: 'l8',
    listingTitle: 'Studio meublé — Agdal, Rabat',
    listingModule: 'immobilier',
    reportedBy: 'Youssef Lahlou',
    reportedByEmail: 'y.lahlou@outlook.com',
    reason: 'Annonce en double — même bien publié 3 fois sous des prix différents.',
    status: 'OPEN',
    createdAt: '2026-04-09T16:45:00Z',
  },
  {
    id: 'r3',
    listingId: 'l9',
    listingTitle: 'Mercedes-Benz Classe C 200 — 2022',
    listingModule: 'vehicule',
    reportedBy: 'Salma Idrissi',
    reportedByEmail: 'salma.idrissi@gmail.com',
    reason: 'Possible arnaque — vendeur demande un acompte avant visite du véhicule.',
    status: 'OPEN',
    createdAt: '2026-04-11T09:30:00Z',
  },
  {
    id: 'r4',
    listingId: 'l2',
    listingTitle: 'Responsable Marketing Digital',
    listingModule: 'emploi',
    reportedBy: 'Nadia Cherkaoui',
    reportedByEmail: 'nadia.cherkaoui@gmail.com',
    reason: 'Offre d\'emploi fictive — l\'entreprise n\'existe pas à l\'adresse indiquée.',
    status: 'DISMISSED',
    createdAt: '2026-04-07T14:00:00Z',
  },
]

let mockBusinesses = [
  {
    id: 'b1',
    name: 'TechMaroc SARL',
    email: 'rh@techmaroc.ma',
    city: 'Casablanca',
    isActive: true,
    plan: 'Premium',
    totalListings: 4,
    pendingListings: 2,
    rejectedListings: 1,
    publishedListings: 1,
    joinedAt: '2025-11-20T09:00:00Z',
  },
  {
    id: 'b2',
    name: 'Immo Atlas Group',
    email: 'contact@immoatlas.ma',
    city: 'Marrakech',
    isActive: true,
    plan: 'Premium',
    totalListings: 12,
    pendingListings: 2,
    rejectedListings: 1,
    publishedListings: 9,
    joinedAt: '2025-10-05T11:00:00Z',
  },
  {
    id: 'b3',
    name: 'AutoElite Maroc',
    email: 'ventes@autoelite.ma',
    city: 'Casablanca',
    isActive: true,
    plan: 'Standard',
    totalListings: 35,
    pendingListings: 1,
    rejectedListings: 3,
    publishedListings: 31,
    joinedAt: '2025-09-12T08:30:00Z',
  },
  {
    id: 'b4',
    name: 'CasaMedia Group',
    email: 'rh@casamedia.ma',
    city: 'Rabat',
    isActive: true,
    plan: 'Standard',
    totalListings: 2,
    pendingListings: 1,
    rejectedListings: 0,
    publishedListings: 1,
    joinedAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'b5',
    name: 'Fiduciaire Atlas',
    email: 'contact@fidatlas.ma',
    city: 'Casablanca',
    isActive: false,
    plan: 'Standard',
    totalListings: 6,
    pendingListings: 0,
    rejectedListings: 0,
    publishedListings: 6,
    joinedAt: '2025-08-01T09:00:00Z',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────────────────────────────────────

const sleep = (ms = 200) => new Promise((r) => setTimeout(r, ms))

const paginate = (array, page = 1, limit = 10) => {
  const p = parseInt(page)
  const l = parseInt(limit)
  const start = (p - 1) * l
  return {
    data: array.slice(start, start + l),
    pagination: { total: array.length, page: p, limit: l, totalPages: Math.ceil(array.length / l) },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED API FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getOverview()
 * Returns summary stats for the 4 StatCards on the overview page.
 * Real: GET /api/admin/overview
 */
export async function getOverview(token) {
  if (!token) return { pending: 0, approvedToday: 0, openReports: 0, totalUsers: 0 }

  const res = await fetch(`${API_URL}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json.data
}

/**
 * getListings({ module, status, search, page })
 * Returns paginated listings from all modules.
 * module: 'tous' | 'emploi' | 'immobilier' | 'vehicule' | 'signalement'
 * status: 'PENDING' | 'PUBLISHED' | 'REJECTED' | '' (all)
 * Real: GET /api/admin/listings?module=&status=&search=&page=
 */
export async function getListings({ module: mod = 'tous', status = '', search = '', page = 1, token } = {}) {
  if (!token) return { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } }

  const params = new URLSearchParams({
    ...(mod && mod !== 'tous' && { module: mod }),
    ...(status && { status }),
    ...(search && { search }),
    page,
  })
  const res = await fetch(`${API_URL}/api/admin/listings?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return { data: json.data, pagination: json.pagination }
}

/**
 * approveListing(id)
 * Sets listing status to PUBLISHED.
 * Real: PATCH /api/admin/listings/:id/approve
 */
export async function approveListing(id, token) {
  const res = await fetch(`${API_URL}/api/admin/listings/${id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json
}

/**
 * rejectListing(id, note)
 * Sets listing status to REJECTED, saves admin note.
 * Real: PATCH /api/admin/listings/:id/reject  { status: 'REJECTED', adminNote: '...' }
 */
export async function rejectListing(id, note, token) {
  const res = await fetch(`${API_URL}/api/admin/listings/${id}/reject`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ adminNote: note }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.message)
  return json
}

/**
 * getReports()
 * Returns all reports with flagged listing details.
 * Real: GET /api/admin/reports
 */
export async function getReports() {
  await sleep()
  return [...mockReports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * handleReport(id, action)
 * action: 'dismiss' | 'delete'
 * Real: PATCH /api/admin/reports/:id  { action }
 */
export async function handleReport(id, action) {
  await sleep()
  const report = mockReports.find((r) => r.id === id)
  if (!report) throw new Error('Signalement introuvable')

  if (action === 'dismiss') {
    report.status = 'DISMISSED'
  } else if (action === 'delete') {
    const listing = mockListings.find((l) => l.id === report.listingId)
    if (listing) listing.status = 'REJECTED'
    report.status = 'DELETED'
  }

  return { success: true }
}

/**
 * getUsers({ search, role, page })
 * Real: GET /api/admin/users?search=&role=&page=
 */
export async function getUsers({ search = '', role = '', page = 1 } = {}) {
  await sleep()

  let result = [...mockUsers].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (role) result = result.filter((u) => u.role === role)
  if (search) {
    const q = search.toLowerCase()
    result = result.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }

  return paginate(result, page, 10)
}

/**
 * toggleUser(id)
 * Flips isActive on a user.
 * Real: PATCH /api/admin/users/:id/toggle
 */
export async function toggleUser(id) {
  await sleep()
  const user = mockUsers.find((u) => u.id === id)
  if (!user) throw new Error('Utilisateur introuvable')
  user.isActive = !user.isActive
  return { success: true, isActive: user.isActive }
}

/**
 * getBusinesses()
 * Returns business accounts with listing stats.
 * Real: GET /api/admin/businesses
 */
export async function getBusinesses() {
  await sleep()
  return [...mockBusinesses].sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
}

/**
 * getSidebarCounts()
 * Returns badge counts for each sidebar nav item.
 * Real: GET /api/admin/overview (same endpoint, derived)
 */
export async function getSidebarCounts(token) {
  const res = await fetch(`${API_URL}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  if (!json.success) return { emploi: 0, immobilier: 0, vehicule: 0, signalements: 0, entreprises: 0, utilisateurs: 0 }

  // Fetch pending counts per module
  const [jobs, immo] = await Promise.all([
    fetch(`${API_URL}/api/admin/listings?module=emploi&status=PENDING`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    fetch(`${API_URL}/api/admin/listings?module=immobilier&status=PENDING`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
  ])

  return {
    overview: 0,
    emploi:      jobs.pagination?.total || 0,
    immobilier:  immo.pagination?.total || 0,
    vehicule:    0,
    signalements: json.data?.openReports || 0,
    entreprises: 0,
    utilisateurs: 0,
  }
}