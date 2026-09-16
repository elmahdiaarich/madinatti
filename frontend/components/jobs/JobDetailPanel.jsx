'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { jobsService } from '@/services/jobsService';
import ApplyModal from '@/components/jobs/ApplyModal';
import ReportModal from '@/components/shared/ReportModal';
import Link from 'next/link';

// ─── Constants ────────────────────────────────────────────────────────────────
const CONTRACT_COLORS = {
  CDI:           'bg-emerald-50 text-emerald-700 border-emerald-200',
  CDD:           'bg-blue-50 text-blue-700 border-blue-200',
  STAGE:         'bg-violet-50 text-violet-700 border-violet-200',
  FREELANCE:     'bg-amber-50 text-amber-700 border-amber-200',
  INTERIM:       'bg-orange-50 text-orange-700 border-orange-200',
  ALTERNANCE:    'bg-cyan-50 text-cyan-700 border-cyan-200',
  ANAPEC:        'bg-teal-50 text-teal-700 border-teal-200',
  TEMPS_PARTIEL: 'bg-pink-50 text-pink-700 border-pink-200',
  STATUTAIRE:    'bg-gray-50 text-gray-700 border-gray-200',
};
const CONTRACT_LABELS = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', FREELANCE: 'Freelance',
  INTERIM: 'Intérim', ALTERNANCE: 'Alternance', ANAPEC: 'Anapec',
  TEMPS_PARTIEL: 'Temps partiel', STATUTAIRE: 'Statutaire',
};
const EDUCATION_LABELS = {
  BEFORE_BAC: 'Avant Bac', BAC: 'Bac',
  BAC_PLUS_1: 'Bac+1', BAC_PLUS_2: 'Bac+2', BAC_PLUS_3: 'Bac+3',
  BAC_PLUS_4: 'Bac+4', BAC_PLUS_5_PLUS: 'Bac+5',
};
const EXPERIENCE_LABELS = {
  STUDENT_FRESH_GRAD: 'Débutant / Jeune diplômé',
  JUNIOR_LESS_2:      'Moins de 2 ans',
  MID_2_TO_5:         '2 – 5 ans',
  SENIOR_5_TO_10:     '5 – 10 ans',
  EXPERT_PLUS_10:     'Plus de 10 ans',
};
const REMOTE_LABELS = {
  ON_SITE: { label: 'Présentiel',  icon: '🏢' },
  REMOTE:  { label: 'Full Remote', icon: '🌍' },
  HYBRID:  { label: 'Hybride',     icon: '🔀' },
};
const LANGUAGE_FLAGS = {
  arabe: '🇲🇦', français: '🇫🇷', anglais: '🇬🇧', espagnol: '🇪🇸',
};
const LANGUAGE_LEVEL_COLORS = {
  maternelle:    'bg-[#2D5016] text-white',
  courant:       'bg-[#A7D129] text-[#2D5016] font-bold',
  'bon niveau':  'bg-[#E8F5D0] text-[#2D5016]',
  intermédiaire: 'bg-amber-50 text-amber-700 border border-amber-200',
  notions:       'bg-gray-100 text-gray-500',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtNum  = (v) => Number(v).toLocaleString('fr-MA');
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
const formatSalary = (min, max) => {
  const hasMin = min != null && Number(min) > 0;
  const hasMax = max != null && Number(max) > 0;
  if (!hasMin && !hasMax) return null;
  if (hasMin && hasMax) return `${fmtNum(min)} – ${fmtNum(max)} MAD/mois`;
  if (hasMin) return `À partir de ${fmtNum(min)} MAD/mois`;
  return `Jusqu'à ${fmtNum(max)} MAD/mois`;
};
const timeSince = (d) => {
  if (!d) return null;
  const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (diff === 0) return { label: "Aujourd'hui", fresh: true };
  if (diff === 1) return { label: 'Hier', fresh: true };
  if (diff < 7)  return { label: `Il y a ${diff} jours`, fresh: false };
  return { label: fmtDate(d), fresh: false };
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function CompanyAvatar({ logo, name, size = 'lg' }) {
  const [imgErr, setImgErr] = useState(false);
  const GRADIENTS = [
    ['#1e3a5f','#2563eb'],['#7f1d1d','#dc2626'],['#14532d','#16a34a'],
    ['#3b0764','#7c3aed'],['#1c1917','#57534e'],['#7c2d12','#ea580c'],
  ];
  const n = ((name?.charCodeAt(0) || 0) + (name?.charCodeAt(1) || 0)) % GRADIENTS.length;
  const [from, to] = GRADIENTS[n];
  const initials = (name || '?').trim().split(/\s+/).slice(0,2).map(w => w[0]).join('').toUpperCase();

  const cls = size === 'lg'
    ? 'w-[72px] h-[72px] rounded-2xl text-2xl'
    : 'w-10 h-10 rounded-xl text-sm';

  return (
    <div
      className={`${cls} shrink-0 flex items-center justify-center overflow-hidden
        font-extrabold text-white shadow-sm border-2 border-white/30`}
      style={{ background: logo && !imgErr ? 'white' : `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {logo && !imgErr ? (
        <img src={logo} alt={name} className="w-full h-full object-contain p-2"
          onError={() => setImgErr(true)} />
      ) : (
        initials
      )}
    </div>
  );
}

function InfoChip({ icon, label, color = 'bg-gray-50 text-gray-600 border-gray-200' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
      text-xs font-semibold border ${color}`}>
      {icon && <span className="text-sm leading-none">{icon}</span>}
      {label}
    </span>
  );
}

function FormattedDescription({ text }) {
  if (!text) return null;
  const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const elements = [];
  let currentList = [];
  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={elements.length} className="mt-1 mb-3 flex flex-col gap-1.5 pl-1">
          {currentList.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-600 text-sm">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#A7D129] shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };
  lines.forEach((line, i) => {
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      currentList.push(bulletMatch[1]);
    } else {
      flushList();
      const isHeading = line.endsWith(':') && line.length < 60;
      if (isHeading) {
        elements.push(
          <p key={i} className="flex items-center gap-2 font-bold text-[#2D5016] mt-5 mb-2 first:mt-0 text-sm">
            <span className="w-1 h-4 rounded-full bg-[#A7D129] shrink-0 inline-block" />
            {line}
          </p>
        );
      } else {
        elements.push(<p key={i} className="mb-2 text-gray-600 text-sm leading-relaxed">{line}</p>);
      }
    }
  });
  flushList();
  return <div>{elements}</div>;
}

// ─── Main JobDetailPanel ───────────────────────────────────────────────────────
/**
 * Props:
 *   jobId          — string | null
 *   onClose        — () => void   (used on mobile bottom-sheet)
 *   favoritedIds   — Set<string>
 *   onFavToggle    — (jobId) => void
 *   isMobileSheet  — boolean
 */
export default function JobDetailPanel({
  jobId,
  onClose,
  favoritedIds = new Set(),
  onFavToggle,
  isMobileSheet = false,
}) {
  const { user, token } = useAuth();
  const [job, setJob]               = useState(null);
  const [loading, setLoading]       = useState(false);
  const [showApply, setShowApply]   = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [fav, setFav]               = useState(false);
  const [favBusy, setFavBusy]       = useState(false);

  useEffect(() => {
    if (!jobId) { setJob(null); return; }
    let cancelled = false;
    setLoading(true);
    setJob(null);
    jobsService.getJobById(jobId)
      .then((res) => { if (!cancelled) setJob(res.data ?? res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [jobId]);

  useEffect(() => {
    setFav(favoritedIds.has(jobId));
  }, [jobId, favoritedIds]);

  const handleFav = async (e) => {
    e.preventDefault();
    if (!user || favBusy) return;
    const prev = fav;
    setFav(!prev);
    setFavBusy(true);
    try {
      await jobsService.toggleFavorite(jobId, token);
      if (onFavToggle) onFavToggle(jobId);
    } catch {
      setFav(prev);
    } finally {
      setFavBusy(false);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading || !job) {
    return (
      <PanelShell isMobileSheet={isMobileSheet} onClose={onClose}>
        {loading ? (
          <div className="animate-pulse p-6 space-y-4">
            {/* Header skeleton */}
            <div className="h-36 rounded-2xl" style={{ background: 'linear-gradient(135deg, #1a2e0a, #2D5016)' }}>
              <div className="p-5 flex gap-3">
                <div className="w-[72px] h-[72px] rounded-2xl bg-white/10" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-white/20 rounded w-3/4" />
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-3 bg-white/10 rounded w-1/3 mt-2" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-7 bg-gray-100 rounded-full w-20" />
              ))}
            </div>
            <div className="space-y-2 pt-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-3 bg-gray-100 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState />
        )}
      </PanelShell>
    );
  }

  const salary     = formatSalary(job.salaryMin, job.salaryMax);
  const contract   = CONTRACT_LABELS[job.contractType];
  const contractColor = CONTRACT_COLORS[job.contractType];
  const experience = EXPERIENCE_LABELS[job.experienceLevel];
  const education  = EDUCATION_LABELS[job.educationLevel];
  const remote     = REMOTE_LABELS[job.remote];
  const dateInfo   = timeSince(job.publishedAt);
  const deadline   = job.applicationDeadline ? fmtDate(job.applicationDeadline) : null;
  const skills     = Array.isArray(job.skills) ? job.skills : [];
  const languages  = Array.isArray(job.languages) ? job.languages : [];
  const appCount   = job._count?.applications ?? 0;
  const isVisitor  = !user;

  const canApply   = user?.role === 'citizen';

  return (
    <PanelShell isMobileSheet={isMobileSheet} onClose={onClose}>

      {/* ── HEADER GRADIENT ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-6 pt-6 pb-5"
        style={{ background: 'linear-gradient(135deg, #1a2e0a 0%, #2D5016 60%, #3d6b1c 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
          style={{ background: '#A7D129', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-10"
          style={{ background: '#A7D129', transform: 'translate(-30%, 30%)' }} />

        {/* Close button (mobile sheet) */}
        {isMobileSheet && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center
              justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Company + title */}
        <div className="flex items-start gap-4 relative">
          <CompanyAvatar logo={job.user?.companyLogo} name={job.companyName} size="lg" />
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-extrabold text-lg leading-snug line-clamp-2">
              {job.title}
            </h2>
            <p className="text-[#A7D129] font-semibold text-sm mt-1 truncate">{job.companyName}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {job.city && (
                <span className="flex items-center gap-1 text-white/60 text-xs">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd" />
                  </svg>
                  {job.city}
                </span>
              )}
              {dateInfo && (
                <span className={`text-xs font-semibold ${dateInfo.fresh ? 'text-[#A7D129]' : 'text-white/50'}`}>
                  · {dateInfo.label}
                </span>
              )}
              {job.isFeatured && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                  text-[10px] font-bold bg-[#A7D129]/20 border border-[#A7D129]/40 text-[#A7D129]">
                  ⭐ Premium
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 mt-5 relative">
          {/* Apply CTA */}
          {canApply ? (
            <button
              onClick={() => setShowApply(true)}
              className="flex-1 py-2.5 rounded-xl bg-[#A7D129] text-[#1a2e0a] font-extrabold text-sm
                hover:bg-[#bfe03a] active:scale-95 transition-all duration-150 shadow-lg
                shadow-[#A7D129]/30 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Postuler maintenant
            </button>
          ) : isVisitor ? (
            <a
              href="#inscription"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('inscription');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="flex-1 py-2.5 rounded-xl bg-[#A7D129] text-[#1a2e0a] font-extrabold text-sm
                hover:bg-[#bfe03a] transition-all duration-150 shadow-lg shadow-[#A7D129]/30
                text-center"
            >
              Postuler maintenant
            </a>
          ) : null}

          {/* Favorite */}
          {user && user.role !== 'admin' && (
            <button
              onClick={handleFav}
              disabled={favBusy}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-200
                ${fav
                  ? 'bg-red-500/20 border-red-400/60 text-red-400'
                  : 'bg-white/10 border-white/30 text-white/60 hover:bg-red-500/20 hover:border-red-400/60 hover:text-red-400'
                } ${favBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={fav ? 'Retirer des favoris' : 'Sauvegarder'}
            >
              <svg className="w-4 h-4" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>
          )}

          {/* Full page link */}
          <Link
            href={`/jobs/${job.id}`}
            target="_blank"
            className="w-10 h-10 rounded-xl flex items-center justify-center border-2
              bg-white/10 border-white/30 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
            title="Ouvrir la page complète"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>

        {/* Applications count */}
        {appCount > 0 && (
          <p className="relative text-white/40 text-xs mt-3">
            {appCount} candidature{appCount > 1 ? 's' : ''} déjà envoyée{appCount > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* ── SCROLLABLE BODY ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="px-5 py-5 space-y-6">

          {/* Key info chips */}
          <div className="flex flex-wrap gap-2">
            {contract && (
              <InfoChip label={contract} color={contractColor} />
            )}
            {experience && (
              <InfoChip icon="💼" label={experience} color="bg-gray-50 text-gray-700 border-gray-200" />
            )}
            {education && (
              <InfoChip icon="🎓" label={education} color="bg-gray-50 text-gray-700 border-gray-200" />
            )}
            {remote && (
              <InfoChip icon={remote.icon} label={remote.label} color="bg-gray-50 text-gray-700 border-gray-200" />
            )}
          </div>

          {/* Salary */}
          {salary && (
            <div className="flex items-center gap-3 py-3 px-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Rémunération</p>
                <p className="font-extrabold text-emerald-800 text-base">{salary}</p>
              </div>
            </div>
          )}

          {/* Quick criteria */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Contrat', value: contract },
              { label: 'Expérience', value: experience },
              { label: 'Formation', value: education },
              { label: 'Modalité', value: remote?.label },
              { label: 'Ville', value: job.city },
              { label: 'Région', value: job.region },
              { label: 'Date limite', value: deadline },
              { label: 'Secteur', value: job.category?.name },
            ].filter(c => c.value).map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5 leading-snug">{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {job.description && (
            <div>
              <SectionTitle title="Description du poste" />
              <div className="mt-3">
                <FormattedDescription text={job.description} />
              </div>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <SectionTitle title="Compétences requises" />
              <div className="flex flex-wrap gap-2 mt-3">
                {skills.map((skill, i) => (
                  <span key={i}
                    className="px-3 py-1 bg-[#E8F5D0] text-[#2D5016] text-xs font-semibold
                      rounded-full border border-[#A7D129]/30">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <div>
              <SectionTitle title="Langues requises" />
              <div className="mt-3 space-y-2">
                {languages.map((lang, i) => {
                  const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
                  const levelColor = LANGUAGE_LEVEL_COLORS[lang.level] || 'bg-gray-100 text-gray-500';
                  return (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{LANGUAGE_FLAGS[lang.language] || '🌐'}</span>
                        <span className="text-sm font-semibold text-gray-800">{cap(lang.language)}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${levelColor}`}>
                        {cap(lang.level)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contact info */}
          {(job.contactEmail || job.contactPhone || job.applicationUrl) && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Contact</p>
              {job.contactEmail && (
                <a href={`mailto:${job.contactEmail}`}
                  className="flex items-center gap-2 text-sm text-[#2D5016] hover:underline font-medium">
                  <svg className="w-4 h-4 text-[#A7D129]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {job.contactEmail}
                </a>
              )}
              {job.contactPhone && (
                <a href={`tel:${job.contactPhone}`}
                  className="flex items-center gap-2 text-sm text-[#2D5016] hover:underline font-medium">
                  <svg className="w-4 h-4 text-[#A7D129]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {job.contactPhone}
                </a>
              )}
              {job.applicationUrl && (
                <a href={job.applicationUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Postuler en ligne
                </a>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <Link
              href={`/jobs/${job.id}`}
              target="_blank"
              className="text-xs text-[#2D5016] hover:text-[#A7D129] font-semibold
                underline underline-offset-2 transition-colors"
            >
              Voir la page complète →
            </Link>
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1 text-[10px] text-gray-300
                hover:text-red-400 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              Signaler
            </button>
          </div>

          {/* Bottom spacing for mobile */}
          <div className="h-4" />
        </div>
      </div>

      {/* ── MODALS ───────────────────────────────────────────────────────────── */}
      {showApply && (
        <ApplyModal job={job} onClose={() => setShowApply(false)} />
      )}
      {showReport && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          targetType="JOB"
          targetId={job.id}
          targetTitle={job.title}
        />
      )}
    </PanelShell>
  );
}

// ─── PanelShell ───────────────────────────────────────────────────────────────
function PanelShell({ children, isMobileSheet, onClose }) {
  if (isMobileSheet) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Drag handle */}
        <div className="shrink-0 pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        {children}
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      {children}
    </div>
  );
}

// ─── SectionTitle ─────────────────────────────────────────────────────────────
function SectionTitle({ title }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-1 h-5 rounded-full bg-[#A7D129] shrink-0 inline-block" />
      <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide">{title}</h3>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
const TIPS = [
  { icon: '🎯', text: 'Filtrez par ville ou région dans la barre de recherche' },
  { icon: '🔔', text: 'Créez une alerte pour être notifié des nouvelles offres' },
  { icon: '💾', text: 'Sauvegardez vos offres favorites pour y revenir plus tard' },
];

function EmptyState() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top gradient block */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-center py-10 px-6"
        style={{ background: 'linear-gradient(160deg, #1a2e0a 0%, #2D5016 55%, #3d6b1c 100%)', minHeight: '200px' }}
      >
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #A7D129 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        {/* Animated icon */}
        <div className="relative w-20 h-20 mb-4">
          <div className="absolute inset-0 rounded-3xl bg-[#A7D129]/20 animate-ping"
            style={{ animationDuration: '3s' }} />
          <div className="relative w-20 h-20 rounded-3xl bg-[#A7D129]/20 border-2 border-[#A7D129]/40
            flex items-center justify-center">
            <svg className="w-10 h-10 text-[#A7D129]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h3 className="text-white font-extrabold text-lg relative">Détails de l'offre</h3>
        <p className="text-white/50 text-sm mt-1 relative text-center max-w-[220px] leading-relaxed">
          Cliquez sur une offre dans la liste pour voir tous les détails ici
        </p>

        {/* Arrow pointing left */}
        <div className="flex items-center gap-2 mt-4 relative">
          <svg className="w-5 h-5 text-[#A7D129] animate-bounce-x" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ animation: 'bounceLeft 1.5s ease-in-out infinite' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[#A7D129] text-xs font-semibold">Choisir une offre</span>
        </div>
      </div>

      {/* Tips block */}
      <div className="flex-1 px-5 py-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
          Astuces
        </p>
        {TIPS.map((tip, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-lg shrink-0 mt-0.5">{tip.icon}</span>
            <p className="text-sm text-gray-600 leading-snug">{tip.text}</p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes bounceLeft {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-5px); }
        }
      `}</style>
    </div>
  );
}
