'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { jobsService } from '@/services/jobsService';
import JobCard from '@/components/jobs/JobCard';
import Link from 'next/link';

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#E8F5D0] flex items-center justify-center mb-5">
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#A7D129]" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </div>
      <h2 className="text-base font-bold text-gray-900 mb-1">Aucune offre sauvegardée</h2>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
        Cliquez sur le cœur d'une offre d'emploi pour la retrouver ici facilement.
      </p>
      <Link
        href="/jobs"
        className="mt-6 px-6 py-2.5 bg-[#2D5016] text-white text-sm font-bold rounded-full hover:bg-[#A7D129] hover:text-[#2D5016] transition-all duration-200"
      >
        Parcourir les offres
      </Link>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[#E8F5D0]/60 rounded-2xl p-5 animate-pulse">
      <div className="flex gap-5">
        <div className="w-[130px] h-[130px] shrink-0 rounded-xl bg-[#A7D129]/20" />
        <div className="flex-1 flex flex-col gap-3 pt-1">
          <div className="h-5 bg-[#A7D129]/20 rounded-lg w-2/3" />
          <div className="h-3.5 bg-[#A7D129]/15 rounded-lg w-1/3" />
          <div className="flex flex-col gap-2 mt-1">
            <div className="h-3 bg-[#A7D129]/15 rounded w-1/2" />
            <div className="h-3 bg-[#A7D129]/15 rounded w-2/5" />
            <div className="h-3 bg-[#A7D129]/15 rounded w-1/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FavoritesPage() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await jobsService.getMyFavorites(token);
        setJobs(res.data ?? []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) load();
  }, [token]);

  // Retire un job de la liste locale quand l'user dé-favourite depuis cette page
  const handleUnfavorite = (jobId) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  return (
    <div className="max-w-3xl flex flex-col gap-6 p-6 lg:p-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes favoris</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading
              ? 'Chargement…'
              : jobs.length > 0
                ? `${jobs.length} offre${jobs.length > 1 ? 's' : ''} sauvegardée${jobs.length > 1 ? 's' : ''}`
                : 'Aucune offre sauvegardée'
            }
          </p>
        </div>
        {!loading && jobs.length > 0 && (
          <Link
            href="/jobs"
            className="text-xs font-semibold text-[#2D5016] hover:underline"
          >
            Parcourir les offres →
          </Link>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          Impossible de charger vos favoris. Veuillez réessayer.
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && jobs.length === 0 && <EmptyFavorites />}

      {/* List */}
      {!loading && jobs.length > 0 && (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => (
            <FavoriteJobCard
              key={job.id}
              job={job}
              onUnfavorite={handleUnfavorite}
              token={token}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Wrapper autour de JobCard pour gérer le retrait depuis cette page ─────────
function FavoriteJobCard({ job, onUnfavorite, token }) {
  const [favorited, setFavorited] = useState(true);
  const [removing, setRemoving] = useState(false);

  const handleToggle = async () => {
    if (removing) return;
    // Optimistic : on retire visuellement tout de suite
    setRemoving(true);
    try {
      await jobsService.toggleFavorite(job.id, token);
      // Petit délai pour que l'animation soit visible
      setTimeout(() => onUnfavorite(job.id), 300);
    } catch {
      setRemoving(false); // rollback si erreur
    }
  };

  return (
    <div className={`transition-all duration-300 ${removing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      <JobCard job={job} initialFavorited={true} onFavoriteToggle={handleToggle} />
    </div>
  );
}
