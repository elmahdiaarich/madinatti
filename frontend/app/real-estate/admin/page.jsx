'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { realEstateService } from '@/services/realEstateService';

const fmtPrice = (v) => Number(v).toLocaleString('fr-MA');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_STYLES = {
  PENDING:  { label: 'En attente', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  APPROVED: { label: 'Approuvée',  cls: 'bg-green-50 text-green-700 border-green-200' },
  REJECTED: { label: 'Rejetée',    cls: 'bg-red-50 text-red-700 border-red-200' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { label: status, cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.cls}`}>{s.label}</span>;
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-1 ${color}`}>
      <p className="text-xs font-bold uppercase tracking-widest opacity-60">{label}</p>
      <p className="text-3xl font-extrabold">{value ?? '—'}</p>
    </div>
  );
}

// ─── Moderation modal ─────────────────────────────────────────────────────────
function ModerateModal({ listing, onClose, onDone, token }) {
  const [action, setAction] = useState('approve');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await realEstateService.moderateListing(listing.id, action, notes, token);
      onDone(listing.id, action === 'approve' ? 'APPROVED' : 'REJECTED');
      onClose();
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Modérer l'annonce</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <p className="text-sm text-gray-600 font-semibold line-clamp-2">{listing.title}</p>
        <p className="text-xs text-gray-400">{listing.user?.name} · {listing.user?.email}</p>

        <div className="flex gap-3">
          <button
            onClick={() => setAction('approve')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${action === 'approve' ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-600 hover:border-green-400'}`}
          >
            ✅ Approuver
          </button>
          <button
            onClick={() => setAction('reject')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition ${action === 'reject' ? 'bg-red-500 text-white border-red-500' : 'border-gray-200 text-gray-600 hover:border-red-400'}`}
          >
            ❌ Rejeter
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Note admin {action === 'reject' ? '(requis pour expliquer le rejet)' : '(optionnelle)'}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Raison, commentaire..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || (action === 'reject' && !notes.trim())}
          className={`py-3 rounded-xl text-white font-bold text-sm transition disabled:opacity-60 ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {submitting ? 'Traitement...' : `Confirmer — ${action === 'approve' ? 'Approuver' : 'Rejeter'}`}
        </button>
      </div>
    </div>
  );
}

export default function AdminRealEstatePage() {
  return (
    <ProtectedRoute roles={['admin']}>
      <AdminContent />
    </ProtectedRoute>
  );
}

function AdminContent() {
  const { token } = useAuth();
  const [tab, setTab] = useState('pending');
  const [listings, setListings] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [moderating, setModerating] = useState(null); // listing being moderated
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadListings();
  }, [tab, page, search]);

  const loadStats = async () => {
    try {
      const res = await realEstateService.adminGetStats(token);
      setStats(res.data);
    } catch (e) { console.error(e); }
  };

  const loadListings = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'pending') {
        res = await realEstateService.getPendingListings(token, { page, limit: 15 });
        setListings(res.listings || []);
        setPagination(res.pagination);
      } else {
        const params = { page, limit: 15, ...(tab !== 'all' && { status: tab }), ...(search && { search }) };
        res = await realEstateService.adminGetAllListings(token, params);
        setListings(res.listings || []);
        setPagination(res.pagination);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleModerationDone = (id, newStatus) => {
    setListings(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
    loadStats();
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer définitivement cette annonce ?')) return;
    setDeleting(id);
    try {
      await realEstateService.adminDeleteListing(id, token);
      setListings(prev => prev.filter(l => l.id !== id));
      loadStats();
    } catch (e) { alert(e.message); }
    finally { setDeleting(null); }
  };

  const TABS = [
    { label: 'En attente', value: 'pending' },
    { label: 'Toutes',     value: 'all' },
    { label: 'Approuvées', value: 'APPROVED' },
    { label: 'Rejetées',   value: 'REJECTED' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-primary-dark text-lg">Admin — Immobilier</h1>
          <span className="text-xs text-gray-400">Panneau d'administration</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total" value={stats.listings.total} color="bg-white border-gray-100 text-gray-800" />
            <StatCard label="En attente" value={stats.listings.pending} color="bg-yellow-50 border-yellow-100 text-yellow-800" />
            <StatCard label="Approuvées" value={stats.listings.approved} color="bg-green-50 border-green-100 text-green-800" />
            <StatCard label="Messages" value={stats.inquiries.total} color="bg-blue-50 border-blue-100 text-blue-800" />
          </div>
        )}

        {/* Tabs + search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex gap-2 flex-wrap">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => { setTab(t.value); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                  tab === t.value
                    ? 'bg-primary-dark text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-dark'
                }`}
              >
                {t.label}
                {t.value === 'pending' && stats?.listings?.pending > 0 && (
                  <span className="ml-1.5 bg-yellow-400 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                    {stats.listings.pending}
                  </span>
                )}
              </button>
            ))}
          </div>
          {tab !== 'pending' && (
            <div className="flex gap-2">
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (setSearch(searchInput), setPage(1))}
                placeholder="Rechercher..."
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-52"
              />
              <button
                onClick={() => { setSearch(searchInput); setPage(1); }}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-sage transition"
              >
                Chercher
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p className="text-4xl mb-3">🏠</p>
              <p className="font-semibold text-gray-600">Aucune annonce</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 font-semibold">Annonce</th>
                    <th className="text-left px-4 py-3 font-semibold">Vendeur</th>
                    <th className="text-left px-4 py-3 font-semibold">Prix</th>
                    <th className="text-left px-4 py-3 font-semibold">Statut</th>
                    <th className="text-left px-4 py-3 font-semibold">Date</th>
                    <th className="text-right px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {listings.map(l => (
                    <tr key={l.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-gray-800 line-clamp-1 max-w-[220px]">{l.title}</p>
                          <p className="text-xs text-gray-400">{l.city || '—'} · {l.category?.name || '—'}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-700">{l.user?.name}</p>
                        <p className="text-xs text-gray-400">{l.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-primary-dark whitespace-nowrap">
                        {fmtPrice(l.price)} MAD
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {fmtDate(l.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Moderate button — shown for pending or to re-moderate */}
                          <button
                            onClick={() => setModerating(l)}
                            className="text-xs px-3 py-1.5 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 hover:bg-yellow-100 transition font-semibold"
                          >
                            Modérer
                          </button>
                          {l.status === 'APPROVED' && (
                            <Link
                              href={`/real-estate/${l.id}`}
                              className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-semibold"
                              target="_blank"
                            >
                              Voir
                            </Link>
                          )}
                          <button
                            onClick={() => handleDelete(l.id)}
                            disabled={deleting === l.id}
                            className="text-xs px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition font-semibold disabled:opacity-50"
                          >
                            {deleting === l.id ? '...' : 'Supprimer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-1.5">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition">‹</button>
            {[...Array(pagination.totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition ${page === i + 1 ? 'bg-primary-dark text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-dark'}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
              className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 transition">›</button>
          </div>
        )}
      </div>

      {/* Moderation modal */}
      {moderating && (
        <ModerateModal
          listing={moderating}
          token={token}
          onClose={() => setModerating(null)}
          onDone={handleModerationDone}
        />
      )}
    </div>
  );
}