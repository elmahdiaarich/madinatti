"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { MailOpen, Mail, ChevronDown, AlertCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Constants ────────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  REJECTION:      { label: "Modération",   color: "bg-red-100 text-red-700" },
  REPORT_CONTACT: { label: "Signalement",  color: "bg-yellow-100 text-yellow-700" },
  DEFAULT:        { label: "Information",  color: "bg-blue-100 text-blue-700" },
};

const TYPE_OPTIONS = [
  { value: "REJECTION",      label: "Modération" },
  { value: "REPORT_CONTACT", label: "Signalement" },
  { value: "DEFAULT",        label: "Information" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }) : "—";

// ─── Type Badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const t = TYPE_CONFIG[type] || TYPE_CONFIG.DEFAULT;
  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${t.color}`}>
      {t.label}
    </span>
  );
}

export default function MessagesPage() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchMsgs = async () => {
      try {
        const res = await fetch(`${API}/api/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.data || []);
        } else {
          setError(true);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMsgs();
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API}/api/messages/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    const unread = messages.filter(m => !m.isRead);
    if (unread.length === 0) return;
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    try {
      await Promise.all(
        unread.map(m =>
          fetch(`${API}/api/messages/${m.id}/read`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleClick = (msg) => {
    setExpandedId(prev => prev === msg.id ? null : msg.id);
    if (!msg.isRead) markAsRead(msg.id);
  };

  const unreadCount = messages.filter(m => !m.isRead).length;

  const filtered = filterType
    ? messages.filter(m => (m.type || "DEFAULT") === filterType)
    : messages;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vos Messages</h1>
          <p className="text-gray-500 mt-1">
            Communications avec l'équipe modération et notifications système.
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-[#2D5016] text-white text-xs font-bold">
                {unreadCount} non lu{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-semibold text-[#2D5016] hover:text-[#A7D129] transition shrink-0 mt-1"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filter */}
      {!loading && messages.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setFilterOpen(o => !o)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition ${
                filterType ? "border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {filterType ? TYPE_CONFIG[filterType].label : "Type"}
              <ChevronDown size={14} />
            </button>
            {filterOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg overflow-hidden z-10">
                <button
                  onClick={() => { setFilterType(""); setFilterOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-50 transition"
                >
                  Tous
                </button>
                {TYPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setFilterType(opt.value); setFilterOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {filterType && (
            <button
              onClick={() => setFilterType("")}
              className="text-xs font-medium text-gray-400 hover:text-gray-600 transition"
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-[#A7D129] border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-2">
            <AlertCircle className="text-red-300 w-12 h-12 mb-1" />
            <p className="font-semibold text-gray-700">Impossible de charger les messages</p>
            <p className="text-sm text-gray-400">Veuillez réessayer plus tard.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <MailOpen className="text-gray-300 w-12 h-12 mb-3" />
            <p>Votre boîte de réception est vide.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <MailOpen className="text-gray-300 w-12 h-12 mb-3" />
            <p>Aucun message pour ce filtre.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(msg => {
              const isExpanded = expandedId === msg.id;
              return (
                <div
                  key={msg.id}
                  onClick={() => handleClick(msg)}
                  className={`p-5 flex gap-4 transition-colors cursor-pointer hover:bg-gray-50 ${msg.isRead ? 'bg-white' : 'bg-green-50/30'}`}
                >
                  <div className="relative shrink-0 mt-1">
                    {msg.isRead
                      ? <MailOpen className="text-gray-400" size={20} />
                      : <Mail className="text-[#2D5016]" size={20} />
                    }
                    {!msg.isRead && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <TypeBadge type={msg.type} />
                        <p className={`text-sm ${msg.isRead ? 'text-gray-600' : 'text-gray-900 font-bold'}`}>
                          {msg.targetTitle || 'Général'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p className="text-xs text-gray-400">{fmtDate(msg.createdAt)}</p>
                        <ChevronDown
                          size={14}
                          className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                    {isExpanded ? (
                      <p className="text-sm mt-2 text-gray-700 bg-gray-50 rounded-xl p-3 border border-gray-100 whitespace-pre-wrap">
                        {msg.adminMessage}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">Cliquez pour voir le message</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}