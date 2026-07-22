'use client';
import Link from 'next/link';
import { Star, MapPin, BadgeCheck } from 'lucide-react';
const PRICING_UNIT_LABELS = { HOUR: '/heure', DAY: '/jour', TASK: '/forfait' };

function formatRate(rate, unit, isNegotiable) {
  if (isNegotiable) return 'Prix à négocier';
  if (rate == null) return 'Tarif sur demande';
  return `${Number(rate).toLocaleString('fr-MA')} MAD ${PRICING_UNIT_LABELS[unit] || ''}`;
}

export default function WorkerProfileCard({ profile }) {
  const initials = profile.headline?.charAt(0)?.toUpperCase() || '?';
  const isNegotiable = profile.isNegotiable;

  // Meta items in a fixed order so cards line up predictably across the grid
  const metaItems = [
    profile.city ? { key: 'city', icon: <MapPin size={12} />, label: profile.city } : null,
    profile.yearsExperience != null ? { key: 'exp', icon: null, label: `${profile.yearsExperience} ans d'exp.` } : null,
  ].filter(Boolean);

  return (
    <Link href={`/mini-jobs/profiles/${profile.id}`} className="block group h-full">
      <div className="h-full flex flex-col bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary transition-all duration-200">
        <div className="flex gap-4">
          <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-primary-mint flex items-center justify-center">
            {profile.photo ? (
              <img src={profile.photo} alt={profile.headline} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary-dark">{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                dir="auto"
                className="font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-primary-dark transition-colors"
              >
                {profile.headline}
              </h3>
              {profile.isFeatured && (
                <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-warning/40 text-warning bg-warning/10">
                  <BadgeCheck size={11} />
                  Top
                </span>
              )}
            </div>

            {profile.user?.name && (
              <p className="text-xs text-gray-500 mt-0.5">Par {profile.user.name}</p>
            )}

            {profile.category?.name && (
              <span className="inline-block text-[11px] font-bold text-primary-dark bg-primary-mint px-2.5 py-0.5 rounded-full mt-1.5">
                {profile.category.name}
              </span>
            )}

            {profile.ratingCount > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={i < Math.round(profile.ratingAvg) ? 'fill-warning text-warning' : 'fill-gray-200 text-gray-200'}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {Number(profile.ratingAvg).toFixed(1)} ({profile.ratingCount})
                </span>
              </div>
            )}

            {metaItems.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500 flex-wrap">
                {metaItems.map((item, i) => (
                  <span key={item.key} className="flex items-center gap-1">
                    {i > 0 && <span className="text-gray-300 mr-0.5">·</span>}
                    {item.icon}
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <p
            className={
              isNegotiable
                ? 'text-sm font-semibold italic text-gray-500'
                : 'text-sm font-bold text-primary-dark'
            }
          >
            {formatRate(profile.rate, profile.pricingUnit, isNegotiable)}
          </p>
          <span className="flex items-center gap-1.5 bg-primary-dark text-white text-xs font-bold px-3.5 py-2 rounded-full group-hover:bg-primary group-hover:text-primary-dark transition-colors">
            Voir le profil
          </span>
        </div>
      </div>
    </Link>
  );
}