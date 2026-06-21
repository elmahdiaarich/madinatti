'use client';
// ce fichier pour afficher share (instagram whatsapp facebook dans favorites page)
import { useState, useEffect, useRef } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://madinatti.ma';

function buildUrl(type, id) {
  if (type === 'job') return `${BASE_URL}/jobs/${id}`;
  return `${BASE_URL}/real-estate/${id}`;
}

export default function ShareMenu({ type, id, title, onClose }) {
  const [copied, setCopied] = useState(false);
  const [igCopied, setIgCopied] = useState(false);
  const ref = useRef(null);
  const url = buildUrl(type, id);
  const text = encodeURIComponent(`${title} — Madinatti`);
  const encodedUrl = encodeURIComponent(url);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleIgCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIgCopied(true);
      setTimeout(() => setIgCopied(false), 2500);
    } catch {}
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full right-0 mb-2 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-slide-up"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-3 pb-2">
        Partager l'annonce
      </p>

      {/* WhatsApp */}
      <a
        href={`https://wa.me/?text=${text}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-[#25D366]/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.532 5.854L.057 23.882l6.196-1.624A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.001-1.366l-.358-.213-3.722.976.994-3.633-.234-.374A9.818 9.818 0 1112 21.818z"/>
          </svg>
        </span>
        <span className="text-sm font-medium text-gray-700">WhatsApp</span>
      </a>

      {/* Facebook */}
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-[#1877F2]/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1877F2]">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </span>
        <span className="text-sm font-medium text-gray-700">Facebook</span>
      </a>

      {/* Instagram — copy + tooltip */}
      <button
        onClick={handleIgCopy}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="w-7 h-7 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
            <defs>
              <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f09433"/>
                <stop offset="25%" stopColor="#e6683c"/>
                <stop offset="50%" stopColor="#dc2743"/>
                <stop offset="75%" stopColor="#cc2366"/>
                <stop offset="100%" stopColor="#bc1888"/>
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig-grad)" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4" stroke="url(#ig-grad)" strokeWidth="2"/>
            <circle cx="17.5" cy="6.5" r="1" fill="#bc1888"/>
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-700">Instagram</span>
          {igCopied ? (
            <p className="text-[10px] text-pink-500 font-semibold mt-0.5">Lien copié — collez-le dans votre story !</p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-0.5">Copier le lien pour votre story</p>
          )}
        </div>
      </button>

      {/* Divider */}
      <div className="border-t border-gray-100 mx-4" />

      {/* Copy link */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          {copied ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#A7D129]" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          )}
        </span>
        <span className={`text-sm font-medium transition-colors ${copied ? 'text-[#2D5016]' : 'text-gray-700'}`}>
          {copied ? 'Lien copié !' : 'Copier le lien'}
        </span>
      </button>

      <div className="pb-1" />
    </div>
  );
}