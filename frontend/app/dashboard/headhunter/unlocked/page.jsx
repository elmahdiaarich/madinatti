"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { headhunterService } from "@/services/headhunterService";
import CandidateCard from "@/components/headhunter/CandidateCard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    headhunterService.getUnlocked({ page, limit: 12 }, token)
      .then((json) => { setCandidates(json.data || []); setPagination(json.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, page]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/headhunter" className="text-gray-400 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidats débloqués</h1>
            <p className="text-sm text-gray-500 mt-1">Profils que vous avez déjà consultés — accès conservé même si le candidat se retire de la recherche.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-48 animate-pulse" />)}
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">🔓</div>
            <p className="text-lg font-semibold text-gray-700">Aucun candidat débloqué</p>
            <p className="text-sm text-gray-400 mt-1">Débloquez des profils depuis la recherche Headhunter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {candidates.map((c) => <CandidateCard key={c.id} candidate={c} onUnlock={() => {}} />)}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-1.5 mt-8">
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition ${pagination.page === i + 1 ? "bg-[#A7D129] text-white" : "bg-white text-[#2D5016] border border-gray-200 hover:border-[#A7D129]"}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}