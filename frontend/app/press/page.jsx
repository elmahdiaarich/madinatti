'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Newspaper } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { pressService } from '@/services/pressService';
import PressCard, { LeadStory, timeAgo } from '@/components/press/PressCard';
import { pressFontVars } from '@/lib/pressFonts';

const PAGE_SIZE = 13; // 1 lead + 12 en grille

// Infinite scroll doesn't need buildPageWindow

const LABELS = {
  FR: {
    masthead: 'Actualités',
    subtitle: "L'actualité de Kénitra et du Maroc, via Hespress.",
    updated: 'Mis à jour',
    empty: 'Aucun article trouvé.',
    error: 'Impossible de charger les actualités pour le moment.',
    loadingMore: 'Chargement...',
    allCategories: 'Toutes',
    results: (n) => `${n} article${n > 1 ? 's' : ''}`,
  },
  AR: {
    masthead: 'الأخبار',
    subtitle: 'أخبار القنيطرة والمغرب عبر هسبريس.',
    updated: 'آخر تحديث',
    empty: 'لا توجد مقالات.',
    error: 'تعذر تحميل الأخبار حاليًا.',
    loadingMore: 'جاري التحميل...',
    allCategories: 'الكل',
    results: (n) => `${n} مقال`,
  },
};

export default function PressPage() {
  const { user } = useAuth();
  const [language, setLanguage] = useState('FR');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoritedIds, setFavoritedIds] = useState(new Set());

  const t = LABELS[language];
  const dir = language === 'AR' ? 'rtl' : 'ltr';
  const displayFont = language === 'AR' ? 'var(--font-display-ar)' : 'var(--font-display-fr)';

  const observerRef = useRef(null);

  const fetchArticles = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    setError(null);
    try {
      const response = await pressService.getAll({ language, page, limit: PAGE_SIZE, categoryId: selectedCategoryId });
      const newArticles = response.data || [];
      
      setArticles((prev) => isLoadMore ? [...prev, ...newArticles] : newArticles);
      
      const totalPages = response.pagination?.totalPages || 1;
      setPagination(response.pagination || { page: 1, totalPages: 1, total: newArticles.length });
      setHasMore(page < totalPages);
    } catch (err) {
      console.error('Failed to load press articles', err);
      setError(t.error);
      if (!isLoadMore) setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [language, page, selectedCategoryId]);

  useEffect(() => {
    pressService.getCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  useEffect(() => { fetchArticles(page > 1); }, [fetchArticles, page]);
  useEffect(() => { 
    setPage(1); 
    setSelectedCategoryId(''); // Reset category on language change
  }, [language]);
  
  useEffect(() => {
    setPage(1); // Reset page on category change
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!user) { setFavoritedIds(new Set()); return; }
    pressService.getFavorites()
      .then((res) => setFavoritedIds(new Set((res.data || []).map((a) => a.id))))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) observer.unobserve(observerRef.current);
    };
  }, [hasMore, loading]);

  const showLead = page === 1 && articles.length > 0;
  const lead = showLead ? articles[0] : null;
  const rest = showLead ? articles.slice(1) : articles;

  const dateline = new Date().toLocaleDateString(language === 'AR' ? 'ar-MA' : 'fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div
      dir={dir}
      lang={language === 'AR' ? 'ar' : 'fr'}
      className={`min-h-screen  ${pressFontVars}`}
    >
      {/* MASTHEAD */}
      <header className="border-b-4 border-double border-primary-dark">
        <div className="mx-auto max-w-[1160px] px-5 pb-5 pt-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-dark/80 capitalize"
                style={{ fontFamily: 'var(--font-meta)' }}
              >
                {dateline} · Madinatti
              </p>
              <h1
                className="mt-1 text-5xl font-black tracking-tight text-primary-dark sm:text-6xl"
                style={{ fontFamily: displayFont }}
              >
                {t.masthead}
              </h1>
            </div>

            <div className="flex items-center gap-3 pt-2 text-sm font-semibold" style={{ fontFamily: 'var(--font-meta)' }}>
              <button
                onClick={() => setLanguage('FR')}
                className={`border-b-2 pb-1 transition-colors ${language === 'FR' ? 'border-accent text-primary-dark' : 'border-transparent text-primary-dark/60 hover:text-primary-dark'}`}
              >
                FRANÇAIS
              </button>
              <span className="text-primary-sage">/</span>
              <button
                onClick={() => setLanguage('AR')}
                className={`border-b-2 pb-1 transition-colors ${language === 'AR' ? 'border-accent text-primary-dark' : 'border-transparent text-primary-dark/60 hover:text-primary-dark'}`}
              >
                العربية
              </button>
            </div>
          </div>

          <div
            className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-primary-sage pt-3 text-xs text-primary-dark/80"
            style={{ fontFamily: 'var(--font-meta)' }}
          >
            <p>{t.subtitle}</p>
            {articles[0] && (
              <p>{t.updated} · {timeAgo(articles[0].publishedAt, language)}</p>
            )}
          </div>
          
          {/* CATEGORIES TABS */}
          {categories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategoryId('')}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCategoryId === '' 
                    ? 'bg-primary-dark text-white' 
                    : 'bg-primary-mint text-primary-dark/80 hover:bg-primary-sage hover:text-primary-dark'
                }`}
                style={{ fontFamily: 'var(--font-meta)' }}
              >
                {t.allCategories}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    selectedCategoryId === cat.id 
                      ? 'bg-primary-dark text-white' 
                      : 'bg-primary-mint text-primary-dark/80 hover:bg-primary-sage hover:text-primary-dark'
                  }`}
                  style={{ fontFamily: 'var(--font-meta)' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-[1160px] px-5 py-8">
        {loading ? (
          <div className="space-y-8">
            <div className="grid animate-pulse gap-6 border-b-2 border-primary-dark pb-8 sm:grid-cols-5">
              <div className="space-y-3 sm:col-span-3">
                <div className="h-3 w-24 bg-primary-sage" />
                <div className="h-8 w-full bg-primary-sage" />
                <div className="h-4 w-3/4 bg-primary-sage" />
              </div>
              <div className="h-56 border border-primary-sage bg-primary-mint sm:col-span-2" />
            </div>
            <div className="columns-1 gap-10 sm:columns-2 lg:columns-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="mb-8 animate-pulse space-y-3 break-inside-avoid">
                  <div className="h-40 border border-primary-sage bg-primary-mint" />
                  <div className="h-3 w-16 bg-primary-sage" />
                  <div className="h-5 w-full bg-primary-sage" />
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="border border-accent/30 bg-accent/5 py-10 text-center text-sm text-accent">
            {error}
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center gap-3 border border-primary-sage py-20 text-center">
            <Newspaper className="text-primary-sage/60" size={40} />
            <p className="text-sm text-primary-dark/80">{t.empty}</p>
          </div>
        ) : (
          <>
            {!loading && (
              <p className="mb-6 text-xs text-primary-dark/80" style={{ fontFamily: 'var(--font-meta)' }}>
                {t.results(pagination.total)}
              </p>
            )}

            {lead && (
              <div className="mb-10">
                <LeadStory article={lead} language={language} initialFavorited={favoritedIds.has(lead.id)} />
              </div>
            )}

            <div className="columns-1 gap-10 sm:columns-2 lg:columns-3">
              {rest.map((article) => (
                <div key={article.id} className="mb-8 border-b border-primary-sage pb-6 break-inside-avoid">
                  <PressCard article={article} language={language} initialFavorited={favoritedIds.has(article.id)} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* SENTINEL FOR INFINITE SCROLL */}
        {hasMore && (
          <div ref={observerRef} className="mt-8 py-4 text-center text-sm text-primary-dark/80" style={{ fontFamily: 'var(--font-meta)' }}>
            {t.loadingMore}
          </div>
        )}
      </div>
    </div>
  );
}