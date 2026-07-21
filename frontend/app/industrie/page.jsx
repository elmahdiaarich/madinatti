// frontend/app/industrie/page.jsx
"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { industrielZonesService } from "@/services/industrielZonesService";
import { categoriesService } from "@/services/categoriesService";
import SearchableDropdown from "@/components/explore/SearchableDropdown";
import TourismMap from "@/components/explore/TourismMap";
import { cities as MOROCCO_CITIES_RAW } from "morocco-cities";
import LoadingSpinner from "@/components/shared/LoadingSpinner";


const PAGE_SIZE = 12;
const ALL_CITIES = MOROCCO_CITIES_RAW.map((c) => ({ name: c.name, region: c.region_name }));
const REGIONS = [...new Set(ALL_CITIES.map((c) => c.region))].sort((a, b) => a.localeCompare(b));

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

function IndustrielCard({ item, basePath = "/industrie" }) {
  const cover = item.images?.find((img) => img.isCover)?.url || item.images?.[0]?.url;
  const location = [item.neighborhood, item.city].filter(Boolean).join(" - ");

  return (
    <Link
      href={`${basePath}/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#2D5016] hover:shadow-md"
    >
      <div className="relative h-44 w-full bg-gray-100">
        {cover ? (
          <img
            src={cover}
            alt={item.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            Aucune photo
          </div>
        )}
        {item.isFeatured && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white shadow">
            Recommandé
          </span>
        )}
        {item.category?.name && (
          <span className="absolute bottom-2.5 right-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white">
            {item.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="font-semibold leading-snug text-black line-clamp-1 group-hover:text-[#2D5016] transition-colors">
          {item.name}
        </p>
        {location && (
          <p className="flex items-center gap-1.5 text-xs text-black/55">
            <MapPin size={13} className="shrink-0 text-gray-400" />
            {location}
          </p>
        )}
        {item.attributes?.secteurs?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.attributes.secteurs.slice(0, 3).map((s, i) => (
              <span key={s + i} className="px-2 py-0.5 bg-[#E8F5D0] text-[#2D5016] rounded text-[10px] font-medium">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function IndustrieExplorer() {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  
  const [selectedRegion, setSelectedRegion] = useState(() => searchParams.get("region") || "");
  const [selectedCity, setSelectedCity] = useState(() => searchParams.get("city") || "");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("search") || "");
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const listingsRef = useRef(null);

  useEffect(() => {
  const el = listingsRef.current;
  if (!el) return;

  const handleWheel = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = el;
    const atTop = scrollTop <= 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

    if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
      return;
    }

    e.preventDefault();
    el.scrollTop += e.deltaY;
  };

  el.addEventListener("wheel", handleWheel, { passive: false });
  return () => el.removeEventListener("wheel", handleWheel);
}, []);

  const citiesInRegion = useMemo(() => {
    return selectedRegion
      ? ALL_CITIES.filter((c) => c.region === selectedRegion).map((c) => c.name).sort((a, b) => a.localeCompare(b))
      : ALL_CITIES.map((c) => c.name).sort((a, b) => a.localeCompare(b));
  }, [selectedRegion]);

  useEffect(() => {
    categoriesService.getByModule("espaces-pro")
      .then((res) => {
        const cats = res.data || [];
        setCategories(cats);
        
        const catSlug = searchParams.get("categorySlug") || searchParams.get("categoryId");
        const catLabel = searchParams.get("category");
        if (catSlug) {
          const match = cats.find((c) => c.slug === catSlug || c.id === catSlug);
          if (match) setActiveCategory(match.slug);
        } else if (catLabel) {
          const match = cats.find((c) => c.name.toLowerCase() === catLabel.toLowerCase());
          if (match) setActiveCategory(match.slug);
        }
      })
      .catch((err) => console.error("Failed to load categories", err));
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const query = {
        categorySlug: activeCategory !== "all" ? activeCategory : undefined,
        city: selectedCity || undefined,
        region: selectedRegion || undefined,
        search: searchQuery.trim() || undefined,
        page,
        limit: PAGE_SIZE,
      };
      const response = await industrielZonesService.getAll(query);
      setListings(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to fetch space listings", err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, selectedCity, selectedRegion, searchQuery, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, selectedCity, selectedRegion, searchQuery]);

  const pageWindow = useMemo(() => buildPageWindow(page, totalPages), [page, totalPages]);

  return (
    <div className="flex h-[95vh] min-h-[640px] flex-col overflow-hidden bg-white lg:flex-row">
      <div className="order-1 sticky top-0 z-10 w-full shrink-0 h-64 lg:order-2 lg:sticky-none lg:static lg:h-auto lg:w-full lg:max-w-[50%] lg:border-l lg:border-black/[0.06]">
        <TourismMap listings={listings} basePath="/industrie" />
      </div>

      <div className="order-2 flex min-h-0 min-w-0 flex-1 flex-col lg:order-1 lg:min-w-[420px]">
        <div className="shrink-0 border-b border-black/[0.06] px-6 py-3 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="text-base font-bold text-black">Zones Industrielles</h1>
            <p className="text-xs text-black/40">Free Zone, CCI, Import-Export et Parcs Industriels.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:border-[#2D5016] text-gray-700 bg-gray-50 focus:bg-white transition-all"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            </div>

            <SearchableDropdown
              label="Catégorie"
              value={activeCategory}
              options={[{ value: "all", label: "Toutes catégories" }, ...categories.map((c) => ({ value: c.slug, label: c.name }))]}
              onSelect={(v) => setActiveCategory(v || "all")}
              width="w-full text-xs"
            />

            <SearchableDropdown
              label="Région"
              value={selectedRegion}
              options={REGIONS}
              onSelect={(v) => { setSelectedRegion(v || ""); setSelectedCity(""); }}
              emptyLabel="Toutes les régions"
              placeholder="Chercher une région..."
              width="w-full text-xs"
            />

            <SearchableDropdown
              label="Ville"
              value={selectedCity}
              options={citiesInRegion}
              onSelect={(v) => setSelectedCity(v || "")}
              disabled={!selectedRegion}
              emptyLabel="Toutes les villes"
              placeholder={selectedRegion ? "Chercher une ville..." : "Choisir région d'abord"}
              width="w-full text-xs"
            />
          </div>
        </div>

        <div ref={listingsRef} className="min-h-0 flex-1 overflow-y-auto overscroll-auto px-6 py-5">
          {!loading && listings.length > 0 && (
            <p className="mb-3 text-sm text-black/40">
              <span className="font-semibold text-black/70">{totalItems}</span> espace{totalItems > 1 ? "s" : ""} trouvé{totalItems > 1 ? "s" : ""}
            </p>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-black/40">
              <Loader2 className="h-4 w-4 animate-spin text-[#2D5016]" /> Chargement…
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-black/10 py-16 text-center text-sm text-black/40">
              Aucun espace industriel ne correspond à vos filtres.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
              {listings.map((item) => (
                <IndustrielCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {!loading && totalPages > 1 && (
          <div className="shrink-0 border-t border-black/[0.06] px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-sm text-black/50 transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ‹
              </button>
              {pageWindow.map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="w-9 text-center text-sm text-black/30">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition ${
                      page === p
                        ? "bg-[#2D5016] text-white shadow-sm"
                        : "border border-black/10 bg-white text-[#2D5016] hover:border-[#2D5016]"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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
      <IndustrieExplorer />
    </Suspense>
  );
}