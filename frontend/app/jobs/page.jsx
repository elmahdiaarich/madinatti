'use client';

import { useEffect, useState } from 'react';
import { jobsService } from '@/services/jobsService';
import JobCard from '@/components/jobs/JobCard';
import JobFilter from '@/components/jobs/JobFilter';

const CATEGORIES = [
  { label: 'Tous', categoryId: null },
  { label: 'Informatique', categoryId: 'informatique' },
  { label: 'Marketing', categoryId: 'marketing' },
  { label: 'Finance', categoryId: 'finance' },
  { label: 'RH', categoryId: 'rh' },
  { label: 'BTP', categoryId: 'btp' },
  { label: 'Vente', categoryId: 'vente' },
  { label: 'Santé', categoryId: 'sante' },
  { label: 'Logistique', categoryId: 'logistique' },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ page: 1, limit: 9 });
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const res = await jobsService.getJobs(filters);
        setJobs(res.data);
        setPagination(res.pagination);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [filters]);

const handleFilter = (newFilters) => {
  if (Object.keys(newFilters).length === 0) {
    setFilters({ page: 1, limit: 9 }); // 👈 reset total
    return;
  }
  setFilters((prev) => {
    const merged = { ...prev, ...newFilters, page: 1 };
    Object.keys(merged).forEach((k) => {
      if (merged[k] === undefined) delete merged[k];
    });
    return merged;
  });
};
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

const handleCategoryTab = (cat) => {
  setActiveCategory(cat.categoryId);
  setFilters({
    page: 1,
    limit: 9,
    ...(cat.categoryId && { categorySlug: cat.categoryId }), // 👈 slug propre
  });
};

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HERO HEADER */}
      <div className="bg-white border-b border-gray-200 py-10">
        <div className="max-w-[1200px] mx-auto px-4">
          <h1 className="text-3xl font-bold text-center text-[#2D5016] mb-2">
            Trouvez votre prochain emploi
          </h1>
          <p className="text-center text-gray-500 text-sm mb-6">
            {pagination ? `${pagination.total} offres disponibles au Maroc` : 'Chargement...'}
          </p>

          {/* Search bar */}
          <div className="flex items-center max-w-2xl mx-auto border-2 border-[#2D5016] rounded-full px-4 py-2.5 bg-white shadow-sm">
            <svg className="w-4 h-4 text-gray-400 shrink-0 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Titre, entreprise, mot-clé..."
              value={searchInput}
              className="flex-1 outline-none text-sm text-gray-700 bg-transparent"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="ml-2 px-4 py-1.5 rounded-full bg-[#A7D129] text-white text-sm font-medium hover:bg-[#7BA428] transition"
            >
              Rechercher
            </button>
          </div>
        </div>
      </div>

      {/* CATEGORY TABS */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 py-2.5 flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategoryTab(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150
                ${activeCategory === cat.categoryId
                  ? 'bg-[#2D5016] text-white shadow-sm'
                  : 'bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129] hover:text-white'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-[1200px] mx-auto px-4 py-6 flex gap-6">

        {/* SIDEBAR */}
   
<aside className="w-[260px] shrink-0">
  <div className="sticky top-[52px] overflow-y-auto max-h-[calc(100vh-52px)]">
    <JobFilter onFilter={handleFilter} />
  </div>
</aside>

        {/* JOBS LIST */}
        <main className="flex-1 min-w-0">
          {/* Results count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {pagination
                ? <><span className="font-semibold text-gray-800">{pagination.total}</span> offres trouvées</>
                : <span className="animate-pulse bg-gray-200 rounded w-24 h-4 inline-block" />
              }
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-2/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="flex gap-2 mt-3">
                        <div className="h-6 bg-gray-100 rounded-full w-16" />
                        <div className="h-6 bg-gray-100 rounded-full w-24" />
                        <div className="h-6 bg-gray-100 rounded-full w-20" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-lg font-semibold text-gray-700">Aucune offre trouvée</p>
              <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-1.5 mt-8">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ‹
              </button>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-9 h-9 rounded-full text-sm font-medium transition ${
                    pagination.page === i + 1
                      ? 'bg-[#A7D129] text-white shadow-sm'
                      : 'bg-white text-[#2D5016] border border-gray-200 hover:border-[#A7D129] hover:bg-[#E8F5D0]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="w-9 h-9 rounded-full border border-gray-200 text-gray-500 text-sm flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                ›
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}