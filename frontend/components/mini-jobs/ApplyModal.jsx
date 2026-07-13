'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { taskRequestsService } from '../../services/TaskRequestsService';

export default function ApplyModal({ taskRequest, onClose, onSuccess }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await taskRequestsService.applyToTaskRequest(taskRequest.id, message.trim() || undefined, token);
      toast.success('Candidature envoyée !', { title: 'Candidature ✦' });
      onSuccess?.();
    } catch (err) {
      if (err.code === 'NEEDS_WORKER_PROFILE') {
        toast.info(
          'Vous devez créer un profil prestataire dans cette catégorie pour postuler.',
          { title: 'Profil requis', duration: 6000 }
        );
        onClose();
        router.push(
          `/my-space/worker-profiles/create?returnToTask=${taskRequest.id}&categorySlug=${taskRequest.category?.slug || ''}`
        );
        return;
      }
      setError(err.message || 'Erreur lors de la candidature');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Postuler à cette demande</h3>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{taskRequest.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <label className="text-xs font-semibold text-gray-500 mb-1 block">Message (optionnel)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Présentez-vous brièvement, votre disponibilité..."
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] transition resize-none mb-4"
        />

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
            {submitting ? 'Envoi...' : 'Postuler'}
          </button>
        </div>
      </div>
    </div>
  );
}