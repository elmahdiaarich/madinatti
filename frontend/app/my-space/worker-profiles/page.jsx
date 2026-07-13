'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { workerProfilesService } from '../../../services/WorkerProfilesService';

const STATUS_STYLES = {
  PENDING:   { label: 'En attente',  bg: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-200' },
  APPROVED:  { label: 'Approuvé',    bg: 'bg-[#E8F5D0]', text: 'text-[#2D5016]',  border: 'border-[#A7D129]/40' },
  REJECTED:  { label: 'Refusé',      bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200' },
  SUSPENDED: { label: 'Suspendu',    bg: 'bg-orange-50',  text: 'text-orange-600', border: 'border-orange-200' },
  ARCHIVED:  { label: 'Archivé',     bg: 'bg-gray-100',   text: 'text-gray-500',   border: 'border-gray-200' },
};

const PRICING_UNIT_LABELS = { HOUR: '/heure', DAY: '/jour', TASK: '/forfait' };
const MAX_PROFILES = 5;

function DeleteConfirmModal({ profile, activeCount, onConfirm, onClose, loading }) {
  if (!profile) return null;
  const hasActiveEngagements = activeCount != null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <span className="text-xl">🗑️</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Supprimer ce profil ?</h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[220px]">{profile.headline}</p>
          </div>
        </div>

        {hasActiveEngagements ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-sm text-amber-700 font-semibold">⚠ Attention</p>
            <p className="text-xs text-amber-700 mt-1">
              Ce profil a <strong>{activeCount}</strong> réservation(s)/candidature(s) en cours.
              Des clients attendent peut-être une prestation. Supprimer quand même ?
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Cette action est réversible côté données mais le profil disparaîtra immédiatement de vos listes et de la recherche publique.</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition disabled:opacity-50">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition disabled:opacity-60">
            {loading ? 'Suppression...' : hasActiveEngagements ? 'Supprimer quand même' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ profile, onToggleActive, onRequestDelete, busy }) {
  const style = STATUS_STYLES[profile.status] || STATUS_STYLES.PENDING;
  const canViewPublic = profile.status === 'APPROVED' && profile.isActive;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4">
      <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-[#E8F5D0] flex items-center justify-center">
        {profile.photo ? (
          <img src={profile.photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-[#2D5016]">{profile.headline?.charAt(0)?.toUpperCase()}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h3 className="font-bold text-gray-900 text-sm leading-snug">{profile.headline}</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border} whitespace-nowrap`}>
            {style.label}
          </span>
        </div>
        <p className="text-xs text-[#7BA428] font-semibold mt-1">{profile.category?.name}</p>
        <p className="text-xs text-gray-400 mt-1">{profile.city}</p>
        <p className="text-sm font-bold text-[#2D5016] mt-1.5">
          {profile.isNegotiable ? 'Prix à négocier' : `${Number(profile.rate).toLocaleString('fr-MA')} MAD ${PRICING_UNIT_LABELS[profile.pricingUnit] || ''}`}
        </p>

        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
          {profile.ratingCount > 0 && (
            <span className="flex items-center gap-1">
              ⭐ {Number(profile.ratingAvg).toFixed(1)} ({profile.ratingCount} avis)
            </span>
          )}
          <span>👁 {profile.viewsCount ?? 0} vue{(profile.viewsCount ?? 0) > 1 ? 's' : ''}</span>
        </div>

        {profile.status === 'REJECTED' && profile.adminNotes && (
          <div className="mt-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
            <p className="text-xs text-red-600"><strong>Motif du refus :</strong> {profile.adminNotes}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <Link href={`/my-space/worker-profiles/edit/${profile.id}`}
            className="text-xs font-bold text-[#2D5016] hover:underline">
            Modifier
          </Link>
          {canViewPublic && (
            <Link href={`/mini-jobs/profiles/${profile.id}`} target="_blank"
              className="text-xs font-bold text-gray-500 hover:text-gray-800 hover:underline">
              Voir la fiche publique
            </Link>
          )}
          {profile.status === 'APPROVED' && (
            <button
              onClick={() => onToggleActive(profile)}
              disabled={busy}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 disabled:opacity-50"
            >
              {profile.isActive ? 'Désactiver' : 'Réactiver'}
            </button>
          )}
          <button
            onClick={() => onRequestDelete(profile)}
            disabled={busy}
            className="text-xs font-bold text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyWorkerProfilesPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeCount, setActiveCount] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = async () => {
    try {
      const res = await workerProfilesService.getMyWorkerProfiles(token);
      setProfiles(res.data ?? []);
    } catch (e) {
      toast.error(e.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const handleToggleActive = async (profile) => {
    setBusyId(profile.id);
    try {
      await workerProfilesService.toggleActive(profile.id, !profile.isActive, token);
      setProfiles((prev) => prev.map((p) => p.id === profile.id ? { ...p, isActive: !p.isActive } : p));
      toast.success(profile.isActive ? 'Profil désactivé' : 'Profil réactivé');
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const handleRequestDelete = (profile) => {
    setDeleteTarget(profile);
    setActiveCount(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await workerProfilesService.deleteWorkerProfile(deleteTarget.id, token, activeCount != null);
      setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success('Profil supprimé');
      setDeleteTarget(null);
      setActiveCount(null);
    } catch (e) {
      if (e.code === 'ACTIVE_ENGAGEMENTS') {
        setActiveCount(e.activeCount);
      } else {
        toast.error(e.message || 'Erreur lors de la suppression');
        setDeleteTarget(null);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const atCap = profiles.length >= MAX_PROFILES;

  return (
    <div className="max-w-3xl flex flex-col gap-6 p-6 lg:p-8">
      <DeleteConfirmModal
        profile={deleteTarget}
        activeCount={activeCount}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => { setDeleteTarget(null); setActiveCount(null); }}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes profils prestataire</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? 'Chargement…' : `${profiles.length} / ${MAX_PROFILES} profils`}
          </p>
        </div>

        {atCap ? (
          <div className="text-right">
            <button disabled
              className="px-5 py-2.5 bg-gray-200 text-gray-400 text-sm font-bold rounded-full cursor-not-allowed">
              + Créer un profil
            </button>
            <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
              Limite de {MAX_PROFILES} profils atteinte. Supprimez-en un pour en créer un nouveau.
            </p>
          </div>
        ) : (
          <Link href="/my-space/worker-profiles/create"
            className="px-5 py-2.5 bg-[#2D5016] text-white text-sm font-bold rounded-full hover:bg-[#A7D129] hover:text-[#2D5016] transition-all whitespace-nowrap">
            + Créer un profil
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => <div key={i} className="bg-gray-100 rounded-2xl h-28 animate-pulse" />)}
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">🔧</div>
          <p className="font-semibold text-gray-700">Aucun profil prestataire</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Créez-en un pour commencer à recevoir des demandes.</p>
          <Link href="/my-space/worker-profiles/create"
            className="inline-block px-5 py-2.5 bg-[#2D5016] text-white text-sm font-bold rounded-full hover:bg-[#A7D129] hover:text-[#2D5016] transition-all">
            + Créer un profil
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {profiles.map((p) => (
            <ProfileCard
              key={p.id} profile={p}
              onToggleActive={handleToggleActive}
              onRequestDelete={handleRequestDelete}
              busy={busyId === p.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}