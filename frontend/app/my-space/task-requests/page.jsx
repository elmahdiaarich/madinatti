'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { taskRequestsService } from '../../../services/TaskRequestsService';
import ReviewForm from '@/components/mini-jobs/ReviewForm';

const STATUS_STYLES = {
  OPEN:        { label: 'Ouverte',    bg: 'bg-[#E8F5D0]', text: 'text-[#2D5016]' },
  IN_PROGRESS: { label: 'En cours',   bg: 'bg-blue-50',    text: 'text-blue-600' },
  COMPLETED:   { label: 'Terminée',   bg: 'bg-gray-100',   text: 'text-gray-500' },
  CANCELLED:   { label: 'Annulée',    bg: 'bg-red-50',      text: 'text-red-600' },
  ARCHIVED:    { label: 'Archivée',   bg: 'bg-gray-100',   text: 'text-gray-400' },
};

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
}

function TaskCard({ task, token, toast, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const style = STATUS_STYLES[task.status] || STATUS_STYLES.OPEN;

  const loadApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await taskRequestsService.getApplicationsForTaskRequest(task.id, token);
      setApplications(res.data ?? []);
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setLoadingApps(false);
    }
  };

  const handleExpand = () => {
    setExpanded((e) => !e);
    if (!expanded && applications.length === 0) loadApplications();
  };

  const handleAccept = async (app) => {
    setBusy(true);
    try {
      await taskRequestsService.acceptApplication(app.id, token);
      toast.success('Candidature acceptée');
      onRefresh();
      loadApplications();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelAcceptance = async () => {
    const reason = prompt('Motif de l\'annulation (optionnel) :') || undefined;
    setBusy(true);
    try {
      await taskRequestsService.cancelAcceptance(task.id, reason, token);
      toast.success('Acceptation annulée');
      onRefresh();
      loadApplications();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const handleMarkCompleted = async () => {
    setBusy(true);
    try {
      await taskRequestsService.markCompleted(task.id, token);
      toast.success('Demande marquée comme terminée');
      onRefresh();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const acceptedApp = applications.find((a) => a.status === 'ACCEPTED');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {reviewTarget && (
        <ReviewForm
          targetType="WORKER_PROFILE"
          targetId={reviewTarget.workerProfile?.id}
          taskApplicationId={reviewTarget.id}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => { setReviewTarget(null); toast.success('Merci pour votre avis !'); }}
        />
      )}

      <button onClick={handleExpand} className="w-full text-left p-5">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="font-bold text-gray-900 text-sm">{task.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{task.city} · {fmtDate(task.neededDate)}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
            {style.label}
          </span>
        </div>
        <p className="text-sm font-bold text-[#2D5016] mt-2">
          {task.budget ? `${Number(task.budget).toLocaleString('fr-MA')} MAD` : 'Budget à discuter'}
        </p>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Candidatures</p>
          {loadingApps ? (
            <p className="text-sm text-gray-400">Chargement…</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune candidature pour le moment.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl p-3 flex-wrap">
                 <div>
                    <p className="text-sm font-semibold text-gray-800">{app.workerProfile?.headline}</p>
                    {app.message && <p className="text-xs text-gray-500 mt-0.5">{app.message}</p>}
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{app.status}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {app.workerProfile?.id && (
                      <Link href={`/mini-jobs/profiles/${app.workerProfile.id}`} target="_blank"
                        className="text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition">
                        Voir le profil
                      </Link>
                    )}
                    {task.status === 'OPEN' && app.status === 'PENDING' && (
                      <button onClick={() => handleAccept(app)} disabled={busy}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#2D5016] text-white hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
                        Accepter
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {task.status === 'IN_PROGRESS' && acceptedApp && (
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <button onClick={handleMarkCompleted} disabled={busy}
                className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#2D5016] text-white hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
                Marquer comme terminée
              </button>
              <button onClick={handleCancelAcceptance} disabled={busy}
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-60">
                Annuler l'acceptation
              </button>
            </div>
          )}

          {task.status === 'COMPLETED' && acceptedApp && (
            <button onClick={() => setReviewTarget(acceptedApp)}
              className="text-xs font-bold px-3 py-1.5 rounded-full border border-[#A7D129] text-[#2D5016] hover:bg-[#E8F5D0] transition mt-3">
              Laisser un avis au prestataire
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyTaskRequestsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await taskRequestsService.getMyTaskRequests(token);
      setTasks(res.data ?? []);
    } catch (e) {
      toast.error(e.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  return (
    <div className="max-w-3xl flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mes demandes</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gérez vos demandes de tâches et candidatures reçues</p>
        </div>
        <Link href="/mini-jobs/tasks/create"
          className="px-5 py-2.5 bg-[#2D5016] text-white text-sm font-bold rounded-full hover:bg-[#A7D129] hover:text-[#2D5016] transition-all whitespace-nowrap">
          + Publier une demande
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">{[1, 2].map((i) => <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-semibold text-gray-700">Aucune demande publiée</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} token={token} toast={toast} onRefresh={load} />
          ))}
        </div>
      )}
    </div>
  );
}