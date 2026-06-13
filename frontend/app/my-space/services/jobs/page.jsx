"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { jobsService } from "@/services/jobsService";
 
// ─── Static maps ─────────────────────────────────────────────────────────────
 
const STATUS_STYLES = {
  PENDING:   { label: "En attente",  cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  PUBLISHED: { label: "Publiée",     cls: "bg-green-50 text-green-700 border-green-200" },
  REJECTED:  { label: "Rejetée",     cls: "bg-red-50 text-red-700 border-red-200" },
  DRAFT:     { label: "Brouillon",   cls: "bg-gray-50 text-gray-500 border-gray-200" },
  EXPIRED:   { label: "Expirée",     cls: "bg-orange-50 text-orange-600 border-orange-200" },
  CLOSED:    { label: "Clôturée",    cls: "bg-gray-100 text-gray-400 border-gray-200" },
};
 
const CONTRACT_LABELS = {
  CDI:           "CDI",
  CDD:           "CDD",
  STAGE:         "Stage",
  FREELANCE:     "Freelance",
  INTERIM:       "Intérim",
  ALTERNANCE:    "Alternance",
  ANAPEC:        "Anapec",
  TEMPS_PARTIEL: "Temps partiel",
  STATUTAIRE:    "Statutaire",
};
 
const REMOTE_LABELS = {
  ON_SITE: "Présentiel",
  REMOTE:  "Full Remote",
  HYBRID:  "Hybride",
};
 
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
 
// ─── Status filter tabs ───────────────────────────────────────────────────────
 
const FILTER_TABS = [
  { label: "Toutes",     value: "" },
  { label: "En attente", value: "PENDING" },
  { label: "Publiées",   value: "PUBLISHED" },
  { label: "Rejetées",   value: "REJECTED" },
  { label: "Expirées",   value: "EXPIRED" },
];
 
// ─── Job card ─────────────────────────────────────────────────────────────────
 
function JobCard({ job, onDelete }) {
  const statusStyle = STATUS_STYLES[job.status] ?? STATUS_STYLES.PENDING;
  const appCount = job._count?.applications ?? 0;
 
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col sm:flex-row hover:border-gray-200 hover:shadow-sm transition-all ${
        job.status === "REJECTED" && job.adminNotes ? "" : "sm:h-32"
      }`}
    >
      {/* Left accent strip — colour-coded by status */}
      <div
        className={`hidden sm:flex shrink-0 w-1.5 self-stretch rounded-l-2xl ${
          job.status === "PUBLISHED" ? "bg-green-400"
          : job.status === "PENDING" ? "bg-yellow-400"
          : job.status === "REJECTED" ? "bg-red-400"
          : "bg-gray-300"
        }`}
      />
 
      {/* Body */}
      <div className="flex flex-1 min-w-0 flex-col justify-between p-4 gap-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
                {job.title}
              </p>
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.cls}`}
              >
                {statusStyle.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 flex-wrap">
              {job.category?.name && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A7D129] inline-block" />
                  {job.category.name}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {job.location}
                </span>
              )}
              {job.contractType && (
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-medium">
                  {CONTRACT_LABELS[job.contractType] ?? job.contractType}
                </span>
              )}
              {job.remote && job.remote !== "ON_SITE" && (
                <span className="px-1.5 py-0.5 bg-[#E8F5D0] text-[#2D5016] rounded-md font-medium">
                  {REMOTE_LABELS[job.remote]}
                </span>
              )}
            </div>
          </div>
 
          {/* Application deadline */}
          {job.applicationDeadline && (
            <p className="text-[11px] text-gray-400 shrink-0 text-right leading-tight">
              <span className="block text-gray-300 text-[10px]">Deadline</span>
              {fmtDate(job.applicationDeadline)}
            </p>
          )}
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
            {/* Views */}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {job.viewsCount ?? 0}
            </span>
            {/* Applications */}
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              {appCount} candidature{appCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-gray-300">{fmtDate(job.createdAt)}</span>
          </div>
 
          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {job.status === "PUBLISHED" && (
              <Link
                href={`/jobs/${job.id}`}
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
              >
                <span className="hidden sm:inline">Voir</span>
                <svg className="sm:hidden" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              </Link>
            )}
            <Link
              href={`/my-space/services/jobs/edit/${job.id}`}
              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              <span className="hidden sm:inline">Modifier</span>
              <svg className="sm:hidden" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </Link>
            <button
              onClick={() => onDelete(job.id)}
              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-xl border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition"
            >
              <span className="hidden sm:inline">Supprimer</span>
              <svg className="sm:hidden" xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
// ─── Main page ────────────────────────────────────────────────────────────────
 
export default function MyJobsPage() {
  return (
    <ProtectedRoute roles={["business"]}>
      <MyJobsContent />
    </ProtectedRoute>
  );
}
 
function MyJobsContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
 
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [justCreated] = useState(searchParams.get("created") === "1");
 
  useEffect(() => {
    load();
  }, [page, statusFilter, search]);
 
  const load = async () => {
    setLoading(true);
    try {
      const res = await jobsService.getMyJobs(
        {
          page,
          limit: 10,
          ...(statusFilter && { status: statusFilter }),
          ...(search && { search }),
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
 
  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };
 
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPage(1);
  };
 
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-[#2D5016] text-lg">Mes offres d'emploi</h1>
          <Link
            href="/my-space/services/jobs/create"
            className="px-4 py-2 bg-[#2D5016] text-white rounded-xl text-sm font-bold hover:bg-[#A7D129] hover:text-[#2D5016] transition"
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
              <p className="font-bold text-green-700 text-sm">Offre soumise avec succès !</p>
              <p className="text-xs text-green-600">
                Elle sera visible après validation par l'administrateur.
              </p>
            </div>
          </div>
        )}
 
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
            xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={handleSearch}
            placeholder="Rechercher par titre ou ville..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A7D129] focus:border-transparent bg-white"
          />
        </div>
 
        {/* Status filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                statusFilter === tab.value
                  ? "bg-[#2D5016] text-white border-[#2D5016]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#2D5016] hover:text-[#2D5016]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
 
        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-20 flex flex-col items-center gap-3">
            <span className="text-5xl">💼</span>
            <p className="font-bold text-gray-700">Aucune offre</p>
            <p className="text-sm text-gray-400">
              {statusFilter
                ? "Aucune offre pour ce filtre."
                : "Publiez votre première offre d'emploi."}
            </p>
            {!statusFilter && (
              <Link
                href="/jobs/publier"
                className="mt-2 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-bold hover:bg-[#A7D129] hover:text-[#2D5016] transition"
              >
                Publier une offre
              </Link>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onDelete={handleDelete} />
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
                    ? "bg-[#2D5016] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-[#2D5016]"
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
 