'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { bookingsService } from '../../services/BookingsService';

export default function BookingModal({ workerProfile, onClose }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({ taskDescription: '', requestedDate: '', estimatedHours: '', clientPhone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.taskDescription.trim() || !form.requestedDate) {
      setError('Décrivez votre besoin et choisissez une date');
      return;
    }
    setSubmitting(true);
    try {
      await bookingsService.createBooking({
        workerProfileId: workerProfile.id,
        taskDescription: form.taskDescription.trim(),
        requestedDate: form.requestedDate,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
        clientPhone: form.clientPhone || null,
      }, token);
      toast.success('Demande de réservation envoyée !', { title: 'Réservation ✦' });
      onClose();
    } catch (err) {
      setError(err.message || 'Erreur lors de la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Réserver {workerProfile.headline}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Décrivez votre besoin, le prestataire vous répondra</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Décrivez votre besoin *</label>
            <textarea
              value={form.taskDescription}
              onChange={(e) => set('taskDescription', e.target.value)}
              rows={4}
              placeholder="Ex: Réparer une fuite sous l'évier de la cuisine"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] transition resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Date souhaitée *</label>
              <input type="date" value={form.requestedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('requestedDate', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] transition" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Durée estimée (h)</label>
              <input type="number" min="1" value={form.estimatedHours}
                onChange={(e) => set('estimatedHours', e.target.value)}
                placeholder="Ex: 2"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] transition" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Téléphone de contact</label>
            <input type="tel" value={form.clientPhone}
              onChange={(e) => set('clientPhone', e.target.value)}
              placeholder="06XXXXXXXX"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] transition" />
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
            {submitting ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </div>
      </div>
    </div>
  );
}