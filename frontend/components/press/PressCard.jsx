'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Bookmark, BookmarkCheck, MapPin, Newspaper } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { pressService } from '@/services/pressService';

const SAVE_LABEL = { FR: 'Enregistrer', AR: 'حفظ' };
const SAVED_LABEL = { FR: 'Enregistré', AR: 'محفوظ' };
const LEAD_KICKER = { FR: 'À la une', AR: 'العنوان الرئيسي' };

// ── Relative time helper (bilingue FR/AR) ───────────────────────────────────
export function timeAgo(dateStr, language = 'FR') {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return language === 'AR' ? 'الآن' : "à l'instant";
  if (diffMin < 60) return language === 'AR' ? `منذ ${diffMin} د` : `il y a ${diffMin} min`;

  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return language === 'AR' ? `منذ ${diffH} س` : `il y a ${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return language === 'AR' ? `منذ ${diffD} يوم` : `il y a ${diffD}j`;

  return new Date(dateStr).toLocaleDateString(language === 'AR' ? 'ar-MA' : 'fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function truncate(text, max = 140) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trim() + '…' : text;
}

function fontFor(language) {
  return {
    display: language === 'AR' ? 'var(--font-display-ar)' : 'var(--font-display-fr)',
    body: language === 'AR' ? 'var(--font-body-ar)' : 'var(--font-body-fr)',
  };
}

// ── SaveButton: bookmark éditorial, pas un cœur flottant ────────────────────
function SaveButton({ articleId, language, initialSaved = false, compact = false }) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => setSaved(initialSaved), [initialSaved]);
  if (!user) return null;

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    const prev = saved;
    setSaved(!prev);
    setLoading(true);
    try {
      await pressService.toggleFavorite(articleId);
    } catch {
      setSaved(prev);
    } finally {
      setLoading(false);
    }
  };

  const Icon = saved ? BookmarkCheck : Bookmark;
  const label = saved ? SAVED_LABEL[language] : SAVE_LABEL[language];

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={label}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
        saved ? 'text-accent' : 'text-primary-dark/80 hover:text-primary-dark'
      } ${loading ? 'opacity-50' : ''}`}
      style={{ fontFamily: 'var(--font-meta)' }}
    >
      <Icon size={compact ? 14 : 15} strokeWidth={2} />
      {!compact && label}
    </button>
  );
}

// ── LeadStory: traitement "Une" pour le premier article de la page 1 ────────
export function LeadStory({ article, language = 'FR', initialFavorited = false }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImage = article.imageUrl && !imgErr;
  const font = fontFor(language);

  return (
    <Link
      href={`/press/${article.id}`}
      className="group grid gap-6 border-b-2 border-primary-dark pb-8 sm:grid-cols-5"
    >
      <div className="flex flex-col justify-center bg-white p-6 sm:p-10 sm:col-span-3">
        <p
          className="mb-4 text-xs font-bold uppercase tracking-[0.14em] text-accent"
          style={{ fontFamily: 'var(--font-meta)' }}
        >
          {article.category || LEAD_KICKER[language]}
        </p>
        <h2
          className="text-3xl font-bold leading-[1.1] text-black sm:text-4xl group-hover:underline"
          style={{ fontFamily: font.display }}
        >
          {article.title}
        </h2>
        {article.description && (
          <p
            className="mt-4 text-base leading-relaxed text-primary-dark line-clamp-3"
            style={{ fontFamily: font.body }}
          >
            {truncate(article.description, 220)}
          </p>
        )}

        <div
          className="mt-5 flex items-center gap-4 border-t border-primary-sage pt-3 text-xs text-primary-dark/80"
          style={{ fontFamily: 'var(--font-meta)' }}
        >
          {article.city && (
            <span className="flex items-center gap-1">
              <MapPin size={12} />{article.city}
            </span>
          )}
          <span>{timeAgo(article.publishedAt, language)}</span>
          <span className="ms-auto">
            <SaveButton articleId={article.id} language={language} initialSaved={initialFavorited} />
          </span>
        </div>
      </div>

      <div className="relative h-56 overflow-hidden border border-primary-sage bg-primary-mint sm:col-span-2 sm:h-auto">
        {hasImage ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            onError={() => setImgErr(true)}
            className="h-full w-full object-cover grayscale-[15%] transition-all duration-500 group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary-sage/60">
            <Newspaper size={40} />
          </div>
        )}
      </div>
    </Link>
  );
}

// ── PressCard: bloc dense pour la grille en colonnes ─────────────────────────
export default function PressCard({ article, language = 'FR', initialFavorited = false }) {
  const [imgErr, setImgErr] = useState(false);
  const hasImage = article.imageUrl && !imgErr;
  const font = fontFor(language);

  return (
    <Link href={`/press/${article.id}`} className="group flex flex-col gap-3">
      <div className="relative h-40 w-full overflow-hidden border border-primary-sage bg-primary-mint">
        {hasImage ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            onError={() => setImgErr(true)}
            className="h-full w-full object-cover grayscale-[10%] transition-all duration-500 group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary-sage/60">
            <Newspaper size={28} />
          </div>
        )}
      </div>

      <p
        className="text-[11px] font-bold uppercase tracking-[0.12em] text-accent"
        style={{ fontFamily: 'var(--font-meta)' }}
      >
        {article.category || (language === 'AR' ? 'أخبار' : 'Actualité')}
      </p>

      <h3
        className="text-lg font-bold leading-snug text-black line-clamp-3 group-hover:underline"
        style={{ fontFamily: font.display }}
      >
        {article.title}
      </h3>

      {article.description && (
        <p className="text-sm leading-relaxed text-primary-dark line-clamp-2" style={{ fontFamily: font.body }}>
          {truncate(article.description)}
        </p>
      )}

      <div
        className="mt-auto flex items-center gap-3 border-t border-primary-sage pt-2 text-[11px] text-primary-dark/80"
        style={{ fontFamily: 'var(--font-meta)' }}
      >
        {article.city && (
          <span className="flex items-center gap-1 truncate">
            <MapPin size={11} className="shrink-0" />{article.city}
          </span>
        )}
        <span className="ms-auto shrink-0">{timeAgo(article.publishedAt, language)}</span>
      </div>

      <div onClick={(e) => e.preventDefault()}>
        <SaveButton articleId={article.id} language={language} initialSaved={initialFavorited} compact />
      </div>
    </Link>
  );
}