'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Newspaper, MapPin, ChevronDown, X, Search } from 'lucide-react';
import { cities as moroccoCitiesRaw } from 'morocco-cities';
import { useAuth } from '@/context/AuthContext';
import { pressService } from '@/services/pressService';
import PressCard, { LeadStory, timeAgo } from '@/components/press/PressCard';
import { pressFontVars } from '@/lib/pressFonts';
import { tvChannels, radioStations } from '@/lib/tvRadioDirectory';
import { Tv, Radio as RadioIcon, ExternalLink } from 'lucide-react';

const PAGE_SIZE = 13; // 1 lead + 12 en grille

// Liste de toutes les villes marocaines issues de morocco-cities
const ALL_MOROCCO_CITIES = Array.from(
  new Set(moroccoCitiesRaw.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean))
).sort((a, b) => a.localeCompare(b, 'fr'));

// Top 8 grandes villes marocaines (FR et AR)
const TOP_8_CITIES_FR = ['Casablanca', 'Rabat', 'Kénitra', 'Marrakech', 'Tanger', 'Agadir', 'Fès', 'Meknès'];
const TOP_8_CITIES_AR = ['الدار البيضاء', 'الرباط', 'القنيطرة', 'مراكش', 'طنجة', 'أكادير', 'فاس', 'مكناس'];

const ALL_MOROCCO_CITIES_AR = [
  'الدار البيضاء', 'الرباط', 'فاس', 'مراكش', 'طنجة', 'أكادير', 'مكناس', 'وجدة',
  'القنيطرة', 'تطوان', 'خريبكة', 'تمارة', 'العيون', 'آسفي', 'بني ملال', 'الجديدة',
  'تادلة', 'الناظور', 'سطات', 'القصر الكبير', 'العرائش', 'خميسات', 'تزنيت', 'بركان',
  'الداخلة', 'كلميم', 'الرشيدية', 'ورزازات', 'الصويرة', 'الحسيمة', 'تازة', 'سيدي قاسم',
  'جرادة', 'تارودانت', 'شفشاون', 'ميدلت', 'أزرو', 'تيزنيت', 'تنغير', 'سيدي إفني'
];

const LABELS = {
  FR: {
    masthead: 'Actualités',
    subtitle: "L'actualité des villes du Maroc, agrégée via Hespress.",
    updated: 'Mis à jour',
    empty: 'Aucun article trouvé pour cette sélection.',
    error: 'Impossible de charger les actualités pour le moment.',
    loadingMore: 'Chargement...',
    allCategories: 'Toutes les catégories',
    allCities: 'Toutes',
    filterByCity: 'Ville :',
    searchCityPlaceholder: 'Chercher une ville...',
    noCityFound: 'Aucune ville trouvée',
    results: (n) => `${n} article${n > 1 ? 's' : ''}`,
  },
  AR: {
    masthead: 'الأخبار',
    subtitle: 'أخبار المدن المغربية عبر هسبريس.',
    updated: 'آخر تحديث',
    empty: 'لا توجد مقالات لهذا التحديد.',
    error: 'تعذر تحميل الأخبار حاليًا.',
    loadingMore: 'جاري التحميل...',
    allCategories: 'جميع التصنيفات',
    allCities: 'الكل',
    filterByCity: 'المدينة :',
    searchCityPlaceholder: 'البحث عن مدينة...',
    noCityFound: 'لم يتم العثور على مدينة',
    results: (n) => `${n} مقال`,
  },
};

const TABS = [
  { id: 'journal', labelFR: 'Journal', labelAR: 'الجريدة' },
  { id: 'video', labelFR: 'Vidéo', labelAR: 'فيديو' },
  { id: 'tv', labelFR: 'TV', labelAR: 'التلفزة' },
  { id: 'radio', labelFR: 'Radio', labelAR: 'الراديو' },
];

