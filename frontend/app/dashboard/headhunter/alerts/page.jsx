"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { alertService } from "@/services/alertService";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HeadhunterAlertModal from "@/components/headhunter/HeadhunterAlertModal";

const EDUCATION_LABELS = {
  BEFORE_BAC: 'Avant Bac', BAC: 'Bac', BAC_PLUS_1: 'Bac+1', BAC_PLUS_2: 'Bac+2',
  BAC_PLUS_3: 'Bac+3', BAC_PLUS_4: 'Bac+4', BAC_PLUS_5_PLUS: 'Bac+5 et plus',
};
const EXPERIENCE_LABELS = {
  STUDENT_FRESH_GRAD: 'Jeune diplômé', JUNIOR_LESS_2: '< 2 ans', MID_2_TO_5: '2-5 ans',
  SENIOR_5_TO_10: '5-10 ans', EXPERT_PLUS_10: '+10 ans',
};

function summarize(filters) {
  const parts = [];
  if (filters.search) parts.push(`"${filters.search}"`);
  if (filters.educationLevel) parts.push(EDUCATION_LABELS[filters.educationLevel]);
  if (filters.experienceLevel) parts.push(EXPERIENCE_LABELS[filters.experienceLevel]);
  if (filters.contractType) parts.push(filters.contractType);
  if (filters.city) parts.push(filters.city);
  else if (filters.region) parts.push(filters.region);
  return parts.length > 0 ? parts.join(" · ") : "Tous les candidats";
}

export default function HeadhunterAlertsPage() {
  return (
    <ProtectedRoute roles={["business"]}>
      <HeadhunterAlertsContent />
    </ProtectedRoute>
  );
}

function HeadhunterAlertsContent() {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [editingAlert, setEditingAlert] = useState(null);

  const load = () => {
    if (!token) return;
    setLoading(true);
    alertService.getMine("headhunter", token)
      .then((json) => setAlerts(json.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleToggle = async (id) => {
    setBusyId(id);
    try {
      const res = await alertService.toggle(id, token);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: res.isActive } : a)));
    } catch {
      alert("Erreur lors de la mise à jour.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Supprimer définitivement cette alerte ?")) return;
    setBusyId(id);
    try {
      await alertService.remove(id, token);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Erreur lors de la suppression.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[900px] mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard/headhunter" className="text-gray-400 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes alertes Headhunter</h1>
            <p className="text-sm text-gray-500 mt-1">Soyez notifié dès qu'un nouveau candidat correspond à vos critères.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />)}
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
            <div className="text-4xl mb-3">🔔</div>
            <p className="font-semibold text-gray-700">Aucune alerte pour le moment</p>
            <p className="text-sm text-gray-400 mt-1">Créez-en une depuis la recherche Headhunter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map((a) => (
              <div key={a.id} className={`bg-white rounded-2xl border p-4 flex items-center justify-between gap-4 ${a.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!a.isActive && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">En pause</span>}
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{summarize(a.filters || {})}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Créée le {new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setEditingAlert(a)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#2D5016] hover:bg-[#E8F5D0] transition"
                    title="Modifier"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleToggle(a.id)}
                    disabled={busyId === a.id}
                    className={`relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50 ${a.isActive ? "bg-[#2D5016]" : "bg-gray-200"}`}
                  >
                    <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${a.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={busyId === a.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingAlert && (
        <HeadhunterAlertModal
          token={token}
          alertId={editingAlert.id}
          initialFilters={editingAlert.filters}
          onClose={() => setEditingAlert(null)}
          onSaved={(updated) => setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))}
        />
      )}
    </div>
  );
}