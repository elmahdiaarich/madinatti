'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { jobsService } from '@/services/jobsService';

const CONTRACT_LABELS = {
  CDI:           { label: 'CDI' },
  CDD:           { label: 'CDD' },
  STAGE:         { label: 'Stage' },
  FREELANCE:     { label: 'Freelance' },
  INTERIM:       { label: 'Intérim' },
  ALTERNANCE:    { label: 'Alternance' },
  ANAPEC:        { label: 'Anapec' },
  TEMPS_PARTIEL: { label: 'Temps partiel' },
  STATUTAIRE:    { label: 'Statutaire' },
};

const EDUCATION_LABELS = {
  BEFORE_BAC:      'Qualification avant Bac',
  BAC:             'Bac',
  BAC_PLUS_1:      'Bac+1',
  BAC_PLUS_2:      'Bac+2',
  BAC_PLUS_3:      'Bac+3',
  BAC_PLUS_4:      'Bac+4',
  BAC_PLUS_5_PLUS: 'Bac+5 et plus',
};

const EXPERIENCE_LABELS = {
  STUDENT_FRESH_GRAD: 'Étudiant, jeune diplômé',
  JUNIOR_LESS_2:      'Débutant < 2 ans',
  MID_2_TO_5:         'Entre 2 et 5 ans',
  SENIOR_5_TO_10:     'Entre 5 et 10 ans',
  EXPERT_PLUS_10:     '> 10 ans',
};

// ─── Logo ─────────────────────────────────────────────────────────────────────
function CompanyLogo({ logo, name }) {
  return (
    <div className="w-[130px] h-[130px] shrink-0 bg-white border border-[#A7D129]/40 rounded-xl flex items-center justify-center overflow-hidden">
      {logo ? (
        <>
          <img
            src={logo}
            alt={name}
            className="w-full h-full object-contain p-3"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div
            className="w-full h-full items-center justify-center text-[#2D5016] font-bold text-3xl bg-[#E8F5D0]"
            style={{ display: 'none' }}
          >
            {name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#2D5016] font-bold text-3xl bg-[#E8F5D0]">
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, valueClass = '' }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-1 text-sm flex-wrap">
      <span className="text-gray-500 shrink-0">{label} :</span>
      <span className={`font-semibold text-gray-800 ${valueClass}`}>{value}</span>
    </div>
  );
}

// ─── Bouton cœur ──────────────────────────────────────────────────────────────
function FavoriteButton({ jobId, initialFavorited = false, onToggle }) {
  const { user, token } = useAuth();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  // ← AJOUTER CE useEffect
  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Visiteur → scroll vers inscription
    if (!user) {
      const el = document.getElementById('inscription');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (loading) return;

    // Handler externe fourni (ex: page favoris) → on délègue
    if (onToggle) {
      onToggle();
      return;
    }

    // Comportement standard : toggle + appel API
    const prev = favorited;
    setFavorited(!prev);
    setLoading(true);
    try {
      await jobsService.toggleFavorite(jobId, token);
    } catch {
      setFavorited(prev); // rollback si erreur
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={favorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`
        shrink-0 w-9 h-9 rounded-full flex items-center justify-center
        transition-all duration-200 hover:scale-110 active:scale-95
 ${favorited
  ? 'bg-[#E8F5D0] text-[#A7D129] hover:bg-[#A7D129]/15'
  : 'bg-white/70 text-gray-300 hover:text-[#A7D129] hover:bg-[#E8F5D0]'
}
        ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5 transition-all duration-200"
        fill={favorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}

// ─── JobCard ──────────────────────────────────────────────────────────────────
export default function JobCard({ job, initialFavorited = false, onFavoriteToggle }) {
  const formatSalary = (min, max) => {
    const hasMin = min != null && Number(min) > 0;
    const hasMax = max != null && Number(max) > 0;
    if (!hasMin && !hasMax) return 'À discuter';
    const fmt = (v) => Number(v).toLocaleString('fr-MA');
    if (hasMin && hasMax) return `${fmt(min)} – ${fmt(max)} MAD/mois`;
    if (hasMin) return `À partir de ${fmt(min)} MAD/mois`;
    return `Jusqu'à ${fmt(max)} MAD/mois`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const contract = CONTRACT_LABELS[job.contractType];
  const skills = Array.isArray(job.skills) ? job.skills.slice(0, 5).join(' - ') : null;

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="relative bg-[#E8F5D0] hover:bg-[#d8edbb] border border-[#A7D129]/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:border-[#A7D129]">

        {/* Bouton cœur — coin supérieur droit */}
        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton
            jobId={job.id}
            initialFavorited={initialFavorited}
            onToggle={onFavoriteToggle}
          />
        </div>

        <div className="flex gap-5">
          {/* Logo */}
          <CompanyLogo logo={job.user?.companyLogo} name={job.companyName} />

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 pr-8">

            {/* Title + company + date */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-[#2D5016] transition-colors line-clamp-2">
                  {job.title}
                </h2>
                <span className="text-xs text-gray-400 shrink-0 mt-1">
                  {formatDate(job.publishedAt)}
                </span>
              </div>
              <span className="text-[#2D5016] font-semibold text-sm mt-0.5 block">
                {job.companyName}
              </span>
            </div>

            {/* Info rows */}
            <div className="flex flex-col gap-1.5">
              <InfoRow label="Niveau d'études requis" value={EDUCATION_LABELS[job.educationLevel]} />
              <InfoRow label="Niveau d'expérience"    value={EXPERIENCE_LABELS[job.experienceLevel]} />
              <InfoRow label="Contrat proposé"         value={contract?.label || job.contractType} />
              <InfoRow label="Région de"               value={job.location} />
              <InfoRow
                label="Salaire"
                value={formatSalary(job.salaryMin, job.salaryMax)}
                valueClass="text-[#2D5016]"
              />
              <InfoRow label="Compétences clés" value={skills} />
            </div>

          </div>
        </div>
      </div>
    </Link>
  );
}
