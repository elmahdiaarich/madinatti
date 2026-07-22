'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, MapPin, Newspaper, Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { pressService } from '@/services/pressService';
import { pressFontVars } from '@/lib/pressFonts';

const LABELS = {
  FR: {
    back: 'Retour à la Une',
    notFound: 'Article introuvable',
    notFoundSub: "Cet article n'existe plus ou a été supprimé.",
    readFull: "Lire l'article complet sur Hespress",
    loading: "Chargement de l'article...",
    save: 'Enregistrer',
    saved: 'Enregistré',
  },
  AR: {
    back: 'العودة إلى الأخبار',
    notFound: 'المقال غير موجود',
    notFoundSub: 'هذا المقال لم يعد متوفرًا أو تم حذفه.',
    readFull: 'قراءة المقال كاملاً على هسبريس',
    loading: 'جارٍ تحميل المقال...',
    save: 'حفظ',
    saved: 'محفوظ',
  },
};

const fmtDate = (d, lang) =>
  d
    ? new Date(d).toLocaleDateString(lang === 'AR' ? 'ar-MA' : 'fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : '';

export default function PressDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await pressService.getById(id);
        const data = res.data ?? res;
        setArticle(data);

        if (user) {
          try {
            const favRes = await pressService.getFavorites();
            setIsFavorited((favRes.data ?? []).some((a) => a.id === id));
          } catch (_) {}
        }
      } catch (e) {
        setError(e.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user]);

  const language = article?.language === 'AR' ? 'AR' : 'FR';
  const t = LABELS[language];
  const dir = language === 'AR' ? 'rtl' : 'ltr';
  const displayFont = language === 'AR' ? 'var(--font-display-ar)' : 'var(--font-display-fr)';
  const bodyFont = language === 'AR' ? 'var(--font-body-ar)' : 'var(--font-body-fr)';

  const handleToggleFavorite = async () => {
    if (!user || favLoading || !article) return;
    const prev = isFavorited;
    setIsFavorited(!prev);
    setFavLoading(true);
    try {
      await pressService.toggleFavorite(article.id);
    } catch {
      setIsFavorited(prev);
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-white text-primary-dark/80 ${pressFontVars}`} style={{ fontFamily: 'var(--font-meta)' }}>
        {LABELS.FR.loading}
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className={`flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4 text-center ${pressFontVars}`}>
        <Newspaper className="text-primary-sage/60" size={56} />
        <h1 className="text-2xl font-bold text-primary-dark" style={{ fontFamily: 'var(--font-display-fr)' }}>
          {LABELS.FR.notFound}
        </h1>
        <p className="text-sm text-primary-dark/80">{LABELS.FR.notFoundSub}</p>
        <Link
          href="/press"
          className="mt-2 border-2 border-primary-dark px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-primary-dark transition-colors hover:bg-primary-dark hover:text-white"
        >
          {LABELS.FR.back}
        </Link>
      </div>
    );
  }

  const hasImage = article.imageUrl && !imgErr;
  const SaveIcon = isFavorited ? BookmarkCheck : Bookmark;

  return (
    <div dir={dir} lang={language === 'AR' ? 'ar' : 'fr'} className={`min-h-screen bg-white ${pressFontVars}`}>
      {/* Mini bandeau */}
      <div className="border-b border-primary-dark">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-5 py-3">
          <Link
            href="/press"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary-dark/80 transition-colors hover:text-primary-dark"
            style={{ fontFamily: 'var(--font-meta)' }}
          >
            <ArrowLeft size={14} className="rtl:rotate-180" />
            {t.back}
          </Link>
          {user && (
            <button
              onClick={handleToggleFavorite}
              disabled={favLoading}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                isFavorited ? 'text-accent' : 'text-primary-dark/80 hover:text-primary-dark'
              } ${favLoading ? 'opacity-50' : ''}`}
              style={{ fontFamily: 'var(--font-meta)' }}
            >
              <SaveIcon size={14} />
              {isFavorited ? t.saved : t.save}
            </button>
          )}
        </div>
      </div>

      <article className="mx-auto max-w-[760px] px-5 py-8">
        <p
          className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-accent"
          style={{ fontFamily: 'var(--font-meta)' }}
        >
          {article.category || (language === 'AR' ? 'أخبار' : 'Actualité')}
        </p>

        <h1
          className="text-3xl font-bold leading-[1.1] text-primary-dark sm:text-4xl"
          style={{ fontFamily: displayFont }}
        >
          {article.title}
        </h1>

        <div
          className="mt-4 flex flex-wrap items-center gap-3 border-y border-primary-sage py-3 text-xs text-primary-dark/80"
          style={{ fontFamily: 'var(--font-meta)' }}
        >
          <span>{fmtDate(article.publishedAt, language)}</span>
          {article.city && (
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {article.city}
            </span>
          )}
          <span>Hespress</span>
        </div>

        <div className="relative mt-6 h-64 w-full overflow-hidden border border-primary-sage bg-primary-mint sm:h-96">
          {hasImage ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              onError={() => setImgErr(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary-sage/60">
              <Newspaper size={48} />
            </div>
          )}
        </div>

        {article.description && (
          <p
            className={`mt-8 text-base leading-relaxed text-primary-dark ${
              language === 'FR'
                ? 'first-letter:me-2 first-letter:float-start first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.8] first-letter:text-primary-dark'
                : ''
            }`}
            style={{ fontFamily: bodyFont }}
          >
            {article.description}
          </p>
        )}

        <a
          href={article.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-2 border-2 border-primary-dark px-5 py-3 text-sm font-bold uppercase tracking-wide text-primary-dark transition-colors hover:bg-primary-dark hover:text-white"
          style={{ fontFamily: 'var(--font-meta)' }}
        >
          {t.readFull}
          <ExternalLink size={15} />
        </a>
      </article>
    </div>
  );
}