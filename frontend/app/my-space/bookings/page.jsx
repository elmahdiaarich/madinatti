'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { bookingsService } from '../../../services/BookingsService';
import ReviewForm from '@/components/mini-jobs/ReviewForm';

const STATUS_STYLES = {
  PENDING:   { label: 'En attente',  bg: 'bg-amber-50',  text: 'text-amber-600', border: 'border-l-amber-400' },
  ACCEPTED:  { label: 'Acceptée',    bg: 'bg-[#E8F5D0]', text: 'text-[#2D5016]', border: 'border-l-[#A7D129]' },
  DECLINED:  { label: 'Refusée',     bg: 'bg-red-50',     text: 'text-red-600',   border: 'border-l-red-400' },
  COMPLETED: { label: 'Terminée',    bg: 'bg-blue-50',    text: 'text-blue-600',  border: 'border-l-blue-400' },
  CANCELLED: { label: 'Annulée',     bg: 'bg-gray-100',   text: 'text-gray-500',  border: 'border-l-gray-300' },
};

function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all
        ${active ? 'bg-[#2D5016] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
      {children}
    </button>
  );
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
}

function toWhatsAppNumber(phone) {
  if (!phone) return null;
  const digitsOnly = phone.replace(/\D/g, '');
  if (!digitsOnly) return null;
  if (digitsOnly.startsWith('0')) return `212${digitsOnly.slice(1)}`;
  if (digitsOnly.startsWith('212')) return digitsOnly;
  return digitsOnly;
}

function ContactButtons({ phone }) {
  if (!phone) return null;
  return (
    <div className="flex items-center gap-2">
      <a href={`tel:${phone}`}
        className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
        📞 Appeler
      </a>
      <a href={`https://wa.me/${toWhatsAppNumber(phone)}`} target="_blank" rel="noreferrer"
        className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5b] transition">
        💬 WhatsApp
      </a>
    </div>
  );
}

function Avatar({ src, fallback }) {
  return (
    <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-[#E8F5D0] flex items-center justify-center">
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-bold text-[#2D5016]">{fallback?.charAt(0)?.toUpperCase() || '?'}</span>
      )}
    </div>
  );
}

export default function MyBookingsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [tab, setTab] = useState(searchParams.get('tab') === 'worker' ? 'worker' : 'client');
  const [asClient, setAsClient] = useState([]);
  const [asWorker, setAsWorker] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const highlightRef = useRef(null);

  const load = async () => {
    try {
      const [clientRes, workerRes] = await Promise.all([
        bookingsService.getMyBookingsAsClient(token),
        bookingsService.getMyBookingsAsWorker(token),
      ]);
      setAsClient(clientRes.data ?? []);
      setAsWorker(workerRes.data ?? []);
    } catch (e) {
      toast.error(e.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  useEffect(() => {
    if (!loading && highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [loading, highlightId, tab]);

  const handleRespond = async (booking, accept) => {
    setBusyId(booking.id);
    try {
      await bookingsService.respondToBooking(booking.id, accept, null, token);
      toast.success(accept ? 'Réservation acceptée' : 'Réservation refusée');
      load();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkCompleted = async (booking) => {
    setBusyId(booking.id);
    try {
      await bookingsService.markBookingCompleted(booking.id, token);
      toast.success('Réservation marquée comme terminée');
      load();
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const sortedList = useMemo(() => {
    const list = tab === 'client' ? asClient : asWorker;
    return [...list].sort((a, b) => new Date(a.requestedDate) - new Date(b.requestedDate));
  }, [tab, asClient, asWorker]);

  return (
    <div className="max-w-3xl flex flex-col gap-6 p-6 lg:p-8">
      {reviewTarget && (
        <ReviewForm
          targetType="WORKER_PROFILE"
          targetId={reviewTarget.workerProfileId}
          bookingId={reviewTarget.id}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => { setReviewTarget(null); toast.success('Merci pour votre avis !'); load(); }}
        />
      )}

      <div>
        <h1 className="text-xl font-bold text-gray-900">Mes réservations</h1>
        <p className="text-sm text-gray-400 mt-0.5">Réservations en tant que client et en tant que prestataire</p>
      </div>

      <div className="flex gap-2">
        <Tab active={tab === 'client'} onClick={() => setTab('client')}>En tant que client</Tab>
        <Tab active={tab === 'worker'} onClick={() => setTab('worker')}>En tant que prestataire</Tab>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">{[1, 2].map((i) => <div key={i} className="bg-gray-100 rounded-2xl h-32 animate-pulse" />)}</div>
      ) : sortedList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-semibold text-gray-700">
            Aucune réservation {tab === 'client' ? 'en tant que client' : 'en tant que prestataire'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sortedList.map((b) => {
            const style = STATUS_STYLES[b.status] || STATUS_STYLES.PENDING;
            const isHighlighted = b.id === highlightId;
            const hasReview = !!b.review;

            return (
              <div key={b.id}
                ref={isHighlighted ? highlightRef : null}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-l-4 ${style.border}
                  ${isHighlighted ? 'ring-2 ring-[#A7D129] ring-offset-2' : ''}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    {tab === 'client' ? (
                      <Avatar src={b.workerProfile?.photo} fallback={b.workerProfile?.headline} />
                    ) : (
                      <Avatar src={b.client?.avatar} fallback={b.client?.name} />
                    )}
                    <div>
                      <p className="font-bold text-gray-900 text-sm">
                        {tab === 'client' ? b.workerProfile?.headline : b.client?.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(b.requestedDate)}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-3">{b.taskDescription}</p>
                {b.workerNote && (
                  <p className="text-xs text-gray-400 mt-2 italic">Note du prestataire : {b.workerNote}</p>
                )}

                <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
                  <ContactButtons phone={tab === 'client' ? b.workerProfile?.user?.phone : b.client?.phone} />

                  <div className="flex items-center gap-3 flex-wrap">
                    {tab === 'worker' && b.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleRespond(b, true)} disabled={busyId === b.id}
                          className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#2D5016] text-white hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
                          Accepter
                        </button>
                        <button onClick={() => handleRespond(b, false)} disabled={busyId === b.id}
                          className="text-xs font-bold px-3 py-1.5 rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-60">
                          Refuser
                        </button>
                      </>
                    )}
                    {tab === 'client' && b.status === 'ACCEPTED' && (
                      <button onClick={() => handleMarkCompleted(b)} disabled={busyId === b.id}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#2D5016] text-white hover:bg-[#A7D129] hover:text-[#2D5016] transition disabled:opacity-60">
                        Marquer comme terminée
                      </button>
                    )}
                    {tab === 'client' && b.status === 'COMPLETED' && (
                      hasReview ? (
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-400">
                          ✓ Avis envoyé
                        </span>
                      ) : (
                        <button onClick={() => setReviewTarget(b)}
                          className="text-xs font-bold px-3 py-1.5 rounded-full border border-[#A7D129] text-[#2D5016] hover:bg-[#E8F5D0] transition">
                          Laisser un avis
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}