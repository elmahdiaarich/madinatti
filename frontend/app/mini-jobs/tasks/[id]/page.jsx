'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Search, CircleCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { taskRequestsService } from '../../../../services/TaskRequestsService';
import ApplyModal from '@/components/mini-jobs/ApplyModal';
import MapFrame from '@/components/shared/MapFrame';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const fmtDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const STATUS_INFO = {
  OPEN:        { label: 'Ouverte',  className: 'bg-primary text-primary-dark' },
  IN_PROGRESS: { label: 'En cours', className: 'bg-warning/20 text-warning' },
  COMPLETED:   { label: 'Terminée', className: 'bg-success/15 text-success' },
  CANCELLED:   { label: 'Annulée',  className: 'bg-red-100 text-red-600' },
  ARCHIVED:    { label: 'Archivée', className: 'bg-gray-200 text-gray-500' },
};

const getStatusInfo = (status) =>
  STATUS_INFO[status] || { label: status || 'Inconnu', className: 'bg-gray-200 text-gray-500' };

export default function TaskRequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [applied, setApplied] = useState(false);

  const fetchTask = useCallback((signal) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    taskRequestsService.getTaskRequestById(id, signal ? { signal } : undefined)
      .then((res) => setTask(res.data ?? res))
      .catch((e) => {
        if (e?.name !== 'AbortError') setError(e.message || 'Une erreur est survenue.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTask(controller.signal);
    return () => controller.abort();
  }, [fetchTask]);

  if (loading) return <LoadingSpinner message="Chargement de la demande..." />;

  // Erreur réseau/serveur : distincte du cas "introuvable"
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <Search size={24} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Impossible de charger la demande</h1>
        <p className="text-sm text-gray-500 max-w-sm">{error}</p>
        <button
          onClick={() => fetchTask()}
          className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 bg-primary-dark text-white rounded-full text-sm font-semibold hover:bg-primary hover:text-primary-dark transition-colors"
        >
          <RefreshCw size={14} />
          Réessayer
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-primary-mint flex items-center justify-center">
          <Search size={24} className="text-primary-dark" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Demande introuvable</h1>
        <Link href="/mini-jobs?tab=tasks" className="mt-2 px-6 py-2.5 bg-primary-dark text-white rounded-full text-sm font-semibold hover:bg-primary hover:text-primary-dark transition-colors">
          Retour aux demandes
        </Link>
      </div>
    );
  }

  const isOwner = user && String(task.userId) === String(user.id);
  const isOpen = task.status === 'OPEN';
  const statusInfo = getStatusInfo(task.status);

  const handlePostuler = () => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'citizen') {
      toast.error('Seuls les comptes particuliers peuvent postuler à une demande.');
      return;
    }
    if (isOwner) return;
    if (!isOpen) {
      toast.error("Cette demande n'accepte plus de candidatures.");
      return;
    }
    setShowApply(true);
  };

  const handleApplySuccess = () => {
    setShowApply(false);
    setApplied(true);
    toast.success('Candidature envoyée !');
    // Resynchronise avec le serveur (ex: statut peut changer après candidature)
    fetchTask();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showApply && (
        <ApplyModal
          taskRequest={task}
          onClose={() => setShowApply(false)}
          onSuccess={handleApplySuccess}
        />
      )}

      <div className="bg-primary-dark text-white py-10">
        <div className="max-w-[900px] mx-auto px-4">
          <Link
            href="/mini-jobs?tab=tasks"
            aria-label="Retour aux demandes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white transition-colors mb-5"
          >
            <ArrowLeft size={14} />
            Retour aux demandes
          </Link>

          <div className="flex items-start justify-between gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">{task.title}</h1>
            <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
          </div>
{task.category?.name && <p className="text-primary font-bold text-base mb-1.5">{task.category.name}</p>}
          {task.user?.name && (
            <p className="text-white/70 text-sm mb-3">Publiée par {task.user.name}</p>
          )}          <div className="flex flex-wrap gap-2 items-center">
            {task.city && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold">
                <MapPin size={12} />{task.location ? `${task.location}, ${task.city}` : task.city}
              </span>
            )}
            {task.neededDate && fmtDate(task.neededDate) && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-semibold">
                <Calendar size={12} />{fmtDate(task.neededDate)}
              </span>
            )}
            <span className="px-3 py-1 bg-primary text-primary-dark rounded-full text-xs font-bold">
              {task.budget ? `${Number(task.budget).toLocaleString('fr-MA')} MAD` : 'Budget à discuter'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-8 flex flex-col gap-5">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-primary inline-block" />
            <h2 className="font-bold text-gray-900 text-base">Description de la tâche</h2>
          </div>
          <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {task.description}
          </div>
        </section>

        <MapFrame
          latitude={task.latitude}
          longitude={task.longitude}
          location={task.location || task.city}
          city={task.city}
        />

        {isOwner ? (
          <div className="bg-primary-mint border border-primary/40 rounded-2xl p-5 text-center">
            <p className="text-sm font-semibold text-primary-dark">C'est votre demande</p>
            <Link href="/my-space/task-requests" className="text-xs font-bold text-primary-dark underline mt-1 inline-block">
              Gérer les candidatures →
            </Link>
          </div>
        ) : applied ? (
          <div className="bg-primary-mint border border-primary/40 rounded-2xl p-5 text-center flex items-center justify-center gap-2">
            <CircleCheck size={16} className="text-primary-dark" />
            <p className="text-sm font-semibold text-primary-dark">Candidature envoyée</p>
          </div>
        ) : !isOpen ? (
          <div className="bg-gray-100 border border-gray-200 rounded-2xl p-5 text-center">
            <p className="text-sm font-semibold text-gray-500">
              Cette demande est « {statusInfo.label.toLowerCase()} » et n'accepte plus de candidatures.
            </p>
          </div>
        ) : (
          <button onClick={handlePostuler}
            className="w-full py-4 bg-primary text-primary-dark font-extrabold rounded-2xl text-sm shadow hover:bg-primary-dark hover:text-white transition-all duration-200">
            {user ? 'Postuler à cette demande' : 'Se connecter pour postuler'}
          </button>
        )}
      </div>
    </div>
  );
}