export default function PressPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('journal');
  const [language, setLanguage] = useState('FR');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [dbCities, setDbCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  const [articles, setArticles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoritedIds, setFavoritedIds] = useState(new Set());

  const dropdownRef = useRef(null);
  const observerRef = useRef(null);

  const t = LABELS[language];
  const dir = language === 'AR' ? 'rtl' : 'ltr';
  const displayFont = language === 'AR' ? 'var(--font-display-ar)' : 'var(--font-display-fr)';

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsCityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const fetchArticles = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) setLoading(true);
    setError(null);
    try {
      const response = await pressService.getAll({
        language,
        page,
        limit: PAGE_SIZE,
        categoryId: selectedCategoryId,
        city: selectedCity,
        contentType: activeTab === 'video' ? 'VIDEO' : 'ARTICLE',
      });
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
  }, [language, page, selectedCategoryId, selectedCity, activeTab]);

  useEffect(() => {
    pressService.getCategories(language)
      .then((res) => setCategories(res.data || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, [language]);

  useEffect(() => {
    pressService.getCities(language)
      .then((res) => setDbCities(res.data || []))
      .catch((err) => console.error('Failed to load cities', err));
  }, [language]);

  useEffect(() => {
    if (activeTab === 'journal' || activeTab === 'video') fetchArticles(page > 1);
  }, [fetchArticles, page, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    setPage(1);
    setSelectedCategoryId('');
    setSelectedCity('');
    setCitySearchQuery('');
  }, [language]);

  useEffect(() => {
    setPage(1);
  }, [selectedCategoryId, selectedCity]);

  useEffect(() => {
    if (!user) { setFavoritedIds(new Set()); return; }
    pressService.getFavorites()
      .then((res) => setFavoritedIds(new Set((res.data || []).map((a) => a.id))))
      .catch(() => { });
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

  // En mode AR : liste complète des villes en arabe + villes présentes en DB.
  // En mode FR : liste morocco-cities (noms français).
  const availableCities = useMemo(() => {
    if (language === 'AR') {
      return Array.from(new Set([...ALL_MOROCCO_CITIES_AR, ...dbCities])).sort((a, b) => a.localeCompare(b, 'ar'));
    }
    return ALL_MOROCCO_CITIES;
  }, [language, dbCities]);

  // 8 villes rapides (pills) selon la langue
  const topCities = useMemo(() => {
    return language === 'AR' ? TOP_8_CITIES_AR : TOP_8_CITIES_FR;
  }, [language]);

  const filteredCities = useMemo(() => {
    if (!citySearchQuery.trim()) return availableCities;
    const q = citySearchQuery.toLowerCase().trim();
    return availableCities.filter((c) => c.toLowerCase().includes(q));
  }, [citySearchQuery, availableCities]);

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
      className={`min-h-screen ${pressFontVars}`}
    >
      {/* MASTHEAD */}
      <header className="border-b-4 border-double border-primary-dark bg-white">
        <div className="mx-auto max-w-[1160px] px-5 pb-5 pt-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-dark/80 capitalize"
                style={{ fontFamily: 'var(--font-meta)' }}
              >
                {dateline} · Madinatti Press
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

          {/* ONGLETS PRINCIPAUX : JOURNAL / VIDÉO / TV / RADIO */}
          <div className="mt-4 flex gap-1 border-t border-primary-sage pt-3" style={{ fontFamily: 'var(--font-meta)' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-dark text-white'
                    : 'text-primary-dark/70 hover:bg-primary-mint'
                }`}
              >
                {language === 'AR' ? tab.labelAR : tab.labelFR}
              </button>
            ))}
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

          {/* BARRE DE FILTRAGE : 8 VILLES TOP + COMBOBOX CHERCHER UNE VILLE (Journal/Vidéo uniquement) */}
          {(activeTab === 'journal' || activeTab === 'video') && (
            <div className="mt-5 space-y-3" style={{ fontFamily: 'var(--font-meta)' }}>
              <div className="flex flex-wrap items-center gap-2 text-xs border-t border-primary-sage/60 pt-3">
                <span className="font-bold text-primary-dark shrink-0 flex items-center gap-1">
                  <MapPin size={13} className="text-accent" />
                  {t.filterByCity}
                </span>

                {/* Bouton "Toutes" */}
                <button
                  onClick={() => setSelectedCity('')}
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${
                    selectedCity === ''
                      ? 'bg-primary-dark text-white shadow-sm'
                      : 'bg-primary-mint text-primary-dark/80 hover:bg-primary-sage hover:text-primary-dark'
                  }`}
                >
                  {t.allCities}
                </button>

                {/* Top 8 villes rapides (FR=hardcoded, AR=depuis la base) */}
                {topCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`rounded-full px-3 py-1 font-semibold transition-all ${
                      selectedCity === city
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-primary-mint text-primary-dark/80 hover:bg-primary-sage hover:text-primary-dark'
                    }`}
                  >
                    {city}
                  </button>
                ))}

                {/* Searchable Combobox pour TOUTES les villes (morocco-cities) */}
                <div className="relative inline-block ms-auto sm:ms-0" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                    className="flex items-center gap-1.5 rounded-full border border-primary-dark/30 bg-white px-3.5 py-1 text-xs font-bold text-primary-dark outline-none hover:border-primary-dark hover:bg-primary-mint/50 transition-all shadow-sm"
                  >
                    <span>{selectedCity && !topCities.includes(selectedCity) ? selectedCity : t.searchCityPlaceholder}</span>
                    <ChevronDown size={13} className="text-primary-dark/70" />
                  </button>

                  {/* Dropdown Menu avec Input de Recherche */}
                  {isCityDropdownOpen && (
                    <div className="absolute end-0 sm:start-0 top-full mt-1.5 z-50 w-64 rounded-xl border border-primary-sage bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="relative mb-2">
                        <Search size={14} className="absolute start-2.5 top-1/2 -translate-y-1/2 text-primary-dark/50" />
                        <input
                          type="text"
                          value={citySearchQuery}
                          onChange={(e) => setCitySearchQuery(e.target.value)}
                          placeholder={t.searchCityPlaceholder}
                          className="w-full rounded-lg border border-primary-sage/70 bg-primary-mint/30 py-1.5 pe-3 ps-8 text-xs outline-none focus:border-primary-dark font-medium"
                          autoFocus
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-0.5 pe-1 custom-scrollbar text-xs">
                        {filteredCities.length === 0 ? (
                          <p className="p-2 text-center text-xs text-primary-dark/50">{t.noCityFound}</p>
                        ) : (
                          filteredCities.map((cityName) => (
                            <button
                              key={cityName}
                              onClick={() => {
                                setSelectedCity(cityName);
                                setIsCityDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-start font-semibold transition-colors ${
                                selectedCity === cityName
                                  ? 'bg-primary-dark text-white'
                                  : 'hover:bg-primary-mint text-primary-dark'
                              }`}
                            >
                              <span>{cityName}</span>
                              {/* Signale les villes qui ont des articles en DB (●) */}
                              {dbCities.includes(cityName) && (
                                <span className="text-[10px] opacity-70">●</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Badges de réinitialisation si une ville hors top est active */}
                {selectedCity && !topCities.includes(selectedCity) && (
                  <button
                    onClick={() => setSelectedCity('')}
                    className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-accent hover:bg-accent hover:text-white transition-colors"
                    title="Effacer le filtre ville"
                  >
                    <span className="font-bold">{selectedCity}</span>
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* CATEGORIES TABS */}
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-primary-sage/40">
                  <button
                    onClick={() => setSelectedCategoryId('')}
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                      selectedCategoryId === ''
                        ? 'bg-primary-dark text-white'
                        : 'bg-primary-mint/80 text-primary-dark/80 hover:bg-primary-sage hover:text-primary-dark'
                    }`}
                  >
                    {t.allCategories}
                  </button>
                  {categories.map((cat) => {
                    const displayName = cat.name?.toLowerCase() === 'uncategorized'
                      ? (language === 'AR' ? 'متنوع' : 'Divers')
                      : cat.name;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryId(cat.id)}
                        className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                          selectedCategoryId === cat.id
                            ? 'bg-primary-dark text-white'
                            : 'bg-primary-mint/80 text-primary-dark/80 hover:bg-primary-sage hover:text-primary-dark'
                        }`}
                      >
                        {displayName}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-[1160px] px-5 py-8">
        {activeTab === 'tv' && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {tvChannels.map((ch) => (
              <a
                key={ch.id}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-2 rounded-xl border border-primary-sage bg-white p-5 text-center transition-colors hover:border-primary-dark"
              >
                <Tv size={28} className="text-primary-sage group-hover:text-primary-dark transition-colors" />
                <span className="text-sm font-bold text-primary-dark">{ch.name}</span>
                <span className="text-[11px] text-primary-dark/60">{ch.category}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
                  {language === 'AR' ? 'الموقع الرسمي' : 'Site officiel'} <ExternalLink size={11} />
                </span>
              </a>
            ))}
          </div>
        )}

        {activeTab === 'radio' && (
          <div className="space-y-8">
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary-dark/70" style={{ fontFamily: 'var(--font-meta)' }}>
                {language === 'AR' ? 'إذاعات وطنية' : 'Radios nationales'}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {radioStations.national.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 rounded-xl border border-primary-sage bg-white p-5 text-center transition-colors hover:border-primary-dark"
                  >
                    <RadioIcon size={28} className="text-primary-sage group-hover:text-primary-dark transition-colors" />
                    <span className="text-sm font-bold text-primary-dark">{r.name}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
                      {language === 'AR' ? 'الموقع الرسمي' : 'Site officiel'} <ExternalLink size={11} />
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary-dark/70" style={{ fontFamily: 'var(--font-meta)' }}>
                {language === 'AR' ? 'إذاعات جهوية' : 'Radios régionales'}
              </h2>
              <a
                href={radioStations.regional.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl border border-primary-sage bg-white p-5 transition-colors hover:border-primary-dark"
              >
                <RadioIcon size={28} className="shrink-0 text-primary-sage group-hover:text-primary-dark transition-colors" />
                <span className="flex-1 text-sm text-primary-dark">{radioStations.regional.label}</span>
                <ExternalLink size={14} className="shrink-0 text-accent" />
              </a>
            </div>

            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-primary-dark/70" style={{ fontFamily: 'var(--font-meta)' }}>
                {language === 'AR' ? 'إذاعات خاصة' : 'Radios privées'}
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {radioStations.private.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2 rounded-xl border border-primary-sage bg-white p-5 text-center transition-colors hover:border-primary-dark"
                  >
                    <RadioIcon size={28} className="text-primary-sage group-hover:text-primary-dark transition-colors" />
                    <span className="text-sm font-bold text-primary-dark">{r.name}</span>
                    <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-accent">
                      {language === 'AR' ? 'الموقع الرسمي' : 'Site officiel'} <ExternalLink size={11} />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'journal' || activeTab === 'video') && (loading ? (
          <div className="space-y-8">
            <div className="grid animate-pulse gap-6 border-b-2 border-primary-dark pb-8 sm:grid-cols-5">
              <div className="space-y-3 sm:col-span-3">
                <div className="h-3 w-24 bg-primary-sage" />
                <div className="h-8 w-full bg-primary-sage" />
                <div className="h-4 w-3/4 bg-primary-sage" />
              </div>
              <div className="h-56 border border-primary-sage bg-primary-mint sm:col-span-2" />
            </div>
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse space-y-3">
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

            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <div key={article.id} className="border-b border-primary-sage pb-6">
                  <PressCard article={article} language={language} initialFavorited={favoritedIds.has(article.id)} />
                </div>
              ))}
            </div>
          </>
        ))}

        {/* SENTINEL FOR INFINITE SCROLL */}
        {(activeTab === 'journal' || activeTab === 'video') && hasMore && (
          <div ref={observerRef} className="mt-8 py-4 text-center text-sm text-primary-dark/80" style={{ fontFamily: 'var(--font-meta)' }}>
            {t.loadingMore}
          </div>
        )}
      </div>
    </div>
  );
}