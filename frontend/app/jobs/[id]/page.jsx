'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { jobsService } from '@/services/jobsService';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { cities } from 'morocco-cities';
import InlineRegisterSection from '@/components/jobs/InlineRegisterSection';
import MapFrame from '@/components/shared/MapFrame';
import ApplyModal from '@/components/jobs/ApplyModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ReportModal from '@/components/shared/ReportModal';

const CONTRACT_LABELS = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', FREELANCE: 'Freelance',
  INTERIM: 'Intérim', ALTERNANCE: 'Alternance', ANAPEC: 'Anapec',
  TEMPS_PARTIEL: 'Temps partiel', STATUTAIRE: 'Statutaire',
};
const EDUCATION_LABELS = {
  BEFORE_BAC: 'Qualification avant Bac', BAC: 'Bac',
  BAC_PLUS_1: 'Bac+1', BAC_PLUS_2: 'Bac+2', BAC_PLUS_3: 'Bac+3',
  BAC_PLUS_4: 'Bac+4', BAC_PLUS_5_PLUS: 'Bac+5 et plus',
};
const EXPERIENCE_LABELS = {
  STUDENT_FRESH_GRAD: 'Étudiant, jeune diplômé',
  JUNIOR_LESS_2: 'Débutant < 2 ans',
  MID_2_TO_5: 'Expérience entre 2 et 5 ans',
  SENIOR_5_TO_10: 'Expérience entre 5 et 10 ans',
  EXPERT_PLUS_10: 'Expérience > 10 ans',
};
const REMOTE_LABELS = {
  ON_SITE: { label: 'Présentiel',  icon: '🏢', color: 'bg-gray-100 text-gray-700' },
  REMOTE:  { label: 'Full Remote', icon: '🌍', color: 'bg-blue-50 text-blue-700'  },
  HYBRID:  { label: 'Hybride',     icon: '🔀', color: 'bg-purple-50 text-purple-700' },
};
const REMOTE_HERO = {
  ON_SITE: { label: 'Présentiel',  bg: 'bg-white/15' },
  REMOTE:  { label: 'Full Remote', bg: 'bg-blue-400/80' },
  HYBRID:  { label: 'Hybride',     bg: 'bg-purple-400/80' },
};
const LANGUAGE_LEVEL_COLORS = {
  'maternelle':    'bg-[#2D5016] text-white',
  'courant':       'bg-[#A7D129] text-[#2D5016]',
  'bon niveau':    'bg-[#E8F5D0] text-[#2D5016]',
  'intermédiaire': 'bg-amber-50 text-amber-700 border border-amber-200',
  'notions':       'bg-gray-100 text-gray-600',
};

const fmtNum = (v) => Number(v).toLocaleString('fr-MA');
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
const formatSalary = (min, max) => {
  const hasMin = min != null && Number(min) > 0;
  const hasMax = max != null && Number(max) > 0;
  if (!hasMin && !hasMax) return 'À discuter';
  if (hasMin && hasMax) return `${fmtNum(min)} - ${fmtNum(max)} MAD/mois`;
  if (hasMin) return `À partir de ${fmtNum(min)} MAD/mois`;
  return `Jusqu'à ${fmtNum(max)} MAD/mois`;
};

