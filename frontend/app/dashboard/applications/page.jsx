"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Download, X, ChevronDown, Check, Search, FileText, Phone, Mail, MapPin, Calendar, AlertCircle } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:  { label: "En attente", color: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400" },
  viewed:   { label: "Vu",         color: "bg-blue-50 text-blue-700 border border-blue-200",   dot: "bg-blue-400" },
  accepted: { label: "Accepté",    color: "bg-green-50 text-green-700 border border-green-200", dot: "bg-green-500" },
  rejected: { label: "Refusé",     color: "bg-red-50 text-red-600 border border-red-200",      dot: "bg-red-400" },
};

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name) =>
  name ? name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase() : "?";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── Stats Bar ────────────────────────────────────────────────────────────────
function StatsBar({ applications }) {
  const counts = applications.reduce(
    (acc, app) => { acc[app.status] = (acc[app.status] || 0) + 1; return acc; },
    {}
  );
  const stats = [
    { key: "pending",  label: "En attente", color: "text-amber-700 bg-amber-50 border-amber-100" },
    { key: "viewed",   label: "Vus",        color: "text-blue-700 bg-blue-50 border-blue-100" },
    { key: "accepted", label: "Acceptés",   color: "text-green-700 bg-green-50 border-green-100" },
    { key: "rejected", label: "Refusés",    color: "text-red-600 bg-red-50 border-red-100" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.key} className={`rounded-2xl border px-4 py-3 flex flex-col gap-1 ${s.color}`}>
          <p className="text-2xl font-extrabold leading-none">{counts[s.key] || 0}</p>
          <p className="text-xs font-medium opacity-70">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ app, onConfirm, onCancel, updating }) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <AlertCircle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Refuser cette candidature ?</h3>
            <p className="text-sm text-gray-500 mt-1">
              Le candidat <span className="font-semibold text-gray-700">{app.user?.name}</span> recevra une notification de refus.
            </p>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
            Message pour le candidat <span className="text-gray-400 font-normal">(optionnel)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex : Nous avons retenu un profil plus expérimenté..."
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 transition"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
          >
            Annuler
          </button>
          <button
            onClick={() => onConfirm(note)}
            disabled={updating}
            className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-50 transition flex items-center gap-2"
          >
            {updating && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Confirmer le refus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Accept Confirm ───────────────────────────────────────────────────────────
function AcceptModal({ app, onConfirm, onCancel, updating }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-4 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <Check size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Accepter cette candidature ?</h3>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-semibold text-gray-700">{app.user?.name}</span> sera notifié(e) de votre décision.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition">
            Annuler
          </button>
          <button
            onClick={() => onConfirm()}
            disabled={updating}
            className="px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {updating && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ app, onClose, onStatusChange, updating }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // "accepted" | "rejected"
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAction = (action) => {
    setDropdownOpen(false);
    setConfirmAction(action);
  };

  const handleConfirm = (note = "") => {
    onStatusChange(app.id, confirmAction, note);
    setConfirmAction(null);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-40 w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {app.user?.avatar ? (
              <img src={app.user.avatar} alt={app.user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#E8F5D0] text-[#2D5016] flex items-center justify-center font-bold text-sm">
                {getInitials(app.user?.name)}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900">{app.user?.name}</p>
              <StatusBadge status={app.status} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Offre */}
          <div className="bg-gray-50 rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 mb-1">Offre postulée</p>
            <p className="font-semibold text-gray-800">{app.jobListing?.title}</p>
          </div>

          {/* Infos candidat */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Contact</p>
            <div className="flex flex-col gap-2">
              {app.user?.email && (
                <a href={`mailto:${app.user.email}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#2D5016] transition group">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#E8F5D0] flex items-center justify-center transition">
                    <Mail size={14} className="text-gray-500 group-hover:text-[#2D5016]" />
                  </span>
                  {app.user.email}
                </a>
              )}
              {app.user?.phone && (
                <a href={`tel:${app.user.phone}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-[#2D5016] transition group">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#E8F5D0] flex items-center justify-center transition">
                    <Phone size={14} className="text-gray-500 group-hover:text-[#2D5016]" />
                  </span>
                  {app.user.phone}
                </a>
              )}
              {app.user?.city && (
                <div className="flex items-center gap-2.5 text-sm text-gray-500">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <MapPin size={14} className="text-gray-400" />
                  </span>
                  {app.user.city}
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Calendar size={14} className="text-gray-400" />
                </span>
                Candidature reçue le {fmtDate(app.createdAt)}
              </div>
            </div>
          </div>

          {/* Lettre de motivation */}
          {app.coverLetter && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">Lettre de motivation</p>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {app.coverLetter}
              </div>
            </div>
          )}

          {/* CV */}
          {app.cvPath && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-2">CV</p>
              <a
                href={`${API}/api/jobs/cv/download?url=${encodeURIComponent(app.cvPath)}&name=${encodeURIComponent(app.user?.name || "candidat")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-2xl hover:border-[#A7D129] hover:bg-[#E8F5D0]/30 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">CV_{app.user?.name?.replace(/\s+/g, "_")}.pdf</p>
                  <p className="text-xs text-gray-400">Cliquer pour télécharger</p>
                </div>
                <Download size={16} className="text-gray-400 group-hover:text-[#2D5016] transition" />
              </a>
            </div>
          )}
        </div>

        {/* Actions footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            {app.status === "accepted" && "✅ Candidature acceptée"}
            {app.status === "rejected" && "❌ Candidature refusée"}
            {app.status === "viewed"   && "👁 Candidature vue"}
            {app.status === "pending"  && "⏳ En attente de traitement"}
          </p>

          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#2D5016] text-white rounded-xl hover:bg-[#A7D129] disabled:opacity-50 transition"
            >
              {updating
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <>Changer le statut <ChevronDown size={14} /></>
              }
            </button>

            {dropdownOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-10">
                {[
                  { value: "viewed",   label: "Marquer comme vu",  icon: "👁", danger: false },
                  { value: "accepted", label: "Accepter",          icon: "✅", danger: false },
                  { value: "rejected", label: "Refuser",           icon: "❌", danger: true },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAction(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
                      opt.danger
                        ? "text-red-600 hover:bg-red-50"
                        : "text-gray-700 hover:bg-gray-50"
                    } ${app.status === opt.value ? "opacity-40 pointer-events-none" : ""}`}
                  >
                    <span>{opt.icon}</span>
                    {opt.label}
                    {app.status === opt.value && <Check size={13} className="ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modals */}
      {confirmAction === "rejected" && (
        <ConfirmModal
          app={app}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
          updating={updating}
        />
      )}
      {confirmAction === "accepted" && (
        <AcceptModal
          app={app}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
          updating={updating}
        />
      )}
    </>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold animate-slide-up ${
      type === "success" ? "bg-[#2D5016] text-white" : "bg-red-600 text-white"
    }`}>
      {type === "success" ? "✅" : "❌"}
      {message}
    </div>
  );
}

// ─── Dropdown filter ──────────────────────────────────────────────────────────
function FilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
          value ? "border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
        }`}
      >
        {selected?.label || label}
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-10">
          <button
            onClick={() => { onChange(""); setOpen(false); }}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition"
          >
            Tous
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              {opt.label}
              {value === opt.value && <Check size={13} className="text-[#A7D129]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ApplicationsPage() {
  const { token } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJob, setFilterJob] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");

  // Fetch
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API}/api/jobs/my-applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setApplications(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Unique job options for filter
  const jobOptions = [...new Map(
    applications.map((a) => [a.jobListing?.id, { value: a.jobListing?.id, label: a.jobListing?.title }])
  ).values()].filter((o) => o.value);

  // Filter + search + sort
  const filtered = applications
    .filter((app) => {
      if (filterStatus && app.status !== filterStatus) return false;
      if (filterJob && app.jobListing?.id !== filterJob) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          app.user?.name?.toLowerCase().includes(q) ||
          app.user?.email?.toLowerCase().includes(q) ||
          app.jobListing?.title?.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date_desc") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "date_asc")  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "name")      return (a.user?.name || "").localeCompare(b.user?.name || "");
      if (sortBy === "status")    return (a.status || "").localeCompare(b.status || "");
      return 0;
    });

  // Update status
  const handleStatusChange = useCallback(async (appId, newStatus, note = "") => {
    setUpdating(true);
    try {
      const res = await fetch(`${API}/api/jobs/applications/${appId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      const data = await res.json();
      if (data.success) {
        setApplications((prev) =>
          prev.map((app) => app.id === appId ? { ...app, status: newStatus } : app)
        );
        if (selectedApp?.id === appId) setSelectedApp((s) => ({ ...s, status: newStatus }));
        const labels = { viewed: "Marquée comme vue", accepted: "Candidature acceptée", rejected: "Candidature refusée" };
        setToast({ message: labels[newStatus] || "Statut mis à jour", type: "success" });
      } else {
        setToast({ message: data.message || "Erreur", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Erreur réseau", type: "error" });
    } finally {
      setUpdating(false);
    }
  }, [token, selectedApp]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidatures reçues</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {applications.length} candidature{applications.length !== 1 ? "s" : ""} au total
            </p>
          </div>
        </div>

        {/* Stats */}
        {!loading && applications.length > 0 && <StatsBar applications={applications} />}

        {/* Filters */}
        {!loading && applications.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un candidat..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#A7D129]/30 focus:border-[#A7D129] transition"
              />
            </div>

            <FilterDropdown
              label="Statut"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: "pending",  label: "En attente" },
                { value: "viewed",   label: "Vus" },
                { value: "accepted", label: "Acceptés" },
                { value: "rejected", label: "Refusés" },
              ]}
            />

            {jobOptions.length > 1 && (
              <FilterDropdown
                label="Offre d'emploi"
                value={filterJob}
                onChange={setFilterJob}
                options={jobOptions}
              />
            )}

            <FilterDropdown
              label="Trier par"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { value: "date_desc", label: "Plus récent" },
                { value: "date_asc",  label: "Plus ancien" },
                { value: "name",      label: "Nom A→Z" },
                { value: "status",    label: "Statut" },
              ]}
            />

            {(search || filterStatus || filterJob) && (
              <button
                onClick={() => { setSearch(""); setFilterStatus(""); setFilterJob(""); }}
                className="text-xs font-medium text-gray-400 hover:text-gray-600 transition px-2"
              >
                Réinitialiser
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-[#A7D129] border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">📭</span>
              <p className="font-semibold text-gray-700">
                {applications.length === 0 ? "Aucune candidature pour le moment" : "Aucun résultat"}
              </p>
              <p className="text-sm text-gray-400">
                {applications.length === 0
                  ? "Les candidatures apparaîtront ici dès qu'un candidat postule."
                  : "Modifiez vos filtres pour voir d'autres candidatures."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Candidat</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Offre</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Date</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide">Statut</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wide text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Candidat */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {app.user?.avatar ? (
                            <img src={app.user.avatar} alt={app.user.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#E8F5D0] text-[#2D5016] flex items-center justify-center font-bold text-sm">
                              {getInitials(app.user?.name)}
                            </div>
                          )}
                          {app.status === "pending" && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 border-2 border-white rounded-full" title="Nouveau" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-snug">{app.user?.name}</p>
                          <p className="text-xs text-gray-400 truncate">{app.user?.email}</p>
                          {app.user?.city && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin size={10} /> {app.user.city}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Offre */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-700 max-w-[180px] truncate">
                      {app.jobListing?.title}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-gray-400 hidden md:table-cell whitespace-nowrap">
                      {fmtDate(app.createdAt)}
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
  <div className="flex justify-end items-center gap-2">
    {app.cvPath && (
      <a
        href={`${API}/api/jobs/cv/download?url=${encodeURIComponent(app.cvPath)}&name=${encodeURIComponent(app.user?.name || "candidat")}`}
        target="_blank"
        rel="noreferrer"
        title="Voir CV"
        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#2D5016] bg-[#E8F5D0] border border-[#A7D129]/40 rounded-full hover:bg-[#dcf0b8] transition"
      >
        <Download size={13} />
        Voir CV
      </a>
    )}
    <button
      onClick={() => setSelectedApp(app)}
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-[#2D5016] hover:text-[#2D5016] hover:bg-[#E8F5D0]/30 transition"
    >
      Gérer <ChevronDown size={12} />
    </button>
  </div>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Result count */}
        {!loading && filtered.length > 0 && filtered.length !== applications.length && (
          <p className="text-xs text-gray-400 text-center">
            {filtered.length} résultat{filtered.length !== 1 ? "s" : ""} sur {applications.length}
          </p>
        )}
      </div>

      {/* Side panel */}
      {selectedApp && (
        <DetailPanel
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusChange={handleStatusChange}
          updating={updating}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </div>
  );
}