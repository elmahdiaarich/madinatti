'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { workerProfilesService } from '../../../../services/WorkerProfilesService';
import ReviewsList from '@/components/mini-jobs/ReviewsList';
import BookingModal from '@/components/mini-jobs/BookingModal';
import MapFrame from '@/components/shared/MapFrame';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const PRICING_UNIT_LABELS = { HOUR: '/heure', DAY: '/jour', TASK: '/forfait' };

function toWhatsAppNumber(phone) {
  if (!phone) return null;
  const digitsOnly = phone.replace(/\D/g, ''); // enlève espaces, tirets, etc.
  if (!digitsOnly) return null;
  // Format local marocain 06XXXXXXXX / 07XXXXXXXX -> 2126XXXXXXXX / 2127XXXXXXXX
  if (digitsOnly.startsWith('0')) return `212${digitsOnly.slice(1)}`;
  // Déjà au format international sans + (ex: 2126...)
  if (digitsOnly.startsWith('212')) return digitsOnly;
  return digitsOnly;
}const DAY_LABELS = { mon: 'Lundi', tue: 'Mardi', wed: 'Mercredi', thu: 'Jeudi', fri: 'Vendredi', sat: 'Samedi', sun: 'Dimanche' };

export default function WorkerProfileDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    workerProfilesService.getWorkerProfileById(id)
      .then((res) => setProfile(res.data ?? res))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner message="Chargement du profil..." />;
  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-6xl">🔍</span>
        <h1 className="text-2xl font-bold text-gray-800">Profil introuvable</h1>
        <Link href="/mini-jobs" className="mt-2 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-semibold hover:bg-[#A7D129] hover:text-[#2D5016] transition-colors">
          Retour aux prestataires
        </Link>
      </div>
    );
  }

  const handleReserver = () => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'citizen') return;
    setShowBooking(true);
  };

  const portfolio = Array.isArray(profile.portfolioImages) ? profile.portfolioImages : [];
  const availability = profile.availability && typeof profile.availability === 'object' ? profile.availability : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {showBooking && (
        <BookingModal workerProfile={profile} onClose={() => setShowBooking(false)} />
      )}

      <div className="bg-gradient-to-br from-[#2D5016] via-[#3a6b1e] to-[#4a8525] text-white py-10">
        <div className="max-w-[1000px] mx-auto px-4">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="w-[90px] h-[90px] shrink-0 bg-white border-2 border-[#A7D129]/50 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm">
              {profile.photo ? (
                <img src={profile.photo} alt={profile.headline} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-extrabold text-[#2D5016] bg-[#E8F5D0] w-full h-full flex items-center justify-center">
                  {profile.headline?.charAt(0)?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mb-1">{profile.headline}</h1>
              {profile.category?.name && <p className="text-[#A7D129] font-bold text-base mb-3">{profile.category.name}</p>}
              <div className="flex flex-wrap gap-2 items-center">
                {profile.city && <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-semibold">📍 {profile.city}</span>}
                {profile.yearsExperience != null && (
                  <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-semibold">{profile.yearsExperience} ans d'expérience</span>
                )}
                {profile.ratingCount > 0 && (
                  <span className="px-3 py-1 bg-[#A7D129] text-[#2D5016] rounded-full text-xs font-bold">
                    ★ {Number(profile.ratingAvg).toFixed(1)} ({profile.ratingCount})
                  </span>
                )}
              </div>
            </div>

            <div className="hidden md:flex shrink-0 self-center gap-2">
              {profile.user?.phone && (
                <>
                  <a href={`tel:${profile.user.phone}`}
                    className="px-5 py-3 bg-white/15 text-white font-bold rounded-full text-sm hover:bg-white/25 transition-all duration-200 flex items-center gap-2">
                    📞 Appeler
                  </a>
                  <a href={`https://wa.me/${toWhatsAppNumber(profile.user.phone)}`} target="_blank" rel="noreferrer"
                    className="px-5 py-3 bg-[#25D366] text-white font-bold rounded-full text-sm hover:bg-[#1ebe5b] transition-all duration-200 flex items-center gap-2">
                    💬 WhatsApp
                  </a>
                </>
              )}
              <button onClick={handleReserver}
                className="px-8 py-3 bg-[#A7D129] text-[#2D5016] font-extrabold rounded-full text-sm shadow-lg hover:bg-white transition-all duration-200 hover:scale-[1.03] active:scale-100">
                Réserver
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 py-8 flex flex-col gap-5">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
            <h2 className="font-bold text-gray-900 text-base">Description</h2>
          </div>
          <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {profile.description}
          </div>
          <div className="px-6 pb-5 pt-2 border-t border-gray-50">
            <p className="text-lg font-extrabold text-[#2D5016]">
              {profile.isNegotiable
                ? 'Prix à négocier'
                : `${Number(profile.rate).toLocaleString('fr-MA')} MAD ${PRICING_UNIT_LABELS[profile.pricingUnit] || ''}`}
            </p>
          </div>
        </section>

        {portfolio.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
              <h2 className="font-bold text-gray-900 text-base">Portfolio</h2>
            </div>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {portfolio.map((img, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {availability && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
              <h2 className="font-bold text-gray-900 text-base">Disponibilité</h2>
            </div>
            <div className="px-6 py-5 flex flex-wrap gap-2">
              {Object.entries(availability).map(([day, hours]) => (
                Array.isArray(hours) && hours.length === 2 ? (
                  <span key={day} className="px-3 py-1.5 rounded-full bg-[#E8F5D0] text-[#2D5016] text-xs font-semibold">
                    {DAY_LABELS[day] || day} · {hours[0]}h–{hours[1]}h
                  </span>
                ) : null
              ))}
            </div>
          </section>
        )}

        <MapFrame latitude={profile.latitude} longitude={profile.longitude} location={profile.city} city={profile.city} />

        <ReviewsList targetType="WORKER_PROFILE" targetId={profile.id} />

        <div className="md:hidden flex flex-col gap-2">
          {profile.user?.phone && (
            <div className="flex gap-2">
              <a href={`tel:${profile.user.phone}`}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-full text-sm text-center hover:bg-gray-200 transition-all duration-200">
                📞 Appeler
              </a>
              <a href={`https://wa.me/${toWhatsAppNumber(profile.user.phone)}`} target="_blank" rel="noreferrer"
                className="flex-1 py-3 bg-[#25D366] text-white font-bold rounded-full text-sm text-center hover:bg-[#1ebe5b] transition-all duration-200">
                💬 WhatsApp
              </a>
            </div>
          )}
          <button onClick={handleReserver}
            className="w-full py-3.5 bg-[#A7D129] text-[#2D5016] font-extrabold rounded-full text-sm shadow hover:bg-[#2D5016] hover:text-white transition-all duration-200">
            Réserver
          </button>
        </div>
      </div>
    </div>
  );
}