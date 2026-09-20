"use client";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="h-screen w-full flex bg-white relative overflow-hidden">
      <Link
        href="/"
        className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20 inline-flex items-center"
      >
        <Image
          src="/logo-new.svg"
          alt="Madinatti"
          width={130}
          height={46}
          priority
          className="h-8 w-auto"
        />
      </Link>

      {/* Scrollable form column */}
      <div className="auth-scroll flex-1 overflow-y-auto px-6 sm:px-10">
        <div className="min-h-full flex">
          <div className="w-full max-w-[380px] m-auto py-8 pt-20">
            <h1 className="text-[26px] leading-tight font-bold text-gray-900 mb-1.5">
              {title}
            </h1>
            {subtitle && <p className="text-sm text-gray-500 mb-7">{subtitle}</p>}
            {!subtitle && <div className="mb-3" />}
            {children}
          </div>
        </div>
      </div>

      {/* Right panel — Moroccan geometric motif, fixed, never scrolls */}
      <div className="hidden lg:flex lg:w-[46%] h-screen relative overflow-hidden shrink-0 bg-[var(--color-primary-dark)] items-center justify-center">
        <MoroccanPanel />
      </div>

      <style jsx global>{`
        .auth-scroll {
          scrollbar-width: thin;
          scrollbar-color: #d9d9d9 transparent;
        }
        .auth-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .auth-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .auth-scroll::-webkit-scrollbar-thumb {
          background-color: #d9d9d9;
          border-radius: 999px;
        }
        .auth-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #c2c2c2;
        }
      `}</style>
    </div>
  );
}

function MoroccanPanel() {
  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Top frieze band — repeating diamond lattice, classic zellige border */}
      <svg className="w-full h-10 flex-shrink-0" viewBox="0 0 400 40" preserveAspectRatio="none">
        <rect width="400" height="40" fill="var(--color-primary-sage)" opacity="0.18" />
        {Array.from({ length: 21 }).map((_, i) => (
          <path
            key={i}
            d={`M${i * 20} 20 L${i * 20 + 10} 4 L${i * 20 + 20} 20 L${i * 20 + 10} 36 Z`}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}
      </svg>

      {/* Full-bleed zellige star field */}
      <div className="absolute inset-0">
        <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="zellige" width="64" height="64" patternUnits="userSpaceOnUse">
              <g transform="translate(32,32)" opacity="0.10">
                <rect x="-16" y="-16" width="32" height="32" fill="none" stroke="var(--color-primary-mint)" strokeWidth="1" />
                <rect x="-16" y="-16" width="32" height="32" fill="none" stroke="var(--color-primary-mint)" strokeWidth="1" transform="rotate(45)" />
              </g>
              <g transform="translate(0,0)" opacity="0.06">
                <rect x="-8" y="-8" width="16" height="16" fill="none" stroke="var(--color-primary)" strokeWidth="1" transform="rotate(45)" />
              </g>
              <g transform="translate(64,0)" opacity="0.06">
                <rect x="-8" y="-8" width="16" height="16" fill="none" stroke="var(--color-primary)" strokeWidth="1" transform="rotate(45)" />
              </g>
              <g transform="translate(0,64)" opacity="0.06">
                <rect x="-8" y="-8" width="16" height="16" fill="none" stroke="var(--color-primary)" strokeWidth="1" transform="rotate(45)" />
              </g>
              <g transform="translate(64,64)" opacity="0.06">
                <rect x="-8" y="-8" width="16" height="16" fill="none" stroke="var(--color-primary)" strokeWidth="1" transform="rotate(45)" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#zellige)" />
        </svg>
      </div>

      {/* Central horseshoe arch, drawn as a light outline framing the copy */}
      <div className="relative flex-1 flex items-center justify-center px-12">
        <svg width="100%" viewBox="0 0 320 420" className="max-w-[320px]">
          <path
            d="M40 420 V210 A120 120 0 0 1 280 210 V420"
            fill="none"
            stroke="var(--color-primary-mint)"
            strokeWidth="1.5"
            opacity="0.55"
          />
          <path
            d="M64 420 V206 A96 96 0 0 1 256 206 V420"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="1"
            opacity="0.35"
          />
          <circle cx="160" cy="112" r="4" fill="var(--color-primary)" opacity="0.7" />
        </svg>
      </div>

      {/* Copy */}
      <div className="relative px-12 pb-14 pt-2">
        <span className="inline-block h-[2px] w-10 mb-4" style={{ background: "var(--color-primary)" }} />
        <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--color-primary-mint)" }}>
          Tout ce dont vous avez besoin, où que vous soyez au Maroc.
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-primary-mint)", opacity: 0.75 }}>
          Un logement, un emploi, une voiture, une sortie — trouvez-le près
          de chez vous, de Tanger à Agadir.
        </p>
      </div>

      {/* Bottom frieze band, mirrored */}
      <svg className="w-full h-10 flex-shrink-0" viewBox="0 0 400 40" preserveAspectRatio="none">
        <rect width="400" height="40" fill="var(--color-primary-sage)" opacity="0.18" />
        {Array.from({ length: 21 }).map((_, i) => (
          <path
            key={i}
            d={`M${i * 20} 20 L${i * 20 + 10} 4 L${i * 20 + 20} 20 L${i * 20 + 10} 36 Z`}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="1"
            opacity="0.5"
          />
        ))}
      </svg>
    </div>
  );
}