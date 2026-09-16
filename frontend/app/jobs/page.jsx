'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { jobsService } from '@/services/jobsService';
import { useAuth } from '@/context/AuthContext';
import JobCard from '@/components/jobs/JobCard';
import JobFilter from '@/components/jobs/JobFilter';
import LocationCombobox from '@/components/jobs/LocationCombobox';
import JobDetailPanel from '@/components/jobs/JobDetailPanel';
import { cities } from 'morocco-cities';
import InlineRegisterSection from '@/components/jobs/InlineRegisterSection';
import BusinessAccountGate from '@/components/shared/BusinessAccountGate';
import CompleteProfileBanner from '@/components/jobs/CompleteProfileBanner';
import HeadhunterBanner from '@/components/jobs/HeadhunterBanner';

// ─── Données ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: 'Tous', categoryId: null },
  { label: 'Informatique', categoryId: 'informatique' },
  { label: 'Marketing', categoryId: 'marketing' },
  { label: 'Finance', categoryId: 'finance' },
  { label: 'RH', categoryId: 'rh' },
  { label: 'BTP', categoryId: 'btp' },
  { label: 'Vente', categoryId: 'vente' },
  { label: 'Santé', categoryId: 'sante' },
  { label: 'Logistique', categoryId: 'logistique' },
];

const CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERIM', label: 'Intérim' },
  { value: 'ANAPEC', label: 'ANAPEC' },
  { value: 'TEMPS_PARTIEL', label: 'Temps partiel' },
  { value: 'ALTERNANCE', label: 'Alternance' },
  { value: 'STATUTAIRE', label: 'Statutaire' },
];

// Cities for alert modal
const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});
const ALL_REGIONS = Object.keys(citiesByRegion).sort();

const EMPLOI_SIBLINGS = [
  { label: "Offres d'emploi", href: '/jobs' },
  { label: 'Mini-jobs', href: '/mini-jobs' },
];

