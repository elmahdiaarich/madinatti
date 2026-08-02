'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, MapPin, Newspaper, Bookmark, BookmarkCheck, Volume2, Pause, Play, Square } from 'lucide-react';
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
    bySource: 'Madinatti',
    byAuthor: (name) => `Par ${name} · Madinatti`,
    listen: "Écouter l'article",
    playing: "En lecture...",
    pause: "Pause",
    stop: "Arrêter",
  },
  AR: {
    back: 'العودة إلى الأخبار',
    notFound: 'المقال غير موجود',
    notFoundSub: 'هذا المقال لم يعد متوفرًا أو تم حذفه.',
    readFull: 'قراءة المقال كاملاً على هسبريس',
    loading: 'جارٍ تحميل المقال...',
    save: 'حفظ',
    saved: 'محفوظ',
    bySource: 'مدينتي',
    byAuthor: (name) => `بقلم ${name} · مدينتي`,
    listen: "الاستماع للمقال",
    playing: "جاري القراءة...",
    pause: "إيقاف مؤقت",
    stop: "إيقاف",
  },
};

const fmtDate = (d, lang) =>
  d
    ? new Date(d).toLocaleDateString(lang === 'AR' ? 'ar-MA' : 'fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    : '';

function AudioPlayer({ title, description, language }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState([]);

  const t = LABELS[language];

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        if (available && available.length > 0) {
          setVoices(available);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    } else {
      setSupported(false);
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!supported || typeof window === 'undefined') return;
    const synth = window.speechSynthesis;

    if (isPlaying) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
      return;
    }

    synth.cancel();

    const textToRead = `${title}. ${description || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;

    // Récupérer les voix disponibles (si state pas encore à jour, re-forcer getVoices)
    const currentVoices = voices.length > 0 ? voices : synth.getVoices();
    const targetPrefix = language === 'AR' ? 'ar' : 'fr';
    const targetExact = language === 'AR' ? 'ar-MA' : 'fr-FR';

    // Recherche de la meilleure voix de la bonne langue (ex: fr-FR puis fr-CA/fr-BE/fr)
    const voice =
      currentVoices.find((v) => v.lang.toLowerCase() === targetExact.toLowerCase()) ||
      currentVoices.find((v) => v.lang.toLowerCase().startsWith(targetPrefix)) ||
      currentVoices.find((v) => v.lang.toLowerCase().includes(targetPrefix));

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = language === 'AR' ? 'ar-SA' : 'fr-FR';
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    synth.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handleStop = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  if (!supported) return null;

  return (
    <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary-sage bg-primary-mint/40 p-2.5 sm:p-3">
      <button
        onClick={handleTogglePlay}
        className="flex items-center gap-2 rounded-lg bg-primary-dark px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-transform active:scale-95 hover:bg-primary-dark/90"
        style={{ fontFamily: 'var(--font-meta)' }}
      >
        {isPlaying && !isPaused ? (
          <>
            <Pause size={15} />
            <span>{t.pause}</span>
          </>
        ) : (
          <>
            <Volume2 size={15} className={isPlaying ? 'animate-pulse text-accent' : ''} />
            <span>{isPlaying && isPaused ? t.listen : (isPlaying ? t.playing : t.listen)}</span>
          </>
        )}
      </button>

      {isPlaying && (
        <button
          onClick={handleStop}
          className="flex items-center gap-1 rounded-lg border border-primary-dark/20 bg-white px-3 py-2 text-xs font-bold text-primary-dark hover:bg-red-50 hover:text-red-600 transition-colors"
          style={{ fontFamily: 'var(--font-meta)' }}
          title={t.stop}
        >
          <Square size={13} fill="currentColor" />
          <span>{t.stop}</span>
        </button>
      )}

      <span className="ms-auto text-[11px] font-semibold text-primary-dark/70" style={{ fontFamily: 'var(--font-meta)' }}>
        {isPlaying ? (isPaused ? t.pause : t.playing) : '🔊 Audio'}
      </span>
    </div>
  );
}

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
          } catch (_) { }
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
  const isVideo = article.contentType === 'VIDEO' && article.videoUrl;
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
              className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${isFavorited ? 'text-accent' : 'text-primary-dark/80 hover:text-primary-dark'
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
          <span>{article.source === 'ORIGINAL' ? (article.authorName ? t.byAuthor(article.authorName) : t.bySource) : 'Hespress'}</span>
        </div>

        {/* Player de synthèse vocale (Text-to-Speech) — inchangé, utile même pour une vidéo */}
        <AudioPlayer title={article.title} description={article.description} language={language} />

        <div className="relative mt-6 h-64 w-full overflow-hidden border border-primary-sage bg-primary-mint sm:h-96">
          {isVideo ? (
            <video
              src={article.videoUrl}
              controls
              playsInline
              className="h-full w-full object-contain bg-black"
            />
          ) : hasImage ? (
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
            className={`mt-8 text-base leading-relaxed text-primary-dark ${language === 'FR'
                ? 'first-letter:me-2 first-letter:float-start first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.8] first-letter:text-primary-dark'
                : ''
              }`}
            style={{ fontFamily: bodyFont }}
          >
            {article.description}
          </p>
        )}

        {article.source !== 'ORIGINAL' && article.sourceUrl && (
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
        )}
      </article>
    </div>
  );
}