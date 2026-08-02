'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Newspaper, MapPin, ChevronDown, X, Search } from 'lucide-react';
import { cities as moroccoCitiesRaw } from 'morocco-cities';
import { useAuth } from '@/context/AuthContext';
import { pressService } from '@/services/pressService';
import PressCard, { LeadStory, timeAgo } from '@/components/press/PressCard';
import { pressFontVars } from '@/lib/pressFonts';
import { tvChannels, radioStations } from '@/lib/tvRadioDirectory';
import { Tv, Radio as RadioIcon, ExternalLink, Play } from 'lucide-react';

const PAGE_SIZE = 13; // 1 lead + 12 en grille

const RADIO_UI_META = {
  'hit-radio': {
    nameAR: 'هيت راديو',
    catFR: '🎵 Musique & Hits',
    catAR: '🎵 موسيقى وسباق الأغاني',
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    color: '#E11D48',
    freqFR: '100.3 FM (Casa) • 98.0 FM (Rabat)',
    freqAR: '100.3 FM (البيضاء) • 98.0 FM (الرباط)',
  },
  'radio-mars': {
    nameAR: 'راديو مارس',
    catFR: '⚽ Sport & Directs',
    catAR: '⚽ رياضة وتغطيات مباشرة',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    color: '#16A34A',
    freqFR: '91.2 FM (Casa) • 96.5 FM (Rabat)',
    freqAR: '91.2 FM (البيضاء) • 96.5 FM (الرباط)',
  },
  'medi1-radio': {
    nameAR: 'ميدي 1 راديو',
    catFR: '📰 Info & Débats',
    catAR: '📰 أخبار ودوليات وموسيقى',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    color: '#0284C7',
    freqFR: '96.8 FM (Casa) • 102.7 FM (Tanger)',
    freqAR: '96.8 FM (البيضاء) • 102.7 FM (طنجة)',
  },
  'chada-fm': {
    nameAR: 'شذى إف إم',
    catFR: '🎵 Variété & Musique',
    catAR: '🎵 تنوع وترفيه',
    badgeBg: 'bg-pink-50 text-pink-700 border-pink-200',
    color: '#DB2777',
    freqFR: '100.8 FM (Casa) • 97.4 FM (Rabat)',
    freqAR: '100.8 FM (البيضاء) • 97.4 FM (الرباط)',
  },
  'al-idaa-al-watania': {
    nameAR: 'الإذاعة الوطنية',
    catFR: '🎙️ Généraliste & Culture',
    catAR: '🎙️ إذاعة عامة وثقافة',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    color: '#1D4ED8',
    freqFR: '93.5 FM (Casa) • 88.7 FM (Rabat)',
    freqAR: '93.5 FM (البيضاء) • 88.7 FM (الرباط)',
  },
  'chaine-inter': {
    nameAR: 'سلسلة إنتر',
    catFR: '🎙️ Info & Francophone',
    catAR: '🎙️ أخبار وفرانكوفونية',
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    color: '#0891B2',
    freqFR: '92.5 FM (Casa) • 90.7 FM (Rabat)',
    freqAR: '92.5 FM (البيضاء) • 90.7 FM (الرباط)',
  },
  'cap-radio': {
    nameAR: 'كاب راديو',
    catFR: '🎙️ Nord & Généraliste',
    catAR: '🎙️ منطقة الشمال وعامة',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    color: '#0D9488',
    freqFR: '104.5 FM (Tanger) • 101.5 FM (Tétouan)',
    freqAR: '104.5 FM (طنجة) • 101.5 FM (تطوان)',
  },
  'atlantic-radio': {
    nameAR: 'أتلاَنتيك راديو',
    catFR: '📈 Économie & Culture',
    catAR: '📈 اقتصاد وثقافة',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    color: '#4F46E5',
    freqFR: '92.0 FM (Casa) • 106.9 FM (Rabat)',
    freqAR: '92.0 FM (البيضاء) • 106.9 FM (الرباط)',
  },
  'aswat': {
    nameAR: 'راديو أصوات',
    catFR: '🗣️ Société & Services',
    catAR: '🗣️ مجتمع وخدمات',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    color: '#EA580C',
    freqFR: '104.3 FM (Casa) • 103.7 FM (Rabat)',
    freqAR: '104.3 FM (البيضاء) • 103.7 FM (الرباط)',
  },
  'mfm-radio': {
    nameAR: 'أم إف أم راديو',
    catFR: '🎙️ Généraliste & Proximité',
    catAR: '🎙️ عامة وقرب',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    color: '#D97706',
    freqFR: '90.1 FM (Casa) • 90.0 FM (Rabat)',
    freqAR: '90.1 FM (البيضاء) • 90.0 FM (الرباط)',
  },
};

