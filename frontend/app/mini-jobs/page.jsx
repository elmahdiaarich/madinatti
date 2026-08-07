'use client';
import { useState, useEffect , Suspense} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Wrench, ClipboardList, Search, Plus, UserPlus, SlidersHorizontal } from 'lucide-react';
import { workerProfilesService } from '../../services/WorkerProfilesService';
import { taskRequestsService } from '../../services/TaskRequestsService';
import WorkerProfileCard from '@/components/mini-jobs/WorkerProfileCard';
import WorkerProfileFilter from '@/components/mini-jobs/WorkerProfileFilter';
import TaskRequestCard from '@/components/mini-jobs/TaskRequestCard';
import TaskRequestFilter from '@/components/mini-jobs/TaskRequestFilter';
import InlineRegisterSection from '@/components/mini-jobs/InlineRegisterSection';
import LoadingSpinner from "@/components/shared/LoadingSpinner";



// Mirrors EMPLOI_SIBLINGS in app/jobs/page.jsx — same sibling group, viewed
// from the Mini-jobs side, so navigation feels consistent in both directions.
const EMPLOI_SIBLINGS = [
  { label: "Offres d'emploi", href: '/jobs' },
  { label: 'Mini-jobs', href: '/mini-jobs' },
];
const PROFILE_SORT_OPTIONS = [
  { value: '', label: 'Pertinence' },
  { value: 'rate_asc', label: 'Prix croissant' },
  { value: 'rate_desc', label: 'Prix décroissant' },
  { value: 'rating_desc', label: 'Mieux notés' },
  { value: 'recent', label: 'Plus récents' },
];

// Clés techniques à exclure du comptage des filtres actifs (pagination, pas des filtres)
const NON_FILTER_KEYS = ['page', 'limit', 'sort'];

function Pagination({ pagination, onPageChange }) {
  return (
    <div className="flex justify-center gap-1.5 mt-8">
      {[...Array(pagination.totalPages)].map((_, i) => (
        <button key={i} onClick={() => onPageChange(i + 1)}
          className={`w-9 h-9 rounded-full text-sm font-medium transition ${
            pagination.page === i + 1
              ? 'bg-primary text-white shadow-sm'
              : 'bg-white text-primary-dark border border-gray-200 hover:border-primary hover:bg-primary-mint'
          }`}>
          {i + 1}
        </button>
      ))}
    </div>
  );
}