const scrollToInscription = () => {
  const el = document.getElementById('inscription');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const citiesByRegion = cities.reduce((acc, city) => {
  if (!acc[city.region_name]) acc[city.region_name] = [];
  acc[city.region_name].push(city.name);
  return acc;
}, {});

// ─── Bouton cœur ──────────────────────────────────────────────────────────────
function HeartButton({ isFavorited, loading, onClick, variant = 'hero' }) {
  if (variant === 'hero') {
    return (
      <button
        onClick={onClick}
        title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className={`
          w-11 h-11 rounded-full flex items-center justify-center border-2
          transition-all duration-200 hover:scale-110 active:scale-95
          ${isFavorited
  ? 'bg-[#A7D129]/20 border-[#A7D129]/60 text-[#A7D129]'
  : 'bg-white/10 border-white/40 text-white hover:bg-[#A7D129]/20 hover:border-[#A7D129]/60 hover:text-[#A7D129]'
}
          ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5"
          fill={isFavorited ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      </button>
    );
  }

  // variant === 'inline' (bouton dans la page, fond clair)
  return (
    <button
      onClick={onClick}
      title={isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      className={`
        w-10 h-10 rounded-full flex items-center justify-center border-2
        transition-all duration-200 hover:scale-110 active:scale-95
        ${isFavorited
          ? 'bg-red-50 border-red-300 text-red-500'
          : 'bg-white border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
        }
        ${loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4"
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}

function CompanyLogo({ logo, name, size = 'lg' }) {
  const [imgErr, setImgErr] = useState(false);
  const dim = size === 'lg' ? 'w-[90px] h-[90px]' : 'w-10 h-10';
  const txt = size === 'lg' ? 'text-3xl' : 'text-base';
  const showImg = logo && !imgErr;
  return (
    <div className={`${dim} shrink-0 bg-white border-2 border-[#A7D129]/50 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm`}>
      {showImg ? (
        <img src={logo} alt={name} className="w-full h-full object-contain p-2" onError={() => setImgErr(true)} />
      ) : (
        <div className={`w-full h-full flex items-center justify-center text-[#2D5016] font-extrabold ${txt} bg-[#E8F5D0]`}>
          {name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}

function CriteriaRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-1 py-2 border-b border-gray-50 last:border-0 text-sm flex-wrap">
      <span className="text-gray-400">{`» ${label} :`}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
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
            <li key={i} className="flex items-start gap-2">
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
        elements.push(<p key={i} className="font-bold text-[#2D5016] mt-4 mb-1 first:mt-0">{line}</p>);
      } else {
        elements.push(<p key={i} className="mb-2 text-gray-700">{line}</p>);
      }
    }
  });
  flushList();
  return <div>{elements}</div>;
}

function RelatedJobCard({ job }) {
  const fmtD = (d) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-[#A7D129] hover:shadow-sm transition-all duration-150">
        <CompanyLogo logo={job.user?.companyLogo} name={job.companyName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-800 leading-tight line-clamp-2 group-hover:text-[#2D5016] transition-colors">
            {job.title}
          </p>
          <p className="text-xs text-[#7BA428] font-semibold mt-0.5 truncate">{job.companyName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{job.location} · {fmtD(job.publishedAt)}</p>
        </div>
      </div>
    </Link>
  );
}

function FloatingButtons({ isVisitor, userRole }) {
  const showPublish = isVisitor || userRole === 'citizen';
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {showPublish && (
        isVisitor ? (
          <button
            onClick={scrollToInscription}
            className="flex items-center gap-3 px-5 py-3 rounded-full shadow-xl bg-[#2D5016] text-white font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition-all duration-300 hover:scale-105 active:scale-100 group"
          >
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#A7D129] group-hover:bg-[#2D5016] transition-colors duration-300">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </span>
            <span className="whitespace-nowrap">Publier une annonce</span>
            <span className="text-[#A7D129] group-hover:text-[#2D5016] text-sm leading-none transition-colors">✦</span>
          </button>
        ) : (
          <Link
            href="/jobs/publier"
            className="flex items-center gap-3 px-5 py-3 rounded-full shadow-xl bg-[#2D5016] text-white font-bold text-sm hover:bg-[#A7D129] hover:text-[#2D5016] transition-all duration-300 hover:scale-105 active:scale-100 group"
          >
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#A7D129] group-hover:bg-[#2D5016] transition-colors duration-300">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </span>
            <span className="whitespace-nowrap">Publier une annonce</span>
            <span className="text-[#A7D129] group-hover:text-[#2D5016] text-sm leading-none transition-colors">✦</span>
          </Link>
        )
      )}
      <Link
        href="/contact"
        className="flex items-center gap-3 px-5 py-3 rounded-full shadow-xl bg-[#A7D129] text-[#2D5016] font-bold text-sm hover:bg-[#2D5016] hover:text-white transition-all duration-300 hover:scale-105 active:scale-100 group"
      >
        <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#2D5016] group-hover:bg-[#A7D129] transition-colors duration-300">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white group-hover:fill-[#2D5016] transition-colors">
            <path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2z" />
          </svg>
        </span>
        <span className="whitespace-nowrap">Contactez-nous</span>
      </Link>
    </div>
  );
}

function LanguagesSection({ languages }) {
  if (!languages || !Array.isArray(languages) || languages.length === 0) return null;
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
        <h2 className="font-bold text-gray-900 text-base">Langues requises</h2>
      </div>
      <div className="px-6 py-5 flex flex-col gap-3">
        {languages.map((lang, i) => {
          const levelColor = LANGUAGE_LEVEL_COLORS[lang.level] || 'bg-gray-100 text-gray-600';
          return (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {lang.language === 'arabe'    ? '🇲🇦' :
                   lang.language === 'français' ? '🇫🇷' :
                   lang.language === 'anglais'  ? '🇬🇧' :
                   lang.language === 'espagnol' ? '🇪🇸' : '🌐'}
                </span>
                <span className="text-sm font-semibold text-gray-800">{capitalize(lang.language)}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColor}`}>
                {capitalize(lang.level)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function JobDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [job, setJob] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // ── Favori state ────────────────────────────────────────────────────────────
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await jobsService.getJobById(id);
        const jobData = res.data ?? res;
        setJob(jobData);

        // Charger les offres similaires
        if (jobData.category?.slug) {
          try {
            const rel = await jobsService.getJobs({ categorySlug: jobData.category.slug, limit: 4, page: 1 });
            setRelated((rel.data ?? []).filter((j) => j.id !== id));
          } catch (_) {}
        }

        // Vérifier si déjà en favori (uniquement si connecté)
        if (user && token) {
          try {
            const favRes = await jobsService.getMyFavorites(token);
            const favIds = (favRes.data ?? []).map((j) => j.id);
            setIsFavorited(favIds.includes(id));
          } catch (_) {}
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, token]);

  // ── Handler toggle favori ───────────────────────────────────────────────────
  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      scrollToInscription();
      return;
    }

    if (favLoading) return;

    const prev = isFavorited;
    setIsFavorited(!prev);
    setFavLoading(true);

    try {
      await jobsService.toggleFavorite(id, token);
    } catch {
      setIsFavorited(prev); // rollback
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Chargement de l'offre..." />;

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <span className="text-6xl">🔍</span>
        <h1 className="text-2xl font-bold text-gray-800">Offre introuvable</h1>
        <p className="text-gray-500 text-sm">Cette offre n'existe plus ou a été supprimée.</p>
        <Link href="/jobs" className="mt-2 px-6 py-2.5 bg-[#2D5016] text-white rounded-full text-sm font-semibold hover:bg-[#A7D129] hover:text-[#2D5016] transition-colors">
          Voir toutes les offres
        </Link>
      </div>
    );
  }

  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const skills = Array.isArray(job.skills) ? job.skills : [];
  const languages = Array.isArray(job.languages) ? job.languages : [];
  const deadline = job.applicationDeadline ? fmtDate(job.applicationDeadline) : null;
  const contract = CONTRACT_LABELS[job.contractType] || job.contractType;
  const remote = REMOTE_LABELS[job.remote];
  const remoteHero = REMOTE_HERO[job.remote];
  const appCount = job._count?.applications ?? 0;
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(job.title);

  const isVisitor = !user;
  const userRole = user?.role;
  const canApply = isVisitor || userRole === 'citizen'; // business/admin can't apply

  const handlePostuler = () => {
    if (isVisitor) {
      scrollToInscription();
    } else if (userRole === 'citizen') {
      setShowApplyModal(true);
    }
  };

  const handleApplySubmit = async ({ cvFile, coverLetter }) => {
    const formData = new FormData();
    formData.append('cv', cvFile);
    formData.append('coverLetter', coverLetter);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${id}/apply`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Erreur lors de la candidature');
    return json;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showApplyModal && (
        <ApplyModal
          job={job}
          onClose={() => setShowApplyModal(false)}
          onSubmit={handleApplySubmit}
        />
      )}

      {/* Breadcrumb & Header Actions */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
            <Link href="/" className="hover:text-[#2D5016] transition-colors shrink-0">Accueil</Link>
            <span className="text-gray-300 shrink-0">/</span>
            <Link href="/jobs" className="hover:text-[#2D5016] transition-colors shrink-0">{"Offres d'emploi"}</Link>
            <span className="text-gray-300 shrink-0">/</span>
            <span className="text-gray-800 font-medium truncate">{job.title}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2">
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#0A66C2] hover:scale-110 transition-all duration-150 shadow-sm" title="Partager sur LinkedIn">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#1877F2] hover:scale-110 transition-all duration-150 shadow-sm" title="Partager sur Facebook">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href={`https://wa.me/?text=${encodeURIComponent(job.title + ' ' + pageUrl)}`} target="_blank" rel="noopener noreferrer"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-[#25D366] hover:scale-110 transition-all duration-150 shadow-sm" title="Partager sur WhatsApp">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </a>
            </div>
            
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors duration-150"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1-7 0a5 5 0 0 0-7 0v-9z"/>
                <path d="M5 21v-7"/>
              </svg>
              <span className="text-xs font-semibold">Signaler l'annonce</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#2D5016] via-[#3a6b1e] to-[#4a8525] text-white py-10">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="flex items-start gap-5 flex-wrap">
            <CompanyLogo logo={job.user?.companyLogo} name={job.companyName} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight tracking-tight mb-1">
                {job.title}
              </h1>
              <p className="text-[#A7D129] font-bold text-base mb-3">{job.companyName}</p>
              <div className="flex flex-wrap gap-2 items-center">
                {contract && (
                  <span className="px-3 py-1 bg-[#A7D129] text-[#2D5016] rounded-full text-xs font-bold">
                    {contract}
                  </span>
                )}
                {job.location && (
                  <span className="px-3 py-1 bg-white/15 rounded-full text-xs font-semibold flex items-center gap-1">
                    📍 {job.location}
                  </span>
                )}
                {remoteHero && (
                  <span className={`px-3 py-1 ${remoteHero.bg} rounded-full text-xs font-semibold`}>
                    {remote?.icon} {remoteHero.label}
                  </span>
                )}
                {job.isFeatured && (
                  <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-bold">
                    ⭐ Premium
                  </span>
                )}
                {job.isSponsored && (
                  <span className="px-3 py-1 bg-sky-400/80 rounded-full text-xs font-bold">
                    Sponsorisé
                  </span>
                )}
              </div>

              <div className="flex items-center mt-4">
                <p className="text-white/60 text-xs">Publié le {fmtDate(job.publishedAt)}</p>
              </div>
            </div>


            {/* CTA desktop — cœur + postuler */}
            <div className="hidden md:flex shrink-0 self-center items-center gap-3">
              {!isVisitor && (
                <HeartButton
                  isFavorited={isFavorited}
                  loading={favLoading}
                  onClick={handleToggleFavorite}
                  variant="hero"
                />
              )}
              {canApply && (
                <button
                  onClick={handlePostuler}
                  className="px-8 py-3 bg-[#A7D129] text-[#2D5016] font-extrabold rounded-full text-sm shadow-lg hover:bg-white transition-all duration-200 hover:scale-[1.03] active:scale-100"
                >
                  Postuler
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

        {/* LEFT */}
        <div className="flex flex-col gap-5">

          {/* Critères */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
              <h2 className="font-bold text-gray-900 text-base">
                {"Critères de l'annonce"} : {job.title}
              </h2>
            </div>
            <div className="px-6 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <CriteriaRow label="Métier"          value={job.category?.name} />
                <CriteriaRow label="Type de contrat" value={contract} />
                <CriteriaRow label="Télétravail"     value={remote ? `${remote.icon} ${remote.label}` : null} />
                <CriteriaRow label="Ville"           value={job.city} />
                <CriteriaRow label="Région"          value={job.region} />
              </div>
              <div>
                <CriteriaRow label="Niveau d'expérience" value={EXPERIENCE_LABELS[job.experienceLevel]} />
                <CriteriaRow label="Niveau d'études"     value={EDUCATION_LABELS[job.educationLevel]} />
                <CriteriaRow label="Salaire"             value={salary} />
                <CriteriaRow label="Candidatures"        value={appCount > 0 ? `${appCount} reçue(s)` : null} />
              </div>
            </div>

            {skills.length > 0 && (
              <div className="px-6 pb-5 pt-3 border-t border-gray-50">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Compétences clés</p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span key={s} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#A7D129]/60 text-[#2D5016] hover:bg-[#E8F5D0] transition-colors">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {deadline && (
              <div className="mx-6 mb-5 mt-2 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
                <span className="text-lg">⏰</span>
                <div>
                  <p className="text-xs text-orange-600 font-semibold">Date limite de candidature</p>
                  <p className="text-sm font-bold text-orange-700">{deadline}</p>
                </div>
              </div>
            )}
          </section>

          {/* Description */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
              <h2 className="font-bold text-gray-900 text-base">Poste proposé : {job.title}</h2>
            </div>
            <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed">
              <FormattedDescription text={job.description} />
            </div>
          </section>

          <LanguagesSection languages={languages} />

          <MapFrame
            latitude={job.latitude}
            longitude={job.longitude}
            location={job.location}
            city={job.location}
          />

          {/* CTA Postuler + cœur mobile */}
         <div className="flex gap-3">
            {!isVisitor && (
              <HeartButton
                isFavorited={isFavorited}
                loading={favLoading}
                onClick={handleToggleFavorite}
                variant="inline"
              />
            )}
            {canApply && (
              <button
                onClick={handlePostuler}
                className="flex-1 py-4 bg-[#A7D129] text-[#2D5016] font-extrabold rounded-2xl text-sm shadow hover:bg-[#2D5016] hover:text-white transition-all duration-200 hover:scale-[1.01] active:scale-100"
              >
                {isVisitor ? '✦ Créer un compte pour postuler' : '✦ Postuler à cette offre'}
              </button>
            )}
          </div>

          {/* Alerte fraude */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3 items-start">
            <span className="text-amber-500 text-xl shrink-0">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Super alerte !</strong> Ne payez pas d'argent à un employeur potentiel. Ne remettez aucune somme d'argent en échange d'un contrat de travail potentiel ou pour suivre une formation préalable à l'embauche. Méfiez-vous de toute offre proposant à l'international. Merci de signaler toute irrégularité via le formulaire de contact en sélectionnant{' '}
              <em>"Signaler une annonce d'emploi"</em>.
            </p>
          </div>

          {/* CTA mobile */}
          {canApply && (
            <div className="md:hidden">
              <button
                onClick={handlePostuler}
                className="w-full py-3.5 bg-[#A7D129] text-[#2D5016] font-extrabold rounded-full text-sm shadow hover:bg-[#2D5016] hover:text-white transition-all duration-200"
              >
                Postuler à cette offre
              </button>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-5">

          {/* Entreprise + CTA */}
          <div className="bg-[#2D5016] rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <CompanyLogo logo={job.user?.companyLogo} name={job.companyName} size="sm" />
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-snug">{job.companyName}</h3>
                {job.user?.city && (
                  <p className="text-white/60 text-xs mt-0.5">📍 {job.user.city}</p>
                )}
              </div>
            </div>
            {job.user?.companyWebsite && (
              <a href={job.user.companyWebsite} target="_blank" rel="noopener noreferrer"
                className="text-[#A7D129] text-xs font-semibold mt-1 block hover:underline truncate">
                🌐 {job.user.companyWebsite}
              </a>
            )}
            <div className="my-4 border-t border-white/10" />
            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">Secteur</p>
            <p className="text-white/90 text-sm font-semibold">{job.category?.name || '-'}</p>
            <a href="#" className="text-[#A7D129] text-xs font-semibold mt-3 inline-block hover:underline">
              Voir toutes nos annonces
            </a>
            {canApply && (
              <button
                onClick={handlePostuler}
                className="mt-5 w-full py-3 bg-[#A7D129] text-[#2D5016] font-extrabold rounded-full text-sm hover:bg-white transition-all duration-200 hover:scale-[1.02] active:scale-100"
              >
                {isVisitor ? 'Créer un compte pour postuler' : 'Postuler'}
              </button>
            )}
          </div>

          {/* Infos rapides */}
          <div className="bg-[#E8F5D0] rounded-2xl border border-[#A7D129]/30 p-5">
            <p className="text-[10px] uppercase tracking-widest text-[#7BA428] font-bold mb-3">Infos rapides</p>
            <div className="flex flex-col gap-2.5 text-sm">
              {job.viewsCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Vues</span>
                  <span className="font-bold text-[#2D5016]">{job.viewsCount.toLocaleString('fr-MA')}</span>
                </div>
              )}
              {appCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Candidatures</span>
                  <span className="font-bold text-[#2D5016]">{appCount}</span>
                </div>
              )}
              {remote && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Télétravail</span>
                  <span className="font-bold text-[#2D5016]">{remote.icon} {remote.label}</span>
                </div>
              )}
              {job.region && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Région</span>
                  <span className="font-bold text-[#2D5016]">{job.region}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Publié le</span>
                <span className="font-bold text-[#2D5016]">{fmtDate(job.publishedAt)}</span>
              </div>
              {deadline && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Expire le</span>
                  <span className="font-bold text-orange-600">{deadline}</span>
                </div>
              )}
              {job.category && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Catégorie</span>
                  <span className="font-bold text-[#2D5016]">{job.category.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Offres similaires */}
          {related.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-[#A7D129] inline-block" />
                <h3 className="font-bold text-gray-900 text-sm">Autres offres susceptibles de vous intéresser</h3>
              </div>
              <div className="p-4 flex flex-col gap-3">
                {related.map((j) => (
                  <RelatedJobCard key={j.id} job={j} />
                ))}
              </div>
              <div className="px-5 pb-5">
                <Link href="/jobs"
                  className="block w-full text-center py-2.5 border-2 border-[#2D5016] text-[#2D5016] font-bold rounded-full text-xs hover:bg-[#2D5016] hover:text-white transition-all duration-200">
                  Toutes les offres d'emploi
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {isVisitor && (
        <div id="inscription" className="max-w-[1200px] mx-auto px-4 pb-12">
          <div className="max-w-[1000px] mx-auto">
            <InlineRegisterSection jobTitle={job.title} />
          </div>
        </div>
      )}

      <FloatingButtons isVisitor={isVisitor} userRole={userRole} />

      {/* Report Modal */}
      {showReport && (
        <ReportModal
          isOpen={showReport}
          targetType="JOB"
          targetId={id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}