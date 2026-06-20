"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { jobsService } from "@/services/jobsService";
import { useAuth } from "@/context/AuthContext";
import JobCard from "@/components/jobs/JobCard";
import JobFilter from "@/components/jobs/JobFilter";
import { cities } from "morocco-cities";
import InlineRegisterSection from "@/components/jobs/InlineRegisterSection";

// ─── Données ──────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { label: "Tous", categoryId: null },
  { label: "Informatique", categoryId: "informatique" },
  { label: "Marketing", categoryId: "marketing" },
  { label: "Finance", categoryId: "finance" },
  { label: "RH", categoryId: "rh" },
  { label: "BTP", categoryId: "btp" },
  { label: "Vente", categoryId: "vente" },
  { label: "Santé", categoryId: "sante" },
  { label: "Logistique", categoryId: "logistique" },
];

// ─── CONTRACT TYPE OPTIONS ────────────────────────────────────────────────────
const CONTRACT_TYPES = [
  { value: "CDI", label: "CDI" },
  { value: "CDD", label: "CDD" },
  { value: "STAGE", label: "Stage" },
  { value: "FREELANCE", label: "Freelance" },
  { value: "INTERIM", label: "Intérim" },
  { value: "ANAPEC", label: "ANAPEC" },
  { value: "TEMPS_PARTIEL", label: "Temps partiel" },
  { value: "ALTERNANCE", label: "Alternance" },
  { value: "STATUTAIRE", label: "Statutaire" },
];

// ─── Villes par région (morocco-cities) ───────────────────────────────────────
const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

const ALL_REGIONS = Object.keys(citiesByRegion).sort();

