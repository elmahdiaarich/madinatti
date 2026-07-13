'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { reviewsService } from '@/services/reviewsService';

export default function ReviewForm({ targetType, targetId, bookingId, taskApplicationId, onClose, onSuccess }) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Sélectionnez une note'); return; }
    setSubmitting(true);
    try {
      await reviewsService.createReview({
        targetType, targetId, rating,
        comment: comment.trim() || undefined,
        bookingId, taskApplicationId,
      }, token);
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || "Erreur lors de l'envoi de l'avis");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Laisser un avis</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="flex items-center justify-center gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(i)}>
              <Star size={28} className={(hover || rating) >= i ? 'fill-[#A7D129] text-[#A7D129]' : 'text-gray-200'} />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Partagez votre expérience (optionnel)"
          className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#A7D129] transition resize-none mb-4"
        />

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 bg-[#2D5016] text-white rounded-xl font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
            {submitting ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  );
}