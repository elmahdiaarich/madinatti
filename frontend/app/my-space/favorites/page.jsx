'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { jobsService } from '@/services/jobsService';
import { realEstateService } from '@/services/realEstateService';
import JobCard from '@/components/jobs/JobCard';
import RealEstateCard from '@/components/real-estate/RealEstateCard';
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
function EmptyState({ type }) {
  const isJob = type === 'jobs';
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
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

// ── Wrapper job avec animation retrait ────────────────────────────────────────
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
      <JobCard job={job} initialFavorited={true} onFavoriteToggle={handleToggle} />
    </div>
  );
}

// ── Wrapper real-estate avec animation retrait ────────────────────────────────
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
      <RealEstateCard listing={listing} initialFavorited={true} onFavoriteToggle={handleToggle} />
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function FavoritesPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('jobs');

  const [jobs, setJobs]           = useState([]);
  const [listings, setListings]   = useState([]);
  const [loadingJobs, setLoadingJobs]         = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!token) return;

    const loadAll = async () => {
      try {
        const [jobsRes, reRes] = await Promise.all([
          jobsService.getMyFavorites(token).catch(() => ({ data: [] })),
          realEstateService.getFavorites(token).catch(() => ({ data: [] })),
        ]);
        setJobs(jobsRes.data ?? []);
        setListings(reRes.data ?? []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingJobs(false);
        setLoadingListings(false);
      }
    };
    loadAll();
  }, [token]);

  const totalCount = jobs.length + listings.length;
  const isLoading  = loadingJobs || loadingListings;

  return (
    <div className="max-w-3xl flex flex-col gap-6 p-6 lg:p-8">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mes favoris</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isLoading ? 'Chargement…' : `${totalCount} annonce${totalCount > 1 ? 's' : ''} sauvegardée${totalCount > 1 ? 's' : ''}`}
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
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          Impossible de charger vos favoris. Veuillez réessayer.
        </div>
      )}

      {/* ── JOBS TAB ── */}
      {activeTab === 'jobs' && (
        <>
          {loadingJobs ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((i) => <SkeletonJob key={i} />)}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState type="jobs" />
          ) : (
            <div className="flex flex-col gap-4">
              {jobs.map((job) => (
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
          {loadingListings ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => <SkeletonRE key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState type="real-estate" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listings.map((listing) => (
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
