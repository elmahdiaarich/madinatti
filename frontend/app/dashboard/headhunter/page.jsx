"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { headhunterService } from "@/services/headhunterService";
import { creditService } from "@/services/creditService";
import CandidateFilter from "@/components/headhunter/CandidateFilter";
import CandidateCard from "@/components/headhunter/CandidateCard";
import Link from "next/link";
import { Coins, X, ChevronDown, Bell } from "lucide-react";
import HeadhunterAlertModal from "@/components/headhunter/HeadhunterAlertModal";
import LocationCombobox from "@/components/jobs/LocationCombobox";

export default function HeadhunterPage() {
  return (
    <ProtectedRoute roles={["business"]}>
      <HeadhunterContent />
    </ProtectedRoute>
  );
}

// ─── Human-readable filter labels (for active pills) ─────────────────────────
const FILTER_PILL_LABELS = {
  educationLevel: {
    BEFORE_BAC: "Avant Bac", BAC: "Bac", BAC_PLUS_1: "Bac+1",
    BAC_PLUS_2: "Bac+2", BAC_PLUS_3: "Bac+3", BAC_PLUS_4: "Bac+4",
    BAC_PLUS_5_PLUS: "Bac+5",
  },
  experienceLevel: {
    STUDENT_FRESH_GRAD: "Jeune diplômé", JUNIOR_LESS_2: "< 2 ans exp.",
    MID_2_TO_5: "2–5 ans exp.", SENIOR_5_TO_10: "5–10 ans exp.", EXPERT_PLUS_10: "+10 ans exp.",
  },
  contractType: {
    CDI: "CDI", CDD: "CDD", STAGE: "Stage", FREELANCE: "Freelance",
    INTERIM: "Intérim", ALTERNANCE: "Alternance", ANAPEC: "Anapec", TEMPS_PARTIEL: "Temps partiel",
  },
};

// ─── Credit level helper ──────────────────────────────────────────────────────
function getCreditLevel(balance) {
  if (balance === null) return "loading";
  if (balance === 0) return "empty";
  if (balance <= 2) return "low";
  if (balance <= 4) return "medium";
  return "ok";
}

// ─── Smart credit banner ──────────────────────────────────────────────────────
function CreditBanner({ balance }) {
  const level = getCreditLevel(balance);
  if (level === "loading" || level === "ok") return null;

  const styles = {
    empty:  { bg: "bg-red-50 border-red-200",    text: "text-red-800",    icon: "🚨", msg: "Crédits épuisés — vous ne pouvez plus débloquer de profils." },
    low:    { bg: "bg-amber-50 border-amber-200", text: "text-amber-800",  icon: "⚠️", msg: `Solde faible (${balance} crédit${balance > 1 ? 's' : ''}) — rechargez bientôt.` },
    medium: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-800", icon: "💡", msg: `Il vous reste ${balance} crédits.` },
  };
  const s = styles[level];

  return (
    <div className={`flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl border ${s.bg} mb-5`}>
      <p className={`text-sm font-semibold ${s.text}`}>
        {s.icon} {s.msg}
      </p>
      <Link href="/dashboard/credits"
        className={`text-xs font-bold underline underline-offset-2 shrink-0 ${s.text}`}>
        Recharger →
      </Link>
    </div>
  );
}

