'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { jobsService } from '@/services/jobsService';
import { realEstateService } from '@/services/realEstateService';
import { eventsService } from '@/services/eventsService';
import JobCard from '@/components/jobs/JobCard';
import RealEstateCard from '@/components/real-estate/RealEstateCard';
import EventCard from '@/components/events/EventCard';
import Link from 'next/link';

// ── Tab ───────────────────────────────────────────────────────────────────────
function Tab({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150
        ${active
          ? 'bg-[#2D5016] text-white shadow-sm'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
        }`}
    >
      {children}
      {count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
          ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ type, query }) {
  const isJob = type === 'jobs';

  if (query) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-2xl">🔍</div>
        <h2 className="text-base font-bold text-gray-900 mb-1">Aucun résultat pour « {query} »</h2>
        <p className="text-sm text-gray-400">Essayez un autre mot-clé.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#E8F5D0] flex items-center justify-center mb-5">
        {isJob ? (
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#A7D129]" fill="none" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        ) : (
          <span className="text-2xl">🏠</span>
        )}
      </div>
      <h2 className="text-base font-bold text-gray-900 mb-1">Aucune annonce sauvegardée</h2>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
        {isJob
          ? "Cliquez sur le cœur d'une offre d'emploi pour la retrouver ici."
          : "Cliquez sur le cœur d'une annonce immobilière pour la retrouver ici."}
      </p>
      <Link
        href={isJob ? '/jobs' : '/real-estate'}
        className="mt-6 px-6 py-2.5 bg-[#2D5016] text-white text-sm font-bold rounded-full hover:bg-[#A7D129] hover:text-[#2D5016] transition-all duration-200"
      >
        {isJob ? 'Parcourir les offres' : 'Parcourir les annonces'}
      </Link>
    </div>
  );
}

// ── Skeletons ─────────────────────────────────────────────────────────────────
function SkeletonJob() {
  return (
    <div className="bg-[#E8F5D0]/60 rounded-2xl p-5 animate-pulse">
      <div className="flex gap-5">
        <div className="w-[130px] h-[130px] shrink-0 rounded-xl bg-[#A7D129]/20" />
        <div className="flex-1 flex flex-col gap-3 pt-1">
          <div className="h-5 bg-[#A7D129]/20 rounded-lg w-2/3" />
          <div className="h-3.5 bg-[#A7D129]/15 rounded-lg w-1/3" />
          <div className="h-3 bg-[#A7D129]/15 rounded w-1/2" />
          <div className="h-3 bg-[#A7D129]/15 rounded w-2/5" />
        </div>
      </div>
    </div>
  );
}

function SkeletonRE() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-[220px] bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  );
}

// ── Wrapper with remove animation ─────────────────────────────────────────────
function FavoriteJobCard({ job, onUnfavorite, token }) {
  const [removing, setRemoving] = useState(false);

  const handleToggle = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await jobsService.toggleFavorite(job.id, token);
      setTimeout(() => onUnfavorite(job.id), 300);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div className={`transition-all duration-300 ${removing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <JobCard job={job} initialFavorited={true} onFavoriteToggle={handleToggle} showShare={true} />
    </div>
  );
}

function FavoriteRECard({ listing, onUnfavorite, token }) {
  const [removing, setRemoving] = useState(false);

  const handleToggle = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await realEstateService.toggleFavorite(listing.id, token);
      setTimeout(() => onUnfavorite(listing.id), 300);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div className={`transition-all duration-300 ${removing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <RealEstateCard listing={listing} initialFavorited={true} onFavoriteToggle={handleToggle} showShare={true} />
    </div>
  );
}

function FavoriteEventCard({ event, onUnfavorite }) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    try {
      await eventsService.removeFavorite(event.id);
      setTimeout(() => onUnfavorite(event.id), 300);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div className={`transition-all duration-300 ${removing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <EventCard event={event} onFavorite={handleRemove} />
    </div>
  );
}

// ── Sort select ───────────────────────────────────────────────────────────────
function SortSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#A7D129] transition cursor-pointer"
    >
      <option value="newest">Plus récent</option>
      <option value="oldest">Plus ancien</option>
      <option value="price_asc">Prix croissant</option>
      <option value="price_desc">Prix décroissant</option>
    </select>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function FavoritesPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs');

  const [jobs, setJobs]         = useState([]);
  const [listings, setListings] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingJobs, setLoadingJobs]         = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError]       = useState(null);

  // Search & sort state per tab
  const [jobSearch, setJobSearch]         = useState('');
  const [reSearch, setReSearch]           = useState('');
  const [jobSort, setJobSort]             = useState('newest');
  const [reSort, setReSort]               = useState('newest');

  useEffect(() => {
    if (!token) return;

    const loadAll = async () => {
      try {
        const [jobsRes, reRes, eventsRes] = await Promise.all([
          jobsService.getMyFavorites(token).catch(() => ({ data: [] })),
          realEstateService.getFavorites(token).catch(() => ({ data: [] })),
          eventsService.favorites().catch(() => ({ data: [] })),
        ]);
        setJobs(jobsRes.data ?? []);
        setListings(reRes.data ?? []);
        setEvents(eventsRes.data ?? []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingJobs(false);
        setLoadingListings(false);
        setLoadingEvents(false);
      }
    };
    loadAll();
  }, [token]);

  // ── Filtered + sorted jobs ────────────────────────────────────────────────
  const filteredJobs = useMemo(() => {
    let result = [...jobs];
    if (jobSearch.trim()) {
      const q = jobSearch.toLowerCase();
      result = result.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.companyName?.toLowerCase().includes(q) ||
          j.city?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (jobSort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (jobSort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return 0; // jobs don't have price
    });
    return result;
  }, [jobs, jobSearch, jobSort]);

  // ── Filtered + sorted real estate ─────────────────────────────────────────
  const filteredListings = useMemo(() => {
    let result = [...listings];
    if (reSearch.trim()) {
      const q = reSearch.toLowerCase();
      result = result.filter(
        (l) =>
          l.title?.toLowerCase().includes(q) ||
          l.city?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (reSort === 'newest')     return new Date(b.createdAt) - new Date(a.createdAt);
      if (reSort === 'oldest')     return new Date(a.createdAt) - new Date(b.createdAt);
      if (reSort === 'price_asc')  return Number(a.price) - Number(b.price);
      if (reSort === 'price_desc') return Number(b.price) - Number(a.price);
      return 0;
    });
    return result;
  }, [listings, reSearch, reSort]);

  const totalCount = jobs.length + listings.length + events.length;
  const isLoading  = loadingJobs || loadingListings || loadingEvents;

  return (
    <div className="max-w-3xl flex flex-col gap-6 p-6 lg:p-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mes favoris</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isLoading
            ? 'Chargement…'
            : `${totalCount} annonce${totalCount > 1 ? 's' : ''} sauvegardée${totalCount > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Tab active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} count={jobs.length}>
          💼 Emploi
        </Tab>
        <Tab active={activeTab === 'real-estate'} onClick={() => setActiveTab('real-estate')} count={listings.length}>
          🏠 Immobilier
        </Tab>
        <Tab active={activeTab === 'events'} onClick={() => setActiveTab('events')} count={events.length}>
          Evenements
        </Tab>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          Impossible de charger vos favoris. Veuillez réessayer.
        </div>
      )}

      {activeTab === 'events' && (
        <>
          {loadingEvents ? (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => <SkeletonRE key={i} />)}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <h2 className="text-base font-bold text-gray-900 mb-1">Aucun evenement sauvegarde</h2>
              <Link href="/evenements" className="mt-6 px-6 py-2.5 bg-[#2D5016] text-white text-sm font-bold rounded-full">
                Parcourir les evenements
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {events.map((event) => (
                <FavoriteEventCard
                  key={event.id}
                  event={event}
                  onUnfavorite={(id) => setEvents((prev) => prev.filter((item) => item.id !== id))}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── JOBS TAB ── */}
      {activeTab === 'jobs' && (
        <>
          {/* Search + sort toolbar — only show if there are items */}
          {!loadingJobs && jobs.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher dans mes offres…"
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#A7D129] transition"
                />
              </div>
              <SortSelect value={jobSort} onChange={setJobSort} />
            </div>
          )}

          {loadingJobs ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => <SkeletonJob key={i} />)}
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState type="jobs" query={jobSearch} />
          ) : (
            <div className="flex flex-col gap-4">
              {filteredJobs.map((job) => (
                <FavoriteJobCard
                  key={job.id}
                  job={job}
                  token={token}
                  onUnfavorite={(id) => setJobs((prev) => prev.filter((j) => j.id !== id))}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── REAL ESTATE TAB ── */}
      {activeTab === 'real-estate' && (
        <>
          {!loadingListings && listings.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher dans mes annonces…"
                  value={reSearch}
                  onChange={(e) => setReSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-[#A7D129] transition"
                />
              </div>
              <SortSelect value={reSort} onChange={setReSort} />
            </div>
          )}

          {loadingListings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <SkeletonRE key={i} />)}
            </div>
          ) : filteredListings.length === 0 ? (
            <EmptyState type="real-estate" query={reSearch} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredListings.map((listing) => (
                <FavoriteRECard
                  key={listing.id}
                  listing={listing}
                  token={token}
                  onUnfavorite={(id) => setListings((prev) => prev.filter((l) => l.id !== id))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
