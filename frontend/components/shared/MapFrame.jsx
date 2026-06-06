// ─── Map Frame ────────────────────────────────────────────────────────────────
export default function MapFrame({ latitude, longitude, location, city }) {
  const hasCoords = latitude && longitude;
  const query = encodeURIComponent(
    hasCoords ? `${latitude},${longitude}` : `${location || ''} ${city || ''} Maroc`
  );
  const embedUrl = `https://maps.google.com/maps?q=${query}&z=15&output=embed`;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-orange-400 inline-block" />
        <h2 className="font-bold text-gray-900 text-base">Localisation</h2>
        {(city || location) && (
          <span className="ml-auto text-sm text-gray-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {city || location}
          </span>
        )}
      </div>
      <div className="relative w-full h-[300px]">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Localisation du bien"
          className="w-full h-full"
        />
      </div>
      {!hasCoords && (
        <div className="px-6 py-2.5 bg-amber-50 border-t border-amber-100 text-xs text-amber-600 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Localisation approximative — adresse exacte communiquée après contact
        </div>
      )}
    </section>
  );
}