// ─── ALERT MODAL ──────────────────────────────────────────────────────────────
function AlertModal({ token, initialFilters, onClose, apiUrl }) {
  const [form, setForm] = useState({
    keyword: initialFilters.search || '',
    categorySlug: initialFilters.categorySlug || '',
    region: initialFilters.region || '',
    city: initialFilters.location || '',
    contractType: initialFilters.contractType || '',
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const regions = ALL_REGIONS;
  const citiesInRegion = form.region
    ? [...(citiesByRegion[form.region] || [])].sort()
    : [];

  useEffect(() => {
    fetch(`${apiUrl}/api/jobs/categories`)
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data); })
      .catch(() => { });
  }, []);

  const handleRegionChange = (region) => {
    setForm(f => ({ ...f, region, city: '' }));
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const filters = {
        ...(form.keyword && { keyword: form.keyword }),
        ...(form.categorySlug && { categorySlug: form.categorySlug }),
        ...(form.region && { region: form.region }),
        ...(form.city && { city: form.city }),
        ...(form.contractType && { contractType: form.contractType }),
      };

      const res = await fetch(`${apiUrl}/api/alerts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ module: 'emploi', filters }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Erreur'); return; }
      setSaved(true);
      setTimeout(() => onClose(), 2000);
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">🔔 Créer une alerte</h2>
            <p className="text-xs text-gray-400 mt-0.5">Soyez notifié dès qu'une offre correspond</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center gap-2 py-8 text-green-700">
            <div className="text-4xl">✅</div>
            <p className="font-semibold">Alerte créée avec succès !</p>
            <p className="text-xs text-gray-400 text-center">
              Vous recevrez une notification pour chaque nouvelle offre correspondante.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mot-clé / Titre du poste</label>
                <input type="text" placeholder="ex: Développeur React, Comptable..."
                  value={form.keyword}
                  onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Catégorie</label>
                <select value={form.categorySlug}
                  onChange={e => setForm(f => ({ ...f, categorySlug: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white">
                  <option value="">Toutes les catégories</option>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Type de contrat</label>
                <select value={form.contractType}
                  onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white">
                  <option value="">Tous les contrats</option>
                  {CONTRACT_TYPES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Région</label>
                <select value={form.region}
                  onChange={e => handleRegionChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white">
                  <option value="">Toutes les régions</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {form.region && citiesInRegion.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Ville</label>
                  <select value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white">
                    <option value="">Toutes les villes</option>
                    {citiesInRegion.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}
            </div>

            {error && <p className="text-red-500 text-xs mb-3 text-center">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
                {saving ? 'Enregistrement...' : "Créer l'alerte"}
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-3 leading-snug">
              📩 Vous recevrez ces alertes par email.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// MobileFilterSheet removed — JobFilter now handles its own mobile drawer

// ─── MOBILE DETAIL BOTTOM SHEET ───────────────────────────────────────────────
function MobileDetailSheet({ jobId, favoritedIds, onFavToggle, onClose }) {
  return (
    <div className="fixed inset-0 z-50 xl:hidden flex flex-col">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl
          flex flex-col overflow-hidden"
        style={{ maxHeight: '92vh', animation: 'slideUpSheet 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}
      >
        <JobDetailPanel
          jobId={jobId}
          onClose={onClose}
          favoritedIds={favoritedIds}
          onFavToggle={onFavToggle}
          isMobileSheet={true}
        />
      </div>

      <style>{`
        @keyframes slideUpSheet {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function JobsPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  // ── Data state ───────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 9 });
  const [activeCategory, setActiveCategory] = useState(null);
  const [favoritedIds, setFavoritedIds] = useState(new Set());

  // ── Search state ─────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [locationValue, setLocationValue] = useState(null); // { type, label, raw }

  // ── Panel / UI state ─────────────────────────────────────────────────────────
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showBusinessGate, setShowBusinessGate] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────────
  const listRef = useRef(null);

  const isVisitor = !user;
  const userRole = user?.role;

  // ── Publish handler ──────────────────────────────────────────────────────────
  const handlePublishClick = () => {
    if (userRole === 'business') {
      router.push('/dashboard/listings/jobs/create');
    } else if (userRole === 'citizen') {
      setShowBusinessGate(true);
    } else {
      const el = document.getElementById('inscription');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ── Fetch jobs ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const [res, favRes] = await Promise.all([
          jobsService.getJobs(filters),
          token
            ? jobsService.getMyFavorites(token).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ]);
        setJobs(res.data);
        setPagination(res.pagination);
        setFavoritedIds(new Set((favRes.data ?? []).map((j) => j.id)));
        // Auto-select first job on desktop when results load
        if (res.data?.length > 0 && !selectedJobId) {
          setSelectedJobId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [filters, token]);

  // ── Filter handlers ──────────────────────────────────────────────────────────
  const handleFilter = (newFilters) => {
    if (Object.keys(newFilters).length === 0) {
      setFilters({ page: 1, limit: 9 });
      setSelectedJobId(null);
      return;
    }
    setFilters((prev) => {
      const merged = { ...prev, ...newFilters, page: 1 };
      Object.keys(merged).forEach((k) => { if (merged[k] === undefined) delete merged[k]; });
      return merged;
    });
    setSelectedJobId(null);
  };

  const handleSearch = useCallback(() => {
    const locationFilter = locationValue
      ? locationValue.type === 'city'
        ? { city: locationValue.raw, region: undefined }
        : { region: locationValue.raw, city: undefined }
      : { city: undefined, region: undefined };

    setFilters((prev) => ({
      ...prev,
      search: searchInput || undefined,
      ...locationFilter,
      page: 1,
    }));
    setSelectedJobId(null);
  }, [searchInput, locationValue]);

  const handleLocationChange = (val) => {
    setLocationValue(val);
  };

  const handleCategoryTab = (cat) => {
    setActiveCategory(cat.categoryId);
    setFilters({
      page: 1,
      limit: 9,
      ...(cat.categoryId && { categorySlug: cat.categoryId }),
    });
    setSelectedJobId(null);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    setSelectedJobId(null);
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Job selection (split-panel) ───────────────────────────────────────────────
  const handleJobClick = (job) => {
    setSelectedJobId(job.id);
    // On small screens show bottom sheet
    if (window.innerWidth < 1280) {
      setMobileDetailOpen(true);
    }
  };

  const handleFavToggle = (jobId) => {
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
  };

  // ── Active filter badge count ─────────────────────────────────────────────────
  const activeFilterKeys = ['categorySlug', 'contractType', 'experienceLevel', 'educationLevel', 'city', 'region', 'salarySpecified'];
  const activeFiltersCount = activeFilterKeys.filter((k) => filters[k]).length;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══ HERO HEADER ══════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 py-7">
        <div className="max-w-[900px] mx-auto px-4 text-center">

          {/* Nav pills + live count */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            {EMPLOI_SIBLINGS.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${s.href === '/jobs'
                    ? 'bg-[#2D5016] text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-[#2D5016] hover:text-[#2D5016]'
                  }`}
              >
                {s.label}
              </Link>
            ))}
            {pagination && (
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#5A8A1A] ml-1">
                {pagination.total} offres
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a2e0a] mb-1.5 leading-tight">
            Trouvez votre prochain emploi
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Des opportunités vérifiées, mises à jour chaque jour
          </p>

          {/* ── SEARCH BAR + FILTER BUTTON (same row) ────────────────────── */}
          <div className="max-w-[806px] mx-auto flex items-center gap-2">
            {/* Advanced filter button — LEFT of search bar */}
            <div className="shrink-0">
              <JobFilter onFilter={handleFilter} />
            </div>

            {/* Search bar */}
            <div className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-0
              sm:items-center sm:border sm:border-gray-200 sm:rounded-2xl sm:bg-white
              sm:shadow-sm sm:hover:border-[#2D5016]/40 sm:transition-colors">

              {/* Keyword input */}
              <div className="flex items-center gap-2 px-3.5 py-1
                border border-gray-200 rounded-xl bg-white sm:border-0 sm:rounded-none
                sm:flex-1 sm:bg-transparent">
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  id="jobs-search-keyword"
                  placeholder="Titre, entreprise, mot-clé..."
                  value={searchInput}
                  className="flex-1 outline-none text-sm text-gray-700 bg-transparent py-2"
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>

              {/* Divider (desktop only) */}
              <div className="hidden sm:block w-px h-7 bg-gray-200 shrink-0" />

              {/* Location combobox */}
              <div className="flex items-center px-3.5 py-1
                border border-gray-200 rounded-xl bg-white sm:border-0 sm:rounded-none
                sm:flex-1 sm:bg-transparent">
                <LocationCombobox
                  value={locationValue}
                  onChange={handleLocationChange}
                  placeholder="Ville, région..."
                />
              </div>

              {/* Search button */}
              <button
                id="jobs-search-btn"
                onClick={handleSearch}
                className="mx-1.5 my-1.5 px-5 py-2.5 rounded-xl bg-[#2D5016] text-white text-sm font-bold
                  hover:bg-[#1a2e0a] transition-colors shrink-0 shadow-sm"
              >
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </div>

      <CompleteProfileBanner user={user} token={token} />
      <HeadhunterBanner user={user} />

      {/* ══ CATEGORY TABS ════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 py-2.5 flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategoryTab(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                ${activeCategory === cat.categoryId
                  ? 'bg-[#2D5016] text-white shadow-sm'
                  : 'bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129] hover:text-white'
                }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Right-side action buttons */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {userRole === 'citizen' && (
              <button
                onClick={() => setShowAlertModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#A7D129] text-[#2D5016] font-semibold text-sm hover:bg-[#E8F5D0] transition-all duration-150"
              >
                🔔 Créer une alerte
              </button>
            )}
            {userRole !== 'admin' && (
              <button
                onClick={handlePublishClick}
                className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#2D5016] text-white font-bold text-sm shadow-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition-all duration-150 hover:scale-105 active:scale-100 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current shrink-0">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
                Publier une annonce
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══════════════════════════════════════════════════════ */}
      <div className="max-w-[1400px] mx-auto px-4 py-4">

        {/* ── LIST + DETAIL PANEL ───────────────────────────────────────────── */}
        <div className="flex gap-5">

          {/* ── JOB LIST ─────────────────────────────────────────────────────── */}
          <main className="flex-1 min-w-0 flex flex-col">

            {/* List header */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <p className="text-sm text-gray-500">
                {pagination ? (
                  <>
                    <span className="font-semibold text-gray-800">{pagination.total}</span> offres trouvées
                  </>
                ) : (
                  <span className="animate-pulse bg-gray-200 rounded w-24 h-4 inline-block" />
                )}
              </p>
            </div>

            {/* Cards */}
            <div ref={listRef} className="flex flex-col gap-3">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                        <div className="flex gap-2 mt-3">
                          <div className="h-6 bg-gray-100 rounded-full w-16" />
                          <div className="h-6 bg-gray-100 rounded-full w-24" />
                          <div className="h-6 bg-gray-100 rounded-full w-20" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : jobs.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-lg font-semibold text-gray-700">Aucune offre trouvée</p>
                  <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    initialFavorited={favoritedIds.has(job.id)}
                    onClick={handleJobClick}
                    isActive={selectedJobId === job.id}
                    onFavoriteToggle={() => handleFavToggle(job.id)}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-1.5 mt-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  ‹
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition ${pagination.page === i + 1
                        ? 'bg-[#A7D129] text-white shadow-sm'
                        : 'bg-white text-[#2D5016] border border-gray-200 hover:border-[#A7D129] hover:bg-[#E8F5D0]'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  ›
                </button>
              </div>
            )}
          </main>

          {/* ── DETAIL PANEL — xl+ only, sticky alongside the list ─────────── */}
          <div
            className="hidden xl:flex flex-col shrink-0"
            style={{ width: '528px' }}
          >
            <div
              className="sticky top-[62px] overflow-hidden"
              style={{ height: 'calc(100vh - 80px)' }}
              key={selectedJobId || 'empty'}
            >
              <JobDetailPanel
                jobId={selectedJobId}
                favoritedIds={favoritedIds}
                onFavToggle={handleFavToggle}
                isMobileSheet={false}
              />
            </div>
          </div>

        </div>{/* end list+detail flex */}
      </div>

      {/* ══ INSCRIPTION SECTION — visiteurs ══════════════════════════════════════ */}
      {isVisitor && (
        <div id="inscription" className="max-w-[1200px] mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#A7D129]/40 to-[#A7D129]/40" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#7BA428]">
              Rejoignez Madinatti
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#A7D129]/40 to-[#A7D129]/40" />
          </div>
          <InlineRegisterSection />
        </div>
      )}

      {/* Mobile filter sheet replaced by JobFilter's built-in drawer */}

      {/* ══ MOBILE DETAIL SHEET ═════════════════════════════════════════════════ */}
      {mobileDetailOpen && selectedJobId && (
        <MobileDetailSheet
          jobId={selectedJobId}
          favoritedIds={favoritedIds}
          onFavToggle={handleFavToggle}
          onClose={() => setMobileDetailOpen(false)}
        />
      )}

      {/* ══ ALERT MODAL ══════════════════════════════════════════════════════════ */}
      {showAlertModal && (
        <AlertModal
          token={token}
          initialFilters={filters}
          onClose={() => setShowAlertModal(false)}
          apiUrl={process.env.NEXT_PUBLIC_API_URL}
        />
      )}

      {/* ══ BUSINESS GATE MODAL ══════════════════════════════════════════════════ */}
      {showBusinessGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowBusinessGate(false); }}
        >
          <div style={{ animation: 'slideUp 0.2s ease-out' }}>
            <BusinessAccountGate onClose={() => setShowBusinessGate(false)} />
          </div>
        </div>
      )}

    </div>
  );
}