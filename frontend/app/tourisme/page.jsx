// frontend/app/tourisme/page.jsx
"use client";

import { useEffect, useState, useCallback, useMemo, useRef , Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CATEGORY_LIST } from "@/constants/tourismCategories";
import { Loader2 } from "lucide-react";
import { tourismService } from "@/services/tourismService";
import { TOURISM_CATEGORIES } from "@/constants/tourismCategories";
import CategoryDropdown from "@/components/explore/CategoryDropdown";
import FilterBar, { normalizeCityKey } from "@/components/explore/FilterBar";
import PlaceCard from "@/components/explore/PlaceCard";
import TourismMap from "@/components/explore/TourismMap";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const PAGE_SIZE = 20;
// How many listings to sample (unfiltered by location) to build the
// city -> neighborhoods lookup for the filter dropdowns. morocco-cities
// only ships city/region names, not neighborhoods, so those have to come
// from your own data.
const NEIGHBORHOOD_SAMPLE_SIZE = 500;

// Fixed map height on mobile (stacked layout). On desktop the map instead
// fills the full height of the row (see MAP_DESKTOP_CLASSES below), so this
// constant only matters below the `lg` breakpoint.
const MAP_MOBILE_HEIGHT_CLASS = "h-64";

// Builds a windowed page list with ellipses, e.g. [1, "...", 4, 5, 6, "...", 42]
// so the sidebar's pagination bar stays usable even with hundreds of pages.
function buildPageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const withEllipses = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) withEllipses.push("...");
    withEllipses.push(p);
  });
  return withEllipses;
}
 function TourismExplorer() {
  const searchParams = useSearchParams();
  const router = useRouter();
const [activeCategory, setActiveCategory] = useState(() => {
  const label = searchParams.get("category");
  const match = CATEGORY_LIST.find((c) => c.label === label);
  return match ? match.slug : "all";
});
  const [filters, setFilters] = useState(() => {
    const city = searchParams.get("city") || "";
    const region = searchParams.get("region") || "";
    const search = searchParams.get("search") || "";
    return {
      ...(city && { city }),
      ...(region && { region }),
      ...(search && { search }),
    };
  });
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,

  });
  const [neighborhoodsByCity, setNeighborhoodsByCity] = useState({});
  const listingsRef = useRef(null);

useEffect(() => {
  const el = listingsRef.current;
  if (!el) return;

  const handleWheel = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atTop = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

    // If we're at an edge and still trying to scroll further in that
    // direction, don't let the browser get stuck waiting for a mousemove
    // to re-target — just let the event pass through naturally without
    // manually scrolling (prevents the Chromium trackpad lock bug).
    if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
      return;
    }

    e.preventDefault();
    el.scrollTop += e.deltaY;
  };

  el.addEventListener("wheel", handleWheel, { passive: false });
  return () => el.removeEventListener("wheel", handleWheel);
}, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        ...(activeCategory !== "all" && { categorySlug: activeCategory }),
        ...filters,
        page,
        limit: PAGE_SIZE,
      };
      const response = await tourismService.getAll(query);
      setListings(response.data || []);
      setPagination(
        response.pagination || {
          page: 1,
          totalPages: 1,
          total: response.data?.length || 0,
        },
      );
    } catch (err) {
      console.error("Failed to load tourism listings", err);
      setError("Impossible de charger les lieux pour le moment.");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, filters, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Reset to page 1 whenever filters/category change.
  useEffect(() => {
    setPage(1);
  }, [activeCategory, filters]);

  // Build the city -> neighborhoods lookup once on mount, from a sample of
  // listings (not the current filtered/paginated set). Keyed by a
  // normalized (accent/case-insensitive) city string so it matches
  // whatever spelling the "Ville" dropdown uses.
    // Fetch distinct neighborhoods from the backend
  useEffect(() => {
    tourismService
      .getNeighborhoods()
      .then((response) => {
        const map = {};
        Object.entries(response.data || {}).forEach(([city, neighborhoods]) => {
          map[normalizeCityKey(city)] = neighborhoods;
        });
        setNeighborhoodsByCity(map);
      })
      .catch((err) =>
        console.error("Failed to load neighborhood options", err),
      );
  }, []);

  const handleCategoryChange = (slug) => {
    setActiveCategory(slug);
    setFilters({});
  };

  const handlePageChange = (next) => {
    if (next < 1 || next > pagination.totalPages || next === page) return;
    setPage(next);
  };

  const pageWindow = useMemo(
    () => buildPageWindow(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages],
  );

  return (
    <div className="flex h-[95vh] min-h-[640px] flex-col overflow-hidden bg-white lg:flex-row">
      {/*
        Map.
        Mobile (below lg): shown FIRST (`order-1`), fixed height
        (MAP_MOBILE_HEIGHT_CLASS), and `sticky top-0` so it stays pinned in
        place while the listings panel below scrolls underneath it.
        Desktop (lg+): becomes the right-hand sidebar (`lg:order-2`), takes
        the full row height, and drops the mobile-only sticky/height rules.
      */}
      <div
        className={`order-1 sticky top-0 z-10 w-full shrink-0 ${MAP_MOBILE_HEIGHT_CLASS} lg:order-2 lg:sticky-none lg:static lg:h-auto lg:w-full lg:max-w-[50%] lg:border-l lg:border-black/[0.06]`}
      >
        <TourismMap listings={listings} />
      </div>

      {/* Left: compact header+filters row, scrollable listings in the
          middle, and pagination pinned as a footer at the bottom. */}
      <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col lg:order-1 lg:min-w-[420px]">
        {/* Header + filters combined into one compact strip */}
        <div className="shrink-0 border-b border-black/[0.06] px-6 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="text-base font-bold text-black">Explorer Kénitra</h1>
            <p className="text-xs text-black/40">
              Hôtels, restaurants, plages, musées et plus encore.
            </p>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <CategoryDropdown
              active={activeCategory}
              onChange={handleCategoryChange}
              width="w-52"
            />
            <FilterBar
              filters={filters}
              onChange={setFilters}
              neighborhoodsByCity={neighborhoodsByCity}
            />
          </div>
        </div>

        {/* Results — this is the ONLY part that scrolls. */}
<div
  ref={listingsRef}
  className="min-h-0 flex-1 overflow-y-auto overscroll-auto px-6 py-5"
>          {!loading && !error && listings.length > 0 && (
            <p className="mb-3 text-sm text-black/40">
              <span className="font-semibold text-black/70">
                {pagination.total}
              </span>{" "}
              lieu
              {pagination.total > 1 ? "x" : ""} trouvé
              {pagination.total > 1 ? "s" : ""}
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-black/40">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 py-10 text-center text-sm text-red-600">
              {error}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-black/10 py-16 text-center">
              <p className="text-sm text-black/40">
                Aucun résultat pour ce filtre.
              </p>
            </div>
          ) : (
<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">              {listings.map((item) => (
                <PlaceCard
                  key={item.id}
                  item={item}
                  categoryConfig={TOURISM_CATEGORIES[item.category]}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination — pinned footer, outside the scroll area, so it never
            scrolls away with the listings above it. */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="shrink-0 border-t border-black/[0.06] px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-sm text-black/50 transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ‹
              </button>

              {pageWindow.map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="w-9 text-center text-sm text-black/30">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition ${
                      pagination.page === p
                        ? "bg-[var(--color-primary-dark)] text-white shadow-sm"
                        : "border border-black/10 bg-white text-[var(--color-primary-dark)] hover:border-[var(--color-primary)]"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-sm text-black/50 transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TourismExplorerPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Chargement…" />}>
      <TourismExplorer />
    </Suspense>
  );
}