// ─── ALERT MODAL COMPONENT ────────────────────────────────────────────────────
function AlertModal({ token, initialFilters, onClose, apiUrl }) {
  const [form, setForm] = useState({
    keyword:      initialFilters.search       || '',
    categorySlug: initialFilters.categorySlug || '',
    region:       initialFilters.region       || '',
    city:         initialFilters.city         || '',
    contractType: initialFilters.contractType || '',
    remote:       initialFilters.remote       || '',
  });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');


  const regions = ALL_REGIONS;
  const citiesInRegion = form.region
    ? [...(citiesByRegion[form.region] || [])].sort()
    : [];

  useEffect(() => {
    fetch(`${apiUrl}/api/jobs/categories`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      })
      .catch(() => {});
  }, []);

  const handleRegionChange = (region) => {
    setForm((f) => ({ ...f, region, city: "" }));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const filters = {
        ...(form.keyword && { keyword: form.keyword }),
        ...(form.categorySlug && { categorySlug: form.categorySlug }),
        ...(form.region && { region: form.region }),
        ...(form.city && { city: form.city }),
        ...(form.contractType && { contractType: form.contractType }),
        ...(form.remote       && { remote:       form.remote }),
      };

      const res = await fetch(`${apiUrl}/api/alerts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ module: "emploi", filters }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Erreur");
        return;
      }
      setSaved(true);
      setTimeout(() => onClose(), 2000);
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              🔔 Créer une alerte
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Soyez notifié dès qu'une offre correspond
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {saved ? (
          <div className="flex flex-col items-center gap-2 py-8 text-green-700">
            <div className="text-4xl">✅</div>
            <p className="font-semibold">Alerte créée avec succès !</p>
            <p className="text-xs text-gray-400 text-center">
              Vous recevrez une notification pour chaque nouvelle offre
              correspondante.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 mb-5">
              {/* Keyword */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Mot-clé / Titre du poste
                </label>
                <input
                  type="text"
                  placeholder="ex: Développeur React, Comptable..."
                  value={form.keyword}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, keyword: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Catégorie
                </label>
                <select
                  value={form.categorySlug}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categorySlug: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contract type */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Type de contrat
                </label>
                <select
                  value={form.contractType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contractType: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                >
                  <option value="">Tous les contrats</option>
                  {CONTRACT_TYPES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode de travail */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Mode de travail</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { value: '',        icon: '🔍', label: 'Tous',       desc: 'Peu importe' },
                    { value: 'ON_SITE', icon: '🏢', label: 'Présentiel', desc: 'Sur site uniquement' },
                    { value: 'REMOTE',  icon: '🌍', label: 'Remote',     desc: 'Travail à distance' },
                    { value: 'HYBRID',  icon: '🔀', label: 'Hybride',    desc: 'Mix présentiel/remote' },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, remote: r.value }))}
                      className={`p-3 rounded-xl border-2 text-center transition-all
                        ${form.remote === r.value
                          ? 'border-[#A7D129] bg-[#E8F5D0]'
                          : 'border-gray-200 hover:border-[#A7D129]/50 bg-white'
                        }`}
                    >
                      <div className="text-xl mb-1">{r.icon}</div>
                      <div className="text-[11px] font-bold text-[#2D5016] leading-tight">{r.label}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5 leading-tight">{r.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Region (morocco-cities) */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">
                  Région
                </label>
                <select
                  value={form.region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                >
                  <option value="">Toutes les régions</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* City — only shown if region selected and has cities (morocco-cities) */}
              {form.region && citiesInRegion.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">
                    Ville
                  </label>
                  <select
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] focus:ring-1 focus:ring-[#A7D129] transition bg-white"
                  >
                    <option value="">Toutes les villes</option>
                    {citiesInRegion.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-xs mb-3 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60"
              >
                {saving ? "Enregistrement..." : "Créer l'alerte"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Scroll helper ────────────────────────────────────────────────────────────
const scrollToInscription = () => {
  const el = document.getElementById("inscription");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

// ─── Page principale ──────────────────────────────────────────────────────────
export default function JobsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Build initial filters from URL — track if they came from hero
  const heroParams = ["region", "city", "categoryId", "contractType", "search"];
  const hasHeroFilters = heroParams.some((k) => searchParams.get(k));

  const [filters, setFilters] = useState(() => {
    const init = { page: 1, limit: 9 };
    if (searchParams.get("region")) init.region = searchParams.get("region");
    if (searchParams.get("city")) init.city = searchParams.get("city");
    if (searchParams.get("categoryId"))
      init.categoryId = searchParams.get("categoryId");
    if (searchParams.get("contractType"))
      init.contractType = searchParams.get("contractType");
    if (searchParams.get("search")) init.search = searchParams.get("search");
    return init;
  });

  const [fromHero, setFromHero] = useState(hasHeroFilters);

  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [favoritedIds, setFavoritedIds] = useState(new Set());
  const [showAlertModal, setShowAlertModal] = useState(false);

  const isVisitor = !user;
  const userRole = user?.role;

  const handlePublishClick = () => {
    if (userRole === "business") {
      router.push("/dashboard/listings/jobs/create");
    } else {
      scrollToInscription();
    }
  };

  const hasActiveFilters = () => {
    const { page, limit, ...rest } = filters;
    return Object.values(rest).some((v) => v);
  };

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [filters, token]);

  const handleResetAll = () => {
    setFilters({ page: 1, limit: 12 });
    setFromHero(false);
    // Clear URL params without navigation
    window.history.replaceState({}, "", "/jobs");
  };

  const handleFilter = (newFilters) => {
    if (Object.keys(newFilters).length === 0) {
      setFilters({ page: 1, limit: 12 });
      setFromHero(false);
      window.history.replaceState({}, "", "/real-estate");
      return;
    }
    setFromHero(false); // user is now using sidebar filters
    setFilters((prev) => {
      const merged = { ...prev, ...newFilters, page: 1 };
      Object.keys(merged).forEach((k) => {
        if (merged[k] === undefined) delete merged[k];
      });
      return merged;
    });
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleCategoryTab = (cat) => {
    setActiveCategory(cat.categoryId);
    setFilters({
      page: 1,
      limit: 9,
      ...(cat.categoryId && { categorySlug: cat.categoryId }),
    });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERO HEADER */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-[1200px] mx-auto px-4">
          <h1 className="text-3xl font-bold text-center text-[#2D5016] mb-2">
            Trouvez votre prochain emploi
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            {pagination
              ? `${pagination.total} offres disponibles au Maroc`
              : "Chargement..."}
          </p>

          {/* Search bar */}
          <div className="flex items-center max-w-2xl mx-auto border-2 border-[#2D5016] rounded-full px-4 py-2.5 bg-white shadow-sm">
            <svg
              className="w-4 h-4 text-gray-400 shrink-0 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Titre, entreprise, mot-clé..."
              value={searchInput}
              className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="ml-2 px-4 py-1.5 rounded-full bg-[#A7D129] text-white text-sm font-medium hover:bg-[#7BA428] transition"
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 py-2.5 flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategoryTab(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                ${
                  activeCategory === cat.categoryId
                    ? "bg-[#2D5016] text-white shadow-sm"
                    : "bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129] hover:text-white"
                }`}
            >
              {cat.label}
            </button>
          ))}

          {/* Right-side action buttons: alert (citizens only) + publish */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {userRole === "citizen" && (
              <button
                onClick={() => setShowAlertModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#A7D129] text-[#2D5016] font-semibold text-sm hover:bg-[#E8F5D0] transition-all duration-150"
              >
                🔔 Créer une alerte
              </button>
            )}
            <button
              onClick={handlePublishClick}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-[#2D5016] text-white font-bold text-sm shadow-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition-all duration-150 hover:scale-105 active:scale-100 cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 fill-current shrink-0"
              >
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              Publier une annonce
            </button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1200px] mx-auto px-4 py-6 flex gap-6">
        {/* SIDEBAR */}
        <aside className="w-[280px] shrink-0">
          <div className="sticky top-[52px] overflow-y-auto max-h-[calc(100vh-52px)]">
            <JobFilter onFilter={handleFilter} />
          </div>
        </aside>

        {/* JOBS LIST */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {pagination ? (
                <>
                  <span className="font-semibold text-gray-800">
                    {pagination.total}
                  </span>{" "}
                  offres trouvées
                </>
              ) : (
                <span className="animate-pulse bg-gray-200 rounded w-24 h-4 inline-block" />
              )}
            </p>
            {fromHero && (
              <div className="flex items-center gap-3 bg-[#E8F5D0] border border-[#A7D129] rounded-full px-4 py-1.5">
                <span className="text-xs font-medium text-[#2D5016]">
                  Filtres appliqués depuis la recherche
                </span>
                <button
                  onClick={handleResetAll}
                  className="text-xs font-bold text-[#2D5016] hover:text-red-600 transition-colors underline underline-offset-2"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
                >
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
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-semibold text-gray-700">
                Aucune offre trouvée
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Essayez de modifier vos filtres
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  initialFavorited={favoritedIds.has(job.id)}
                />
              ))}
            </div>
          )}

          {/* PAGINATION */}
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
                  className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                    pagination.page === i + 1
                      ? "bg-[#A7D129] text-white shadow-sm"
                      : "bg-white text-[#2D5016] border border-gray-200 hover:border-[#A7D129] hover:bg-[#E8F5D0]"
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
      </div>

      {/* FORMULAIRE D'INSCRIPTION */}
      {(isVisitor || userRole === "citizen") && (
        <div id="inscription" className="max-w-[1000px] mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#A7D129]/40 to-[#A7D129]/40" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#7BA428]">
              {userRole === "citizen"
                ? "Vous êtes une entreprise ? Publiez votre annonce"
                : "Rejoignez Madinatti"}
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#A7D129]/40 to-[#A7D129]/40" />
          </div>
          <InlineRegisterSection />
        </div>
      )}

      {/* ALERT MODAL */}
      {showAlertModal && (
        <AlertModal
          token={token}
          initialFilters={filters}
          onClose={() => setShowAlertModal(false)}
          apiUrl={process.env.NEXT_PUBLIC_API_URL}
        />
      )}
    </div>
  );
}
