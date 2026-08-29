"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { alertService } from "@/services/alertService";
import { useToast } from "@/context/ToastContext";
import EditAlertModal from "@/components/shared/EditAlertModal";
import { useAuth } from "@/context/AuthContext";

const MODULE_LABELS = {
  emploi: { label: "Emploi", icon: "💼" },
  immobilier: { label: "Immobilier", icon: "🏠" },
  automobile: { label: "Véhicules", icon: "🚗" },
};

function summarizeFilters(module, filters) {
  const parts = [];
  if (module === "emploi") {
    if (filters.keyword) parts.push(`"${filters.keyword}"`);
    if (filters.categorySlug) parts.push(filters.categorySlug);
    if (filters.contractType) parts.push(filters.contractType);
    if (filters.city) parts.push(filters.city);
    else if (filters.region) parts.push(filters.region);
  } else {
    if (filters.categoryId) parts.push("Catégorie sélectionnée");
    if (filters.listingType) parts.push(filters.listingType);
    if (filters.make) parts.push(filters.make);
    if (filters.model) parts.push(filters.model);
    if (filters.city) parts.push(filters.city);
    else if (filters.region) parts.push(filters.region);
    if (filters.minPrice || filters.maxPrice) {
      parts.push(`${filters.minPrice || "0"}–${filters.maxPrice || "∞"} MAD`);
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "Tous critères";
}

export default function MyAlertsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [editingAlert, setEditingAlert] = useState(null);

  const load = () => {
    if (!token) return;
    setLoading(true);
    alertService.getMine(null, token)
      .then((json) => setAlerts((json.data || []).filter((a) => a.module !== "headhunter")))
      .catch(() => toast.error("Erreur lors du chargement des alertes."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleToggle = async (id) => {
    setBusyId(id);
    try {
      const res = await alertService.toggle(id, token);
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive: res.isActive } : a)));
    } catch {
      toast.error("Erreur lors de la mise à jour.");
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
      toast.success("Alerte supprimée.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-2xl flex flex-col gap-6 p-6 lg:p-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mes alertes</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Gérez vos alertes emploi, immobilier et véhicules — désactivez-les ou supprimez-les à tout moment.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20 animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <div className="text-4xl mb-3">🔔</div>
          <p className="font-semibold text-gray-700">Aucune alerte pour le moment</p>
          <p className="text-sm text-gray-400 mt-1">Créez une alerte depuis les pages Emploi, Immobilier ou Véhicules.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((a) => {
            const cfg = MODULE_LABELS[a.module] || { label: a.module, icon: "🔔" };
            return (
              <div key={a.id} className={`bg-white rounded-2xl border p-4 flex items-center justify-between gap-4 ${a.isActive ? "border-gray-100" : "border-gray-100 opacity-60"}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{cfg.icon}</span>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{cfg.label}</span>
                    {!a.isActive && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">En pause</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 truncate">{summarizeFilters(a.module, a.filters || {})}</p>
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
                    title={a.isActive ? "Désactiver" : "Activer"}
                  >
                    <span className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 mt-0.5 ${a.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={busyId === a.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-50"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingAlert && (
        <EditAlertModal
          alert={editingAlert}
          token={token}
          onClose={() => setEditingAlert(null)}
          onSaved={(updated) => {
            setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setEditingAlert(null);
            toast.success('Alerte mise à jour.');
          }}
        />
      )}
    </div>
  );
}