"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { jobsService } from "@/services/jobsService";
import JobListingFilters from "@/components/jobs/JobListingFilters";
import ApplicationsDrawer from "@/components/jobs/ApplicationsDrawer";

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

// ─── Stats bar ────────────────────────────────────────────────────────────────
function StatsBar({ jobs }) {
  const active    = jobs.filter((j) => j.status === "APPROVED").length;
  const pending   = jobs.filter((j) => j.status === "PENDING").length;
  const totalApps = jobs.reduce((sum, j) => sum + (j._count?.applications ?? 0), 0);
  const newApps   = jobs.reduce((sum, j) => sum + (j._count?.newApplications ?? 0), 0);

  const stats = [
    {
      label: "Offres actives",
      value: active,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      color: "text-green-700 bg-green-50 border-green-100",
    },
    {
      label: "En attente",
      value: pending,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
      color: "text-yellow-700 bg-yellow-50 border-yellow-100",
    },
    {
      label: "Candidatures",
      value: totalApps,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: "text-blue-700 bg-blue-50 border-blue-100",
      badge: newApps > 0 ? `${newApps} nouvelles` : null,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${s.color}`}
        >
          <span className="opacity-60 shrink-0">{s.icon}</span>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-xl font-extrabold leading-none">{s.value}</p>
              {s.badge && (
                <span className="text-[9px] font-bold bg-white/70 border border-current/20 px-1.5 py-0.5 rounded-full opacity-80 leading-none">
                  {s.badge}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium opacity-70 mt-0.5 truncate">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────────────
function JobCard({ job, onDelete, onViewApplications }) {
  const appCount = job._count?.applications ?? 0;
  const newCount = job._count?.newApplications ?? 0;

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
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col sm:flex-row hover:border-gray-200 hover:shadow-sm transition-all">
      {/* Logo / Thumbnail */}
      <div className="h-28 sm:h-auto sm:w-36 sm:self-stretch shrink-0 bg-white border-b sm:border-b-0 sm:border-r border-gray-100 flex items-center justify-center p-3">
        {job.user?.companyLogo ? (
          <img
            src={job.user.companyLogo}
            alt={job.companyName || "Logo entreprise"}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 min-w-0 flex-col justify-between p-4 gap-3">
        {/* Top row: title + status badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm leading-snug">{job.title}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusStyle.className}`}>
                {statusStyle.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1 flex-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <span>{job.adminNotes}</span>
          </div>
        )}

        {/* Bottom row: stats + actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Stats */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-400" title="Vues">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {job.viewsCount || 0}
            </span>

            <button
              onClick={(e) => { e.stopPropagation(); onViewApplications({ id: job.id, title: job.title }); }}
              title="Voir les candidatures"
              className={`relative flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition ${
                appCount > 0
                  ? "text-[#2D5016] bg-[#E8F5D0] hover:bg-[#A7D129]/30"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {appCount} candidature{appCount !== 1 ? "s" : ""}
              {newCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {newCount}
                </span>
              )}
            </button>

            <span className="text-xs text-gray-300">{fmtDate(job.createdAt)}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {job.status === "APPROVED" && (
              <Link
                href={`/jobs/${job.id}`}
                title="Voir l'annonce"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="hidden sm:inline">Voir</span>
              </Link>
            )}
            <Link
              href={`/dashboard/listings/jobs/edit/${job.id}`}
              title="Modifier l'annonce"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="hidden sm:inline">Modifier</span>
            </Link>
            <button
              onClick={() => onDelete(job.id)}
              title="Supprimer l'annonce"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
              <span className="hidden sm:inline">Supprimer</span>
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
  const [allJobs, setAllJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [justCreated] = useState(searchParams.get("created") === "1");
  const [selectedJob, setSelectedJob] = useState(null);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { load(); }, [page, filters]);

  const loadAll = async () => {
    try {
      const res = await jobsService.getMyJobs({ page: 1, limit: 100 }, token);
      setAllJobs(res.jobs || []);
    } catch (e) {}
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await jobsService.getMyJobs(
        {
          page,
          limit: 10,
          ...(filters.status       && { status: filters.status }),
          ...(filters.city         && { location: filters.city }),
          ...(filters.contractType && { contractType: filters.contractType }),
          ...(filters.search       && { search: filters.search }),
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
      setAllJobs((prev) => prev.filter((j) => j.id !== id));
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
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-5">
        {/* Success toast */}
        {justCreated && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-green-700 text-sm">Offre soumise avec succès !</p>
              <p className="text-xs text-green-600">Elle sera visible après validation par l'administrateur.</p>
            </div>
          </div>
        )}

        {/* Stats bar */}
        {allJobs.length > 0 && <StatsBar jobs={allJobs} />}

        {/* Filters + Publish button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <JobListingFilters onChange={handleFiltersChange} showStatus={true} jobs={jobs} />
          </div>
          <Link
            href="/dashboard/listings/jobs/create"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-sage transition whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Publier une offre</span>
            <span className="sm:hidden">Publier</span>
          </Link>
        </div>

        {/* Job list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-16 flex flex-col items-center gap-4">
            <span className="text-5xl">💼</span>
            <div>
              <p className="font-bold text-gray-700">Aucune offre</p>
              <p className="text-sm text-gray-400 mt-1">Publiez votre première offre d'emploi.</p>
            </div>
            <Link
              href="/dashboard/listings/jobs/create"
              className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary-sage transition"
            >
              Publier une offre
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} onDelete={handleDelete} onViewApplications={setSelectedJob} />
            ))}
          </div>
        )}

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

      {selectedJob && (
        <ApplicationsDrawer
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          onClose={() => setSelectedJob(null)}
          token={token}
        />
      )}
    </div>
  );
}