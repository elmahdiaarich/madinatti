'use client';

import { Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LoadingSpinner from "@/components/shared/LoadingSpinner";


function CuteRobot() {
  return (
    <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto" xmlns="http://www.w3.org/2000/svg">
      {/* Antenna */}
      <line x1="100" y1="30" x2="100" y2="15" stroke="#2D5016" strokeWidth="3" strokeLinecap="round" />
      <circle cx="100" cy="12" r="6" fill="#A7D129">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Head */}
      <rect x="55" y="30" width="90" height="70" rx="20" fill="#2D5016" />
      <rect x="65" y="42" width="70" height="46" rx="14" fill="#E8F5D0" />

      {/* Eyes */}
      <circle cx="88" cy="65" r="8" fill="#2D5016">
        <animate attributeName="ry" values="8;1;8" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="112" cy="65" r="8" fill="#2D5016">
        <animate attributeName="ry" values="8;1;8" dur="4s" repeatCount="indefinite" />
      </circle>

      {/* Smile */}
      <path d="M 85 78 Q 100 88 115 78" stroke="#2D5016" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* Body */}
      <rect x="65" y="105" width="70" height="60" rx="16" fill="#A7D129" />
      <circle cx="100" cy="135" r="14" fill="#E8F5D0" />
      <circle cx="100" cy="135" r="6" fill="#2D5016">
        <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />
      </circle>

      {/* Arms */}
      <g>
        <line x1="65" y1="120" x2="40" y2="105" stroke="#2D5016" strokeWidth="6" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" values="0 65 120; -15 65 120; 0 65 120"
            dur="1.8s" repeatCount="indefinite" />
        </line>
        <circle cx="40" cy="105" r="7" fill="#2D5016">
          <animateTransform attributeName="transform" type="rotate" values="0 65 120; -15 65 120; 0 65 120"
            dur="1.8s" repeatCount="indefinite" />
        </circle>
      </g>
      <line x1="135" y1="120" x2="160" y2="130" stroke="#2D5016" strokeWidth="6" strokeLinecap="round" />
      <circle cx="160" cy="130" r="7" fill="#2D5016" />

      {/* Legs */}
      <rect x="75" y="165" width="14" height="20" rx="6" fill="#2D5016" />
      <rect x="111" y="165" width="14" height="20" rx="6" fill="#2D5016" />
    </svg>
  );
}

 function ComingSoon() {
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || 'Cette section';

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-gray-50 text-center">
      <CuteRobot />
      <h1 className="text-2xl font-extrabold text-[#2D5016] mt-4">
        {feature} arrive bientôt !
      </h1>
      <p className="text-sm text-gray-500 mt-2 max-w-sm">
        Notre petit robot travaille dur pour préparer cette fonctionnalité. Revenez bientôt !
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-semibold hover:bg-[#A7D129] hover:text-[#2D5016] transition-colors"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Chargement…" />}>
      < ComingSoon />
    </Suspense>
  );
}