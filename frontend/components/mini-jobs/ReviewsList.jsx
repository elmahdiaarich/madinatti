'use client';
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { reviewsService } from '@/services/reviewsService';
import ReviewForm from './ReviewForm';

function StarRow({ value, size = 14 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size}
          className={i <= Math.round(value) ? 'fill-[#A7D129] text-[#A7D129]' : 'text-gray-200'} />
      ))}
    </div>
  );
}

export default function ReviewsList({ targetType = 'WORKER_PROFILE', targetId, bookingId, taskApplicationId, canReview = true }) {  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await reviewsService.getReviews(targetType, targetId);
      const data = res.data ?? res;
      setReviews(data.items ?? []);
      setRatingAvg(data.ratingAvg ?? 0);
      setRatingCount(data.ratingCount ?? (data.items?.length || 0));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (targetId) load(); }, [targetId]);

  const alreadyReviewed = user && reviews.some((r) => r.userId === user.id);

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
          <h2 className="font-bold text-gray-900 text-base">Avis</h2>
          {ratingCount > 0 && (
            <span className="flex items-center gap-1.5 text-sm text-gray-500">
              <StarRow value={ratingAvg} />
              <span className="font-semibold text-gray-700">{Number(ratingAvg).toFixed(1)}</span>
              <span>({ratingCount})</span>
            </span>
          )}
        </div>
        {user && !alreadyReviewed && canReview && (
          <button onClick={() => setShowForm(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#2D5016] text-white hover:bg-[#A7D129] hover:text-[#2D5016] transition">
            Laisser un avis
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {loading ? (
          <p className="px-6 py-6 text-sm text-gray-400">Chargement des avis...</p>
        ) : reviews.length === 0 ? (
          <p className="px-6 py-6 text-sm text-gray-400">Aucun avis pour le moment.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="px-6 py-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-800">{r.user?.name || 'Utilisateur'}</span>
                  {r.isVerified && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016]">
                      ✓ Vérifié
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <StarRow value={r.rating} />
              {r.comment && <p className="text-sm text-gray-600 mt-1.5">{r.comment}</p>}
            </div>
          ))
        )}
      </div>

      {showForm && (
        <ReviewForm
          targetType={targetType}
          targetId={targetId}
          bookingId={bookingId}
          taskApplicationId={taskApplicationId}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); load(); toast.success('Merci pour votre avis !'); }}
        />
      )}
    </section>
  );
}