// ─── Active filter pills ──────────────────────────────────────────────────────
function ActiveFilterPills({ filters, onRemove }) {
  const pills = [];

  const labelFor = (key, val) => {
    if (FILTER_PILL_LABELS[key]) return FILTER_PILL_LABELS[key][val] || val;
    return val;
  };

  const filterableKeys = ["educationLevel", "experienceLevel", "contractType", "city", "region"];
  filterableKeys.forEach((key) => {
    if (filters[key]) {
      pills.push({ key, value: filters[key], label: labelFor(key, filters[key]) });
    }
  });

  if (filters.availableOnly === "true") {
    pills.push({ key: "availableOnly", value: "true", label: "✅ Disponibles" });
  }

  if (!pills.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-gray-400 font-medium">Filtres actifs :</span>
      {pills.map((p) => (
        <span key={p.key}
          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full
            bg-[#E8F5D0] border border-[#A7D129]/50 text-[#2D5016] text-xs font-semibold">
          {p.label}
          <button onClick={() => onRemove(p.key)}
            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-[#A7D129]/30 transition">
            <X size={10} strokeWidth={3} />
          </button>
        </span>
      ))}
      {pills.length > 1 && (
        <button onClick={() => onRemove("__all__")}
          className="text-xs text-gray-400 hover:text-red-500 transition underline underline-offset-2">
          Tout effacer
        </button>
      )}
    </div>
  );
}

// ─── Sort dropdown ────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "recent",      label: "Plus récents" },
  { value: "salary_desc", label: "Salaire décroissant" },
  { value: "salary_asc",  label: "Salaire croissant" },
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.value === value);
  return (
    <div className="relative">
      <button onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg
          text-xs font-semibold text-gray-600 bg-white hover:border-gray-300 transition">
        {current?.label}
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          {SORT_OPTIONS.map((o) => (
            <button key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition
                ${value === o.value ? "bg-[#E8F5D0] text-[#2D5016]" : "text-gray-700 hover:bg-gray-50"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-3 animate-pulse">
          <div className="flex gap-3 items-center">
            <div className="w-11 h-11 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-28" />
              <div className="h-2.5 bg-gray-100 rounded w-20" />
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-3/4" />
          <div className="flex gap-1.5">
            <div className="h-5 w-12 bg-gray-100 rounded-full" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
          </div>
          <div className="h-10 bg-gray-100 rounded-xl mt-auto" />
        </div>
      ))}
    </div>
  );
}

// ─── HeadhunterContent ────────────────────────────────────────────────────────
function HeadhunterContent() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [candidates,        setCandidates]        = useState([]);
  const [pagination,        setPagination]        = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [filters,           setFilters]           = useState({ page: 1, limit: 9, availableOnly: "true" });
  const [unlockingId,       setUnlockingId]       = useState(null);
  const [balance,           setBalance]           = useState(null);
  const [searchInput,       setSearchInput]       = useState("");
  const [locationValue,     setLocationValue]     = useState(null);
  const [sectorInput,       setSectorInput]       = useState("");
  const [categories,        setCategories]        = useState([]);
  const [togglingFavoriteId,setTogglingFavoriteId]= useState(null);
  const [sortBy,            setSortBy]            = useState("recent");
  const [alertModalOpen,    setAlertModalOpen]    = useState(false);

  // Load candidates
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    headhunterService.getCandidates(filters, token)
      .then((json) => { setCandidates(json.data || []); setPagination(json.pagination); })
      .catch(() => toast.error("Impossible de charger les candidats."))
      .finally(() => setLoading(false));
  }, [filters, token]);

  // Load credit balance
  useEffect(() => {
    if (!token) return;
    creditService.getMine(token)
      .then((json) => setBalance(json.balance))
      .catch(() => {});
  }, [token]);

  // Load job categories for sector select
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/categories`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setCategories(d.data); })
      .catch(() => {});
  }, []);

  // Client-side sort
  const sortedCandidates = useMemo(() => {
    if (sortBy === "salary_desc") {
      return [...candidates].sort((a, b) => (b.desiredSalaryMax || 0) - (a.desiredSalaryMax || 0));
    }
    if (sortBy === "salary_asc") {
      return [...candidates].sort((a, b) => {
        const aMin = a.desiredSalaryMin ?? Infinity;
        const bMin = b.desiredSalaryMin ?? Infinity;
        return aMin - bMin;
      });
    }
    return candidates;
  }, [candidates, sortBy]);

  // Handlers
  const handleFilter = (newFilters) =>
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));

  const handleRemoveFilter = (key) => {
    if (key === "__all__") {
      setFilters({ page: 1, limit: 9, availableOnly: "true" });
      return;
    }
    setFilters((prev) => {
      const next = { ...prev, page: 1 };
      delete next[key];
      return next;
    });
  };

  const handlePageChange = (p) =>
    setFilters((prev) => ({ ...prev, page: p }));

  const handleSearch = () => {
    const locationFilter = locationValue
      ? locationValue.type === 'city'
        ? { city: locationValue.raw, region: undefined }
        : { region: locationValue.raw, city: undefined }
      : { city: undefined, region: undefined };

    setFilters((prev) => {
      const next = {
        ...prev,
        search: searchInput || undefined,
        categorySlug: sectorInput || undefined,
        ...locationFilter,
        page: 1,
      };
      // remove undefined keys
      Object.keys(next).forEach((k) => { if (next[k] === undefined) delete next[k]; });
      return next;
    });
  };

  const handleToggleFavorite = async (candidate) => {
    setTogglingFavoriteId(candidate.id);
    try {
      const res = await headhunterService.toggleFavorite(candidate.id, token);
      setCandidates((prev) => prev.map((c) => (c.id === candidate.id ? { ...c, isFavorited: res.favorited } : c)));
    } catch {
      alert("Erreur lors de la mise à jour des favoris.");
    } finally {
      setTogglingFavoriteId(null);
    }
  };

  const handleUnlock = async (candidate) => {
    if (balance !== null && balance < 1) {
      toast.error("Crédits insuffisants — rechargez votre solde.", { duration: 0 });
      return;
    }
    setUnlockingId(candidate.id);
    try {
      const res = await headhunterService.unlockCandidate(candidate.id, token);
      if (res.success) {
        setCandidates((prev) =>
          prev.map((c) => (c.id === candidate.id ? { ...c, ...res.data } : c))
        );
        if (typeof res.balance === "number") setBalance(res.balance);
        toast.success(
          res.alreadyUnlocked
            ? "Profil déjà débloqué — accès conservé."
            : `Profil débloqué ! Solde restant : ${res.balance} crédit${res.balance > 1 ? "s" : ""}.`
        );
      }
    } catch (err) {
      if (err?.response?.status === 402 || err?.status === 402) {
        toast.error("Crédits insuffisants — rechargez votre solde.", { duration: 0 });
      } else {
        toast.error("Erreur lors du déblocage. Réessayez.");
      }
    } finally {
      setUnlockingId(null);
    }
  };

  // Render
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1240px] mx-auto px-4 py-6">

        {/* PAGE HEADER */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
              Headhunter — CVthèque
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {pagination
                ? <><span className="font-semibold text-gray-700">{pagination.total}</span> candidats dans la base</>
                : "Recherchez des candidats correspondant à vos critères."
              }
            </p>
          </div>

          {/* Top-right actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setAlertModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-[#A7D129] transition">
              <Bell size={16} /> Alerte
            </button>
            <Link href="/dashboard/headhunter/alerts" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-[#A7D129] transition">
              🔔 Mes alertes
            </Link>
            <Link href="/dashboard/headhunter/favorites" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-[#A7D129] transition">
              ❤️ Favoris
            </Link>
            <Link href="/dashboard/headhunter/unlocked" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-[#A7D129] transition">
              🔓 Débloqués
            </Link>
            <Link href="/dashboard/credits" className="flex items-center gap-2 px-4 py-2 bg-[#2D5016] text-white rounded-xl text-sm font-bold hover:bg-[#3a6b1e] transition">
              <Coins size={16} /> {balance !== null ? `${balance} crédits` : 'Mes crédits'}
            </Link>
          </div>
        </div>

        {/* CREDIT WARNING BANNER */}
        <CreditBanner balance={balance} />

        {/* SEARCH BAR + FILTERS (same row) */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">

          {/* Advanced filter button — left */}
          <CandidateFilter onFilter={handleFilter} />

          {/* Combined search bar: keyword + location */}
          <div className="flex flex-1 flex-col sm:flex-row gap-2 sm:gap-0
            sm:items-center sm:border sm:border-gray-200 sm:rounded-2xl sm:bg-white
            sm:shadow-sm sm:hover:border-[#2D5016]/30 sm:transition-colors min-w-[280px]">

            {/* Keyword */}
            <div className="flex items-center gap-2 px-3.5 py-1
              border border-gray-200 rounded-xl bg-white sm:border-0 sm:rounded-none sm:flex-1 sm:bg-transparent">
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Ex : développeur full stack..."
                value={searchInput}
                className="flex-1 outline-none text-sm text-gray-700 bg-transparent py-2"
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              {searchInput && (
                <button onClick={() => { setSearchInput(""); }}
                  className="text-gray-300 hover:text-gray-500 transition">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-7 bg-gray-200 shrink-0" />

            {/* Location */}
            <div className="flex items-center px-3.5 py-1
              border border-gray-200 rounded-xl bg-white sm:border-0 sm:rounded-none sm:flex-1 sm:bg-transparent">
              <LocationCombobox
                value={locationValue}
                onChange={setLocationValue}
                placeholder="Ville, région..."
              />
            </div>

            {/* Search button */}
            <button
              onClick={handleSearch}
              className="mx-1.5 my-1.5 px-5 py-2.5 rounded-xl bg-[#2D5016] text-white text-sm font-bold
                hover:bg-[#1a2e0a] transition-colors shrink-0 shadow-sm"
            >
              Rechercher
            </button>
          </div>

          {/* Sector / category select */}
          <div className="relative flex-1 min-w-[160px] max-w-[240px]">
            <select
              value={sectorInput}
              onChange={(e) => setSectorInput(e.target.value)}
              className="w-full appearance-none border border-gray-200 rounded-xl px-3.5 py-[11px] text-sm
                bg-white outline-none focus:border-[#2D5016]/40 text-gray-700 shadow-sm
                hover:border-gray-300 transition pr-8"
            >
              <option value="">Tous les secteurs</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* RESULTS */}
        <main className="min-w-0">

          {/* Results header: count + sort */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              {!loading && pagination && (
                <p className="text-sm text-gray-500">
                  <span className="font-bold text-gray-800">{pagination.total}</span> candidat{pagination.total > 1 ? "s" : ""} trouvé{pagination.total > 1 ? "s" : ""}
                </p>
              )}
            </div>
            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>

          {/* Active filter pills */}
          <ActiveFilterPills filters={filters} onRemove={handleRemoveFilter} />

          {/* Cards grid */}
          {loading ? (
            <SkeletonGrid />
          ) : sortedCandidates.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-semibold text-gray-700">Aucun candidat trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedCandidates.map((c) => (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  onUnlock={handleUnlock}
                  unlocking={unlockingId === c.id}
                  onToggleFavorite={handleToggleFavorite}
                  togglingFavorite={togglingFavoriteId === c.id}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-8">
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button key={i} onClick={() => handlePageChange(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition
                    ${pagination.page === i + 1
                      ? "bg-[#A7D129] text-white shadow-sm"
                      : "bg-white text-[#2D5016] border border-gray-200 hover:border-[#A7D129]"
                    }`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {alertModalOpen && (
        <HeadhunterAlertModal
          token={token}
          initialFilters={filters}
          onClose={() => setAlertModalOpen(false)}
        />
      )}
    </div>
  );
}