const TV_UI_META = {
  'al-aoula': {
    nameAR: 'الأولى',
    catFR: '📺 Généraliste & Information',
    catAR: '📺 قناة عامة وأخبار',
    badgeBg: 'bg-red-50 text-red-700 border-red-200',
    color: '#B91C1C',
    hd: true,
  },
  'arryadia': {
    nameAR: 'الرياضية',
    catFR: '⚽ Sport & Directs',
    catAR: '⚽ رياضة وتغطيات مباشرة',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    color: '#15803D',
    hd: true,
  },
  'athaqafia': {
    nameAR: 'الثقافية',
    catFR: '🎨 Culture, Arts & Éducation',
    catAR: '🎨 ثقافة وفنون وتعليم',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    color: '#6D28D9',
    hd: false,
  },
  'al-maghribia': {
    nameAR: 'المغربية',
    catFR: '🌍 MRE & International',
    catAR: '🌍 الجالية ودوليات',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    color: '#1D4ED8',
    hd: false,
  },
  'assadissa': {
    nameAR: 'السادسة',
    catFR: '📖 Coran & Études Islamiques',
    catAR: '📖 القرآن الكريم والدروس',
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    color: '#0F766E',
    hd: false,
  },
  'tamazight-tv': {
    nameAR: 'تَمازيغت 8',
    catFR: '🇲🇦 Amazigh & Patrimoine',
    catAR: '🇲🇦 ثقافة أمازيغية وتراث',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    color: '#B45309',
    hd: true,
  },
  'laayoune-tv': {
    nameAR: 'قناة العيون',
    catFR: '📍 Régionale (Sud)',
    catAR: '📍 جهوية (الصحراء المغربية)',
    badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    color: '#C2410C',
    hd: false,
  },
  '2m': {
    nameAR: '2M دوزيم',
    catFR: '📺 Généraliste & Divertissement',
    catAR: '📺 قناة عامة وترفيه',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    color: '#4338CA',
    hd: true,
  },
  'medi1tv': {
    nameAR: 'ميدي 1 تيفي',
    catFR: '📰 Info, Débats & Maghreb',
    catAR: '📰 أخبار ودوليات',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    color: '#0369A1',
    hd: true,
  },
  'chada-tv': {
    nameAR: 'شدة تيفي',
    catFR: '🎭 Musique & Divertissement',
    catAR: '🎭 موسيقى وفنون',
    badgeBg: 'bg-pink-50 text-pink-700 border-pink-200',
    color: '#BE185D',
    hd: true,
  },
};

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
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-t-lg transition-colors ${activeTab === tab.id
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
                  className={`rounded-full px-3 py-1 font-semibold transition-all ${selectedCity === ''
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
                    className={`rounded-full px-3 py-1 font-semibold transition-all ${selectedCity === city
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
                              className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-start font-semibold transition-colors ${selectedCity === cityName
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
                    className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${selectedCategoryId === ''
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
                        className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${selectedCategoryId === cat.id
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
        {activeTab === 'tv' && (() => {
          const renderTvCard = (ch) => {
            const meta = TV_UI_META[ch.id] || {};
            const displayName = language === 'AR' && meta.nameAR ? meta.nameAR : ch.name;
            const brandColor = meta.color || '#1E293B';

            return (
              <div
                key={ch.id}
                className="group flex flex-col justify-between rounded-2xl border border-primary-sage/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-dark hover:shadow-md"
              >
                <div>
                  <div className="mb-3 flex items-center justify-end">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                      {meta.hd ? (language === 'AR' ? 'بث HD' : 'Direct HD') : (language === 'AR' ? 'مباشر' : 'Live')}
                    </span>
                  </div>

                  <div className="my-3 flex items-center gap-3.5">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Tv size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-primary-dark transition-colors group-hover:text-accent">
                        {displayName}
                      </h3>
                      <span className="text-[11px] font-medium text-primary-dark/60">
                        {language === 'AR' ? 'التلفزة المغربية' : 'Télévision marocaine'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-dark px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent"
                  >
                    <Play size={13} fill="currentColor" />
                    {language === 'AR' ? 'مشاهدة البث' : 'Regarder'}
                  </a>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={language === 'AR' ? 'الموقع الرسمي' : 'Site officiel'}
                    className="inline-flex items-center justify-center rounded-lg border border-primary-sage/60 p-2 text-xs text-primary-dark transition-colors hover:border-primary-dark hover:bg-gray-50"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            );
          };

          const publicChannels = tvChannels.filter((c) => ['al-aoula', 'arryadia', 'athaqafia', 'al-maghribia', 'assadissa', 'tamazight-tv', 'laayoune-tv'].includes(c.id));
          const mainChannels = tvChannels.filter((c) => ['2m', 'medi1tv'].includes(c.id));
          const privateChannels = tvChannels.filter((c) => ['chada-tv'].includes(c.id));

          return (
            <div className="space-y-8">
              {/* CHAÎNES NATIONALES GÉNÉRALISTES */}
              {mainChannels.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-primary-dark/70" style={{ fontFamily: 'var(--font-meta)' }}>
                    {language === 'AR' ? 'قنوات وطنية عامة' : 'Chaînes nationales généralistes'}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {mainChannels.map((ch) => renderTvCard(ch))}
                  </div>
                </div>
              )}

              {/* GROUPE SNRT */}
              {publicChannels.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-primary-dark/70" style={{ fontFamily: 'var(--font-meta)' }}>
                    {language === 'AR' ? 'باقة القنوات الوطنية (SNRT)' : 'Bouquet national (SNRT)'}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {publicChannels.map((ch) => renderTvCard(ch))}
                  </div>
                </div>
              )}

              {/* CHAÎNES PRIVÉES ET THÉMATIQUES */}
              {privateChannels.length > 0 && (
                <div>
                  <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-primary-dark/70" style={{ fontFamily: 'var(--font-meta)' }}>
                    {language === 'AR' ? 'قنوات خاصة وترفيهية' : 'Chaînes privées & thématiques'}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {privateChannels.map((ch) => renderTvCard(ch))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === 'radio' && (() => {
          const renderRadioCard = (r) => {
            const meta = RADIO_UI_META[r.id] || {};
            const displayName = language === 'AR' && meta.nameAR ? meta.nameAR : r.name;
            const brandColor = meta.color || '#475569';

            return (
              <div
                key={r.id}
                className="group flex flex-col justify-between rounded-2xl border border-primary-sage/60 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-dark hover:shadow-md"
              >
                <div>
                  <div className="mb-3 flex items-center justify-end">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="En direct" />
                  </div>

                  <div className="my-3 flex items-center gap-3.5">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm"
                      style={{ backgroundColor: brandColor }}
                    >
                      <RadioIcon size={24} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-primary-dark transition-colors group-hover:text-accent">
                        {displayName}
                      </h3>
                      {(meta.freqFR || meta.freqAR) && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                          ⚡ {language === 'AR' && meta.freqAR ? meta.freqAR : meta.freqFR}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-dark px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent"
                  >
                    <Play size={13} fill="currentColor" />
                    {language === 'AR' ? 'استمع مباشرة' : 'Écouter'}
                  </a>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={language === 'AR' ? 'الموقع الرسمي' : 'Site officiel'}
                    className="inline-flex items-center justify-center rounded-lg border border-primary-sage/60 p-2 text-xs text-primary-dark transition-colors hover:border-primary-dark hover:bg-gray-50"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            );
          };

          return (
            <div className="space-y-8">
              {/* RADIOS NATIONALES */}
              <div>
                <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-primary-dark/70" style={{ fontFamily: 'var(--font-meta)' }}>
                  {language === 'AR' ? 'إذاعات وطنية' : 'Radios nationales'}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {radioStations.national.map((r) => renderRadioCard(r))}
                </div>
              </div>

              {/* RADIOS PRIVÉES */}
              <div>
                <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-primary-dark/70" style={{ fontFamily: 'var(--font-meta)' }}>
                  {language === 'AR' ? 'إذاعات خاصة' : 'Radios privées'}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {radioStations.private.map((r) => renderRadioCard(r))}
                </div>
              </div>

              {/* RADIOS RÉGIONALES SNRT */}
              <div>
                <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-primary-dark/70" style={{ fontFamily: 'var(--font-meta)' }}>
                  {language === 'AR' ? 'إذاعات جهوية' : 'Radios régionales'}
                </h2>
                <div className="rounded-2xl border border-primary-sage/60 bg-gradient-to-r from-teal-50/40 via-white to-blue-50/40 p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                        <RadioIcon size={24} />
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800">
                          📍 {language === 'AR' ? 'شبكة جهوية' : 'Réseau régional'}
                        </span>
                        <h3 className="mt-1 text-base font-bold text-primary-dark">
                          {language === 'AR' ? 'الإذاعات الجهوية SNRT' : 'Radios régionales SNRT'}
                        </h3>
                        <p className="mt-1 text-xs text-primary-dark/70">
                          {radioStations.regional.label}
                        </p>
                      </div>
                    </div>
                    <a
                      href={radioStations.regional.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-dark px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-accent"
                    >
                      <Play size={13} fill="currentColor" />
                      {language === 'AR' ? 'الوصول إلى البث الجهوي' : 'Accéder au direct régional'}
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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