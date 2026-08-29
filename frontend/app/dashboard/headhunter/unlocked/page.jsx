"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { headhunterService } from "@/services/headhunterService";
import CandidateFilter from "@/components/headhunter/CandidateFilter";
import CandidateCard from "@/components/headhunter/CandidateCard";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

export default function UnlockedCandidatesPage() {
  return (
    <ProtectedRoute roles={["business"]}>
      <UnlockedContent />
    </ProtectedRoute>
  );
}

function UnlockedContent() {
  const { token } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 12, sort: "recent_unlock" });
  const [savingNotesId, setSavingNotesId] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    headhunterService.getUnlocked(filters, token)
      .then((json) => { setCandidates(json.data || []); setPagination(json.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, filters]);

  const handleFilter = (newFilters) => setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  const handleSortChange = (e) => setFilters((prev) => ({ ...prev, sort: e.target.value, page: 1 }));
  const handlePageChange = (p) => setFilters((prev) => ({ ...prev, page: p }));

  const handleSaveNotes = async (candidateId, notes) => {
    setSavingNotesId(candidateId);
    try {
      await headhunterService.updateUnlockNotes(candidateId, notes, token);
      setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, notes } : c)));
    } catch {
      alert("Erreur lors de l'enregistrement de la note.");
    } finally {
      setSavingNotesId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await headhunterService.exportUnlockedCsv(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "candidats_debloques.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erreur lors de l'export.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/headhunter" className="text-gray-400 hover:text-gray-700">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Candidats débloqués</h1>
              <p className="text-sm text-gray-500 mt-1">Accès conservé même si le candidat se retire de la recherche.</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || candidates.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:border-[#A7D129] transition disabled:opacity-50"
          >
            <Download size={16} /> {exporting ? "Export..." : "Exporter en CSV"}
          </button>
        </div>

        <div className="flex gap-6">
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-[80px] flex flex-col gap-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-3">
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Trier par</label>
                <select
                  value={filters.sort}
                  onChange={handleSortChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="recent_unlock">Déblocage le plus récent</option>
                  <option value="recent_profile">Profil mis à jour récemment</option>
                </select>
              </div>
              <CandidateFilter onFilter={handleFilter} />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 mb-4">
              {pagination ? <><span className="font-semibold text-gray-800">{pagination.total}</span> candidats débloqués</> : "Chargement..."}
            </p>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />)}
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">🔓</div>
                <p className="text-lg font-semibold text-gray-700">Aucun candidat débloqué</p>
                <p className="text-sm text-gray-400 mt-1">Débloquez des profils depuis la recherche Headhunter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {candidates.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    onSaveNotes={handleSaveNotes}
                    savingNotes={savingNotesId === c.id}
                  />
                ))}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-1.5 mt-8">
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button key={i} onClick={() => handlePageChange(i + 1)}
                    className={`w-9 h-9 rounded-full text-sm font-medium transition ${pagination.page === i + 1 ? "bg-[#A7D129] text-white" : "bg-white text-[#2D5016] border border-gray-200 hover:border-[#A7D129]"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}