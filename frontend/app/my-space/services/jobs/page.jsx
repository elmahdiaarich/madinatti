"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { jobsService } from "@/services/jobsService";
import JobListingFilters from "@/components/jobs/JobListingFilters";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

const CONTRACT_LABELS = {
  CDI: "CDI",
  CDD: "CDD",
  STAGE: "Stage",
  FREELANCE: "Freelance",
  INTERIM: "Intérim",
  ALTERNANCE: "Alternance",
  ANAPEC: "Anapec",
  TEMPS_PARTIEL: "Temps partiel",
  STATUTAIRE: "Statutaire",
};

// ─── Job card ─────────────────────────────────────────────────────────────────
function JobCard({ job, onDelete }) {
  const appCount = job._count?.applications ?? 0;

  const statusStyles = {
    APPROVED: {
      label: "Approuvée",
      className: "bg-green-50 text-green-700 border border-green-200",
    },
    PENDING: {
      label: "En attente",
      className: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    },
    REJECTED: {
      label: "Rejetée",
      className: "bg-red-50 text-red-700 border border-red-200",
    },
  };
  const statusStyle = statusStyles[job.status] ?? statusStyles.PENDING;

  return (
    <div
      className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col sm:flex-row hover:border-gray-200 hover:shadow-sm transition-all ${
        job.status === "REJECTED" && job.adminNotes
          ? "sm:min-h-32"
          : "sm:h-32"
      }`}
    >
      {/* Thumbnail (matching real-estate structure) */}
      <div className="relative h-32 sm:h-auto sm:w-44 sm:self-stretch shrink-0 bg-gray-50 flex items-center justify-center text-gray-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
        <span
          className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle.className}`}
        >
          {statusStyle.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-w-0 flex-col justify-between p-4 gap-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
              {job.title}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              {job.location || "—"}
              <span className="opacity-30">·</span>
              {job.category?.name || "—"}
              {job.contractType && (
                <>
                  <span className="opacity-30">·</span>
                  {CONTRACT_LABELS[job.contractType] ?? job.contractType}
                </>
              )}
            </p>
          </div>
        </div>

        {/* Admin rejection note */}
        {job.status === "REJECTED" && job.adminNotes && (
          <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <span className="mt-px shrink-0">⛔</span>
            <span className="line-clamp-2">{job.adminNotes}</span>
          </div>
        )}

        {/* Bottom row: stats + actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {job.viewsCount || 0}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13"
                height="13"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {appCount}
            </span>
            <span className="text-xs text-gray-300">
              {fmtDate(job.createdAt)}
            </span>
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {job.status === "APPROVED" && (
              <Link
                href={`/jobs/${job.id}`}
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                <span className="hidden sm:inline">Voir</span>
                <svg
                  className="sm:hidden"
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </Link>
            )}
            <Link
              href={`/my-space/services/jobs/edit/${job.id}`}
              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              <span className="hidden sm:inline">Modifier</span>
              <svg
                className="sm:hidden"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </Link>
            <button
              onClick={() => onDelete(job.id)}
              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              <span className="hidden sm:inline">Supprimer</span>
              <svg
                className="sm:hidden"
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BusinessJobsDashboard() {
  return (
    <ProtectedRoute roles={["business"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [justCreated] = useState(searchParams.get("created") === "1");

  useEffect(() => {
    load();
  }, [page, filters]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await jobsService.getMyJobs(
        {
          page,
          limit: 10,
          ...(filters.status && { status: filters.status }),
          ...(filters.city && { location: filters.city }),
          ...(filters.contractType && { contractType: filters.contractType }),
          ...(filters.search && { search: filters.search }),
        },
        token,
      );
      setJobs(res.jobs || []);
      setPagination(res.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer cette offre d'emploi ?")) return;
    try {
      await jobsService.deleteMyJob(id, token);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (e) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-primary-dark text-lg">
            Mes annonces d'emploi
          </h1>
          <Link
            href="/my-space/services/jobs/create"
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-sage transition"
          >
            + Nouvelle offre
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Success toast */}
        {justCreated && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-700 text-sm">
                Offre soumise avec succès !
              </p>
              <p className="text-xs text-green-600">
                Elle sera visible après validation par l'administrateur.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <JobListingFilters
          onChange={handleFiltersChange}
          showStatus={true}
          jobs={jobs}
        />
        
        {/* Listings */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20 flex flex-col items-center gap-3">
            <span className="text-5xl">💼</span>
            <p className="font-bold text-gray-700">Aucune offre</p>
            <p className="text-sm text-gray-400">
              Publiez votre première offre d'emploi.
            </p>
            <Link
              href="/my-space/services/jobs/create"
              className="mt-2 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-sage transition"
            >
              Publier une offre
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((j) => (
              <JobCard
                key={j.id}
                job={j}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-1.5">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                  page === i + 1
                    ? "bg-primary-dark text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-primary-dark"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}