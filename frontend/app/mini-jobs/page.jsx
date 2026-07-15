'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Wrench, ClipboardList, Search, Plus, UserPlus } from 'lucide-react';
import { workerProfilesService } from '../../services/WorkerProfilesService';
import { taskRequestsService } from '../../services/TaskRequestsService';
import WorkerProfileCard from '@/components/mini-jobs/WorkerProfileCard';
import WorkerProfileFilter from '@/components/mini-jobs/WorkerProfileFilter';
import TaskRequestCard from '@/components/mini-jobs/TaskRequestCard';
import TaskRequestFilter from '@/components/mini-jobs/TaskRequestFilter';
import InlineRegisterSection from '@/components/mini-jobs/InlineRegisterSection';

// Mirrors EMPLOI_SIBLINGS in app/jobs/page.jsx — same sibling group, viewed
// from the Mini-jobs side, so navigation feels consistent in both directions.
const EMPLOI_SIBLINGS = [
  { label: "Offres d'emploi", href: '/jobs' },
  { label: 'Formation', href: '/coming-soon?feature=Formation' },
  { label: 'Mini-jobs', href: '/mini-jobs' },
  { label: 'Accompagnement', href: '/coming-soon?feature=Accompagnement' },
  { label: "Demande d'emploi", href: '/coming-soon?feature=Demande d\'emploi' },
];
const PROFILE_SORT_OPTIONS = [
  { value: '', label: 'Pertinence' },
  { value: 'rate_asc', label: 'Prix croissant' },
  { value: 'rate_desc', label: 'Prix décroissant' },
  { value: 'rating_desc', label: 'Mieux notés' },
  { value: 'recent', label: 'Plus récents' },
];

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

export default function MiniJobsPage() {
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
         <div className="flex flex-wrap justify-center gap-2 mb-6">
            {EMPLOI_SIBLINGS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  s.href === '/mini-jobs'
                    ? 'bg-primary-dark text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary-dark'
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
            <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1">
              <button onClick={() => setTab('profiles')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all
                  ${tab === 'profiles' ? 'bg-white text-primary-dark shadow-sm' : 'text-gray-500 hover:text-primary-dark'}`}>
                <Wrench size={15} />
                Trouver un prestataire
              </button>
              <button onClick={() => setTab('tasks')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all
                  ${tab === 'tasks' ? 'bg-white text-primary-dark shadow-sm' : 'text-gray-500 hover:text-primary-dark'}`}>
                <ClipboardList size={15} />
                Demandes de tâches
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stack sidebar above results on mobile; side-by-side from lg up */}
      <div className="max-w-[1200px] mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <aside className="w-full lg:w-[280px] shrink-0">
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
              <div className="flex items-center gap-2">
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
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {taskPagination ? <><span className="font-semibold text-gray-800">{taskPagination.total}</span> demandes</> : '...'}
              </p>
              {canActOnMiniJobs && (
                <button onClick={handlePublishTask}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary-dark text-white font-bold text-sm shadow-sm hover:bg-primary hover:text-primary-dark transition-all">
                  <Plus size={15} />
                  Publier une demande
                </button>
              )}
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