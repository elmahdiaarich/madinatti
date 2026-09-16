'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { jobsService } from '@/services/jobsService';
import ReportModal from '@/components/shared/ReportModal';
import ShareMenu from '@/components/shared/ShareMenu';

// ─── Constants ────────────────────────────────────────────────────────────────

const CONTRACT_LABELS = {
  CDI:           { label: 'CDI',           color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CDD:           { label: 'CDD',           color: 'bg-blue-50   text-blue-700   border-blue-200'   },
  STAGE:         { label: 'Stage',         color: 'bg-violet-50 text-violet-700 border-violet-200' },
  FREELANCE:     { label: 'Freelance',     color: 'bg-amber-50  text-amber-700  border-amber-200'  },
  INTERIM:       { label: 'Intérim',       color: 'bg-orange-50 text-orange-700 border-orange-200' },
  ALTERNANCE:    { label: 'Alternance',    color: 'bg-cyan-50   text-cyan-700   border-cyan-200'   },
  ANAPEC:        { label: 'Anapec',        color: 'bg-teal-50   text-teal-700   border-teal-200'   },
  TEMPS_PARTIEL: { label: 'Temps partiel', color: 'bg-pink-50   text-pink-700   border-pink-200'   },
  STATUTAIRE:    { label: 'Statutaire',    color: 'bg-gray-50   text-gray-700   border-gray-200'   },
};

// Short, immediately readable experience labels
const EXPERIENCE_LABELS = {
  STUDENT_FRESH_GRAD: 'Débutant',
  JUNIOR_LESS_2:      '< 2 ans exp.',
  MID_2_TO_5:         '2 – 5 ans exp.',
  SENIOR_5_TO_10:     '5 – 10 ans exp.',
  EXPERT_PLUS_10:     '+ 10 ans exp.',
};

// Education level — shown on card so users know immediately if they qualify
const EDUCATION_LABELS = {
  BEFORE_BAC:      'Avant Bac',
  BAC:             'Bac',
  BAC_PLUS_1:      'Bac+1',
  BAC_PLUS_2:      'Bac+2',
  BAC_PLUS_3:      'Bac+3',
  BAC_PLUS_4:      'Bac+4',
  BAC_PLUS_5_PLUS: 'Bac+5',
};

// Gradient palette for company avatars (deterministic, based on name)
const GRADIENTS = [
  ['#1e3a5f', '#2563eb'],
  ['#7f1d1d', '#dc2626'],
  ['#14532d', '#16a34a'],
  ['#3b0764', '#7c3aed'],
  ['#1c1917', '#57534e'],
  ['#7c2d12', '#ea580c'],
  ['#0f172a', '#334155'],
  ['#500724', '#be185d'],
];

function getGradient(name = '') {
  const n = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return GRADIENTS[n % GRADIENTS.length];
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// ─── CompanyAvatar ────────────────────────────────────────────────────────────
function CompanyAvatar({ logo, name }) {
  const [from, to] = getGradient(name);
  const initials   = getInitials(name);

  return (
    <div
      className="w-12 h-12 shrink-0 rounded-xl overflow-hidden flex items-center justify-center
        font-bold text-[13px] tracking-wide text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {logo ? (
        <img
          src={logo} alt={name}
          className="w-full h-full object-contain bg-white p-1"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement.querySelector('span').style.display = 'flex';
          }}
        />
      ) : null}
      <span className={logo ? 'hidden' : 'flex items-center justify-center w-full h-full'}>
        {initials}
      </span>
    </div>
  );
}

// ─── FavoriteButton ───────────────────────────────────────────────────────────
function FavoriteButton({ jobId, initialFavorited = false, onToggle }) {
  const { user, token } = useAuth();
  const [fav, setFav]   = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setFav(initialFavorited); }, [initialFavorited]);
  if (!user || user.role === 'admin') return null;

  const toggle = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (busy) return;
    if (onToggle) { onToggle(); return; }
    const prev = fav; setFav(!prev); setBusy(true);
    try   { await jobsService.toggleFavorite(jobId, token); }
    catch { setFav(prev); }
    finally { setBusy(false); }
  };

  return (
    <button onClick={toggle}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 hover:scale-110
        ${fav ? 'text-red-500 bg-red-50' : 'text-gray-300 hover:text-red-400 hover:bg-red-50'}
        ${busy ? 'opacity-50' : ''}`}
      title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    </button>
  );
}

// ─── ShareButton ──────────────────────────────────────────────────────────────
function ShareButton({ job }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(p => !p); }}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-50 transition-all duration-150">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
      {open && <ShareMenu type="job" id={job.id} title={job.title} onClose={() => setOpen(false)} />}
    </div>
  );
}

// ─── Salary helper ────────────────────────────────────────────────────────────
function formatSalary(min, max) {
  const hasMin = min != null && Number(min) > 0;
  const hasMax = max != null && Number(max) > 0;
  if (!hasMin && !hasMax) return null;
  const fmt = (v) => Number(v).toLocaleString('fr-MA');
  if (hasMin && hasMax) return `${fmt(min)} – ${fmt(max)} MAD/mois`;
  if (hasMin)           return `À partir de ${fmt(min)} MAD/mois`;
  return                       `Jusqu'à ${fmt(max)} MAD/mois`;
}

// ─── Date helper ─────────────────────────────────────────────────────────────
function formatDate(date) {
  if (!date) return null;
  const d    = new Date(date);
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff === 0) return { label: "Aujourd'hui",  fresh: true };
  if (diff === 1) return { label: 'Hier',          fresh: true };
  if (diff <  7)  return { label: `Il y a ${diff} jours`, fresh: false };
  return { label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }), fresh: false };
}

