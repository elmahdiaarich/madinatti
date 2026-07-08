// frontend/app/explore/tourism/page.jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { tourismService } from "@/services/tourismService";
import { TOURISM_CATEGORIES } from "@/constants/tourismCategories";
import CategoryChips from "@/components/explore/CategoryChips";
import FilterBar from "@/components/explore/FilterBar";
import PlaceCard from "@/components/explore/PlaceCard";
import TourismMap from "@/components/explore/TourismMap";

export default function TourismExplorerPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [filters, setFilters] = useState({});
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const PAGE_SIZE = 20;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        ...(activeCategory !== "all" && { category: activeCategory }),
        ...(search.trim() && { search: search.trim() }),
        ...filters,
        page,
        limit: PAGE_SIZE,
      };
      const response = await tourismService.getAll(query);
      setListings(response.data || []);
      setPagination(
        response.pagination || { page: 1, totalPages: 1, total: response.data?.length || 0 }
      );
    } catch (err) {
      console.error("Failed to load tourism listings", err);
      setError("Impossible de charger les lieux pour le moment.");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, search, filters, page]);

  useEffect(() => {
    // Debounce so typing in the search box doesn't fire a request per key.
    const t = setTimeout(fetchListings, 300);
    return () => clearTimeout(t);
  }, [fetchListings]);

  // Any change to search/category/filters should reset back to page 1,
  // otherwise you can get stuck on a page that no longer has results.
  useEffect(() => {
    setPage(1);
  }, [activeCategory, search, filters]);

  const handleCategoryChange = (slug) => {
    setActiveCategory(slug);
    setFilters({});
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header + controls: fixed height, full width */}
      <div className="shrink-0 border-b border-black/10 px-4 py-4 sm:px-6 lg:px-8">
        <div className="mb-1">
          <h1 className="text-2xl font-bold text-black">Explorer Kénitra</h1>
          <p className="text-sm text-black/60">
            Hôtels, restaurants, plages, musées et plus encore autour de vous.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un lieu, une activité…"
              className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-3 text-sm text-black focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <CategoryChips active={activeCategory} onChange={handleCategoryChange} />
        </div>

        <div className="mt-3">
          <FilterBar activeCategory={activeCategory} filters={filters} onChange={setFilters} />
        </div>
      </div>

      {/* Body: listings scroll on the left, map fills the rest of the
          viewport width and height so it's actually usable. */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="order-2 min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:order-1 lg:w-[45%] lg:flex-none lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-16 text-black/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement des lieux…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 py-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-black/10 bg-white py-16 text-center">
              <p className="text-sm text-black/50">Aucun résultat pour ce filtre.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {listings.map((item) => (
                  <PlaceCard
                    key={item.id}
                    item={item}
                    categoryConfig={TOURISM_CATEGORIES[item.category]}
                  />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm text-black/70 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Précédent
                  </button>

                  <span className="text-xs text-black/50">
                    Page {pagination.page} / {pagination.totalPages} · {pagination.total} lieux
                  </span>

                  <button
                    type="button"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm text-black/70 disabled:opacity-40"
                  >
                    Suivant
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="order-1 h-[45vh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <TourismMap listings={listings} />
        </div>
      </div>
    </div>
  );
}