function SortSelect({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-600 bg-white outline-none focus:border-primary hover:border-primary/50 transition"
    >
      {PROFILE_SORT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
      <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary-mint flex items-center justify-center">
        <Icon size={24} className="text-primary-dark" />
      </div>
      <p className="text-base font-semibold text-gray-700">{text}</p>
    </div>
  );
}

// ─── MOBILE FILTER SHEET (même pattern que jobs/page.jsx) ─────────────────────
function MobileFilterSheet({ title, resultsCount, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Feuille glissante */}
      <div className="absolute left-0 right-0 bottom-0 bg-gray-50 rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
        {/* Poignée + header */}
        <div className="shrink-0 bg-white rounded-t-2xl px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="w-9 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <span className="font-bold text-primary-dark text-sm">{title}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenu filtres (réutilise WorkerProfileFilter / TaskRequestFilter tel quel) */}
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {children}
        </div>

        {/* CTA de validation */}
        <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-3">
          <button
            onClick={onClose}
            className="w-full py-3 bg-primary-dark text-white rounded-full font-bold text-sm hover:bg-primary hover:text-primary-dark transition"
          >
            Voir {resultsCount != null ? resultsCount : ''} résultats
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniJobs() {
  const { user, token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // The active tab lives in the URL (?tab=profiles|tasks), not just in
  // local state. Reason: navigating to a task/profile detail page unmounts
  // this page; without the URL as the source of truth, clicking "Retour"
  // always landed back on the "profiles" tab regardless of where the user
  // actually was, since local state resets on remount.
  const tabFromUrl = searchParams.get('tab') === 'tasks' ? 'tasks' : 'profiles';
  const [tab, setTabState] = useState(tabFromUrl);

  useEffect(() => {
    setTabState(tabFromUrl);
  }, [tabFromUrl]);

  const setTab = (nextTab) => {
    router.replace(`/mini-jobs?tab=${nextTab}`, { scroll: false });
  };

  const [profiles, setProfiles] = useState([]);
  const [profileFilters, setProfileFilters] = useState({ page: 1, limit: 8 });
  const [profilePagination, setProfilePagination] = useState(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);

  const [tasks, setTasks] = useState([]);
  const [taskFilters, setTaskFilters] = useState({ page: 1, limit: 9 });
  const [taskPagination, setTaskPagination] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (tab !== 'profiles') return;
    setLoadingProfiles(true);
    workerProfilesService.searchWorkerProfiles(profileFilters)
      .then((res) => {
        const data = res.data ?? res;
        setProfiles(data.items ?? []);
        setProfilePagination({ page: data.page, totalPages: data.totalPages, total: data.total });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingProfiles(false));
  }, [tab, profileFilters]);

  useEffect(() => {
    if (tab !== 'tasks') return;
    setLoadingTasks(true);
    taskRequestsService.searchTaskRequests(taskFilters, token)
      .then((res) => {
        const data = res.data ?? res;
        setTasks(data.items ?? []);
        setTaskPagination({ page: data.page, totalPages: data.totalPages, total: data.total });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingTasks(false));
  }, [tab, taskFilters, token]);

 const isVisitor = !user;
  const userRole = user?.role;
  const canActOnMiniJobs = !user || userRole === 'citizen'; // hide for business/admin

  // Compte approximatif des filtres actifs pour le badge du bouton mobile,
  // selon l'onglet courant (hypothèse à valider si le comptage semble faux)
  const activeFiltersCount = (tab === 'profiles' ? profileFilters : taskFilters)
    && Object.keys(tab === 'profiles' ? profileFilters : taskFilters)
      .filter((k) => !NON_FILTER_KEYS.includes(k) && (tab === 'profiles' ? profileFilters : taskFilters)[k])
      .length;

  const scrollToRegister = () => {
    const el = document.getElementById('inscription');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePublishTask = () => {
    if (!user) { scrollToRegister(); return; }
    router.push('/mini-jobs/tasks/create');
  };

  const handleCreateProfile = () => {
    if (!user) { scrollToRegister(); return; }
    router.push('/my-space/worker-profiles/create');
  };

  const handleSortChange = (sort) => {
    setProfileFilters((f) => ({ ...f, sort: sort || undefined, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-[1200px] mx-auto px-4">

          {/* Sibling navigation — jump to related Emploi sub-pages */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {EMPLOI_SIBLINGS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  s.href === '/mini-jobs'
                    ? 'bg-primary-dark text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-dark hover:text-primary-dark'
                }`}
              >
                {s.label}
              </a>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-center text-primary-dark mb-2">Mini-jobs</h1>
          <p className="text-center text-gray-500 text-sm mb-7">
            Trouvez un prestataire de confiance ou publiez votre demande
          </p>

          <div className="flex justify-center">
            <div className="grid grid-cols-2 sm:inline-flex sm:items-center w-full sm:w-auto bg-gray-100 rounded-full p-1 gap-1">
              <button onClick={() => setTab('profiles')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all leading-tight
                  ${tab === 'profiles' ? 'bg-white text-primary-dark shadow-sm' : 'text-gray-500 hover:text-primary-dark'}`}>
                <Wrench size={15} className="shrink-0" />
                <span className="sm:hidden">Prestataire</span>
                <span className="hidden sm:inline">Trouver un prestataire</span>
              </button>
              <button onClick={() => setTab('tasks')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all leading-tight
                  ${tab === 'tasks' ? 'bg-white text-primary-dark shadow-sm' : 'text-gray-500 hover:text-primary-dark'}`}>
                <ClipboardList size={15} className="shrink-0" />
                <span className="sm:hidden">Tâches</span>
                <span className="hidden sm:inline">Demandes de tâches</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar desktop uniquement ; sur mobile/tablette, bouton "Filtrer" + bottom sheet */}
      <div className="max-w-[1200px] mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <aside className="hidden lg:block lg:w-[280px] shrink-0">
          <div className="lg:sticky lg:top-[20px]">
            {tab === 'profiles' ? (
              <WorkerProfileFilter onFilter={(f) => setProfileFilters({ ...f, page: 1, limit: 8 })} />
            ) : (
              <TaskRequestFilter onFilter={(f) => setTaskFilters({ ...f, page: 1, limit: 9 })} />
            )}
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {tab === 'profiles' && (
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <p className="text-sm text-gray-500">
                {profilePagination ? <><span className="font-semibold text-gray-800">{profilePagination.total}</span> prestataires</> : '...'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Bouton filtres — mobile/tablette uniquement */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 border border-primary-dark text-primary-dark font-semibold text-xs px-3.5 py-2 rounded-full shrink-0 hover:bg-primary-mint transition-colors"
                >
                  <SlidersHorizontal size={13} />
                  Filtrer
                  {activeFiltersCount > 0 && (
                    <span className="bg-primary text-primary-dark text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                <SortSelect value={profileFilters.sort || ''} onChange={handleSortChange} />
                {canActOnMiniJobs && (
                  <button onClick={handleCreateProfile}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-dark text-white font-bold text-sm shadow-sm hover:bg-primary hover:text-primary-dark transition-all">
                    <UserPlus size={15} />
                    Devenir prestataire
                  </button>
                )}
              </div>
            </div>
          )}

         {tab === 'tasks' && (
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <p className="text-sm text-gray-500">
                {taskPagination ? <><span className="font-semibold text-gray-800">{taskPagination.total}</span> demandes</> : '...'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Bouton filtres — mobile/tablette uniquement */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 border border-primary-dark text-primary-dark font-semibold text-xs px-3.5 py-2 rounded-full shrink-0 hover:bg-primary-mint transition-colors"
                >
                  <SlidersHorizontal size={13} />
                  Filtrer
                  {activeFiltersCount > 0 && (
                    <span className="bg-primary text-primary-dark text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>
                {canActOnMiniJobs && (
                  <button onClick={handlePublishTask}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-dark text-white font-bold text-sm shadow-sm hover:bg-primary hover:text-primary-dark transition-all">
                    <Plus size={15} />
                    Publier une demande
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'profiles' && (
            loadingProfiles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-32" />
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <EmptyState icon={Search} text="Aucun prestataire trouvé" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                {profiles.map((p) => <WorkerProfileCard key={p.id} profile={p} />)}
              </div>
            )
          )}

          {tab === 'tasks' && (
            loadingTasks ? (
              <div className="flex flex-col gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse h-28" />
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <EmptyState icon={ClipboardList} text="Aucune demande pour le moment" />
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map((t) => <TaskRequestCard key={t.id} task={t} />)}
              </div>
            )
          )}

          {tab === 'profiles' && profilePagination?.totalPages > 1 && (
            <Pagination pagination={profilePagination} onPageChange={(p) => setProfileFilters((f) => ({ ...f, page: p }))} />
          )}
          {tab === 'tasks' && taskPagination?.totalPages > 1 && (
            <Pagination pagination={taskPagination} onPageChange={(p) => setTaskFilters((f) => ({ ...f, page: p }))} />
          )}
  </main>
      </div>

      {/* MOBILE FILTER SHEET */}
      {mobileFiltersOpen && (
        <MobileFilterSheet
          title={tab === 'profiles' ? 'Filtrer les prestataires' : 'Filtrer les demandes'}
          resultsCount={tab === 'profiles' ? profilePagination?.total : taskPagination?.total}
          onClose={() => setMobileFiltersOpen(false)}
        >
          {tab === 'profiles' ? (
            <WorkerProfileFilter onFilter={(f) => setProfileFilters({ ...f, page: 1, limit: 8 })} />
          ) : (
            <TaskRequestFilter onFilter={(f) => setTaskFilters({ ...f, page: 1, limit: 9 })} />
          )}
        </MobileFilterSheet>
      )}

      {isVisitor && (
        <div id="inscription" className="max-w-[1200px] mx-auto px-4 py-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#A7D129]/40 to-[#A7D129]/40" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#7BA428]">
              Rejoignez Madinatti
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#A7D129]/40 to-[#A7D129]/40" />
          </div>
          <InlineRegisterSection />
        </div>
      )}
    </div>
  );
}

export default function MiniJobsPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Chargement…" />}>
      <MiniJobs />
    </Suspense>
  );
}