// ─── JobCard ──────────────────────────────────────────────────────────────────
/**
 * Props:
 *   job              — job object
 *   initialFavorited — boolean
 *   onFavoriteToggle — callback
 *   showShare        — boolean
 *   onClick          — (job) => void  ← when provided, disables Link navigation
 *   isActive         — boolean        ← shows selected highlight
 */
export default function JobCard({
  job,
  initialFavorited = false,
  onFavoriteToggle,
  showShare = false,
  onClick,
  isActive = false,
}) {
  const [reportOpen, setReportOpen] = useState(false);

  const salary     = formatSalary(job.salaryMin, job.salaryMax);
  const dateInfo   = formatDate(job.publishedAt);
  const contract   = CONTRACT_LABELS[job.contractType];
  const experience = EXPERIENCE_LABELS[job.experienceLevel];
  const education  = EDUCATION_LABELS[job.educationLevel];

  // ── Card inner content (shared between Link and button modes) ───────────────
  const cardContent = (
    <div
      className={`bg-white border rounded-2xl overflow-hidden
        transition-all duration-200 ease-out
        ${isActive
          ? 'border-[#2D5016] shadow-lg shadow-[#2D5016]/10 ring-1 ring-[#2D5016]/20'
          : 'border-gray-200 hover:border-[#A7D129] hover:shadow-lg hover:shadow-[#A7D129]/10 hover:-translate-y-px'
        }`}
    >
      {/* Top accent bar */}
      <div className={`h-[3px] bg-gradient-to-r from-[#A7D129] via-[#2D5016] to-[#A7D129]
        transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />

      <div className="px-5 py-4">

        {/* ── SECTION 1: Identity ─────────────────────────────────────────── */}
        <div className="flex items-start gap-3.5">

          <CompanyAvatar logo={job.user?.companyLogo} name={job.companyName} />

          <div className="flex-1 min-w-0 pr-2">
            {/* Row: title + premium + date */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h2 className={`font-bold text-[15px] leading-snug
                  transition-colors duration-200 line-clamp-1
                  ${isActive ? 'text-[#2D5016]' : 'text-gray-900 group-hover:text-[#2D5016]'}`}>
                  {job.title}
                </h2>
                {job.isFeatured && (
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#A7D129] text-[#7BA428] bg-[#E8F5D0]">
                    ⭐ Premium
                  </span>
                )}
              </div>
              {/* Date — right aligned */}
              {dateInfo && (
                <span className={`text-[11px] shrink-0 font-semibold whitespace-nowrap mt-0.5
                  ${dateInfo.fresh ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {dateInfo.label}
                </span>
              )}
            </div>

            {/* Company + City */}
            <p className="text-[13px] text-gray-500 mt-0.5 flex items-center gap-1 flex-wrap">
              <span className="font-medium text-gray-600 truncate max-w-[160px]">{job.companyName}</span>
              {job.city && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-0.5">
                    <svg className="w-3 h-3 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {job.city}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Favorite + Share — appear on hover / always visible when active */}
          <div className={`flex items-center gap-0.5 shrink-0
            transition-opacity duration-200 -mt-0.5
            ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            <FavoriteButton jobId={job.id} initialFavorited={initialFavorited} onToggle={onFavoriteToggle} />
            {showShare && <ShareButton job={job} />}
          </div>
        </div>

        {/* ── SECTION 2: Key attributes ──────────────────────────────────── */}
        {(contract || experience || education) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">

            {/* Contract type — colored pill */}
            {contract && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                text-[11px] font-bold border ${contract.color}`}>
                {contract.label}
              </span>
            )}

            {/* Education level */}
            {education && (
              <span className="inline-flex items-center gap-1 text-[12px] text-gray-500 font-medium">
                <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0v5m-4 2h8" />
                </svg>
                {education}
              </span>
            )}

            {(contract || education) && experience && (
              <span className="text-gray-200 text-xs">·</span>
            )}

            {/* Experience required */}
            {experience && (
              <span className="inline-flex items-center gap-1 text-[12px] text-gray-500 font-medium">
                <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {experience}
              </span>
            )}
          </div>
        )}

        {/* ── SECTION 3: Salary + CTA ────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-gray-50">
          {salary ? (
            <p className="font-bold text-[#1a7a3a] text-[13px]">{salary}</p>
          ) : (
            <p className="text-[12px] text-gray-400 italic font-medium">Salaire non précisé</p>
          )}

          <span className={`flex items-center gap-1.5 text-[12px] font-semibold shrink-0
            transition-colors duration-200
            ${isActive ? 'text-[#2D5016]' : 'text-gray-400 group-hover:text-[#2D5016]'}`}>
            {onClick ? 'Voir le détail' : 'Voir le détail'}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={`relative group ${isActive ? 'z-10' : ''}`}>

        {/* ── Click mode (split-panel) vs Link mode (full page) ──────────── */}
        {onClick ? (
          <button
            type="button"
            className="block w-full text-left"
            onClick={() => onClick(job)}
          >
            {cardContent}
          </button>
        ) : (
          <Link href={`/jobs/${job.id}`} className="block">
            {cardContent}
          </Link>
        )}

        {/* Report — ultra-discreet, hover only */}
        <div className="flex justify-end mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button onClick={() => setReportOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors">
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
            Signaler
          </button>
        </div>
      </div>

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="JOB"
        targetId={job.id}
        targetTitle={job.title}
      />
    </>
  );
}
