"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import EducationInstitutionCard from "@/components/education/EducationInstitutionCard";
import EducationMap from "@/components/education/EducationMap";
import SearchableDropdown from "@/components/explore/SearchableDropdown";
import {
  EDUCATION_SECTORS,
  EDUCATION_TYPE_BY_SLUG,
  EDUCATION_TYPES,
  MOROCCO_CITIES,
  MOROCCO_REGIONS,
} from "@/constants/educationConstants";
import { educationService } from "@/services/educationService";

const PAGE_SIZE = 12;
const MAP_PAGE_SIZE = 100;
const MAP_MAX_PAGES = 8;

const TYPE_ROUTE_ALIASES = {
  ecoles: "PRIMARY_SCHOOL",
  universites: "UNIVERSITY",
};

const CITY_ROUTE_ALIASES = {
  kenitra: "K\u00e9nitra",
  fes: "F\u00e8s",
};

function titleCaseSlug(value) {
  const slug = String(value || "").toLowerCase();
  if (CITY_ROUTE_ALIASES[slug]) return CITY_ROUTE_ALIASES[slug];
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function paramsFromState(state) {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) params.set(key, String(value));
  });
  return params.toString();
}

function typeFromSlug(typeSlug) {
  return TYPE_ROUTE_ALIASES[typeSlug] || EDUCATION_TYPE_BY_SLUG[typeSlug]?.value || "";
}

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

async function fetchMapInstitutions(filters) {
  const firstPage = await educationService.searchInstitutions({ ...filters, page: 1, limit: MAP_PAGE_SIZE });
  const totalPages = Math.min(firstPage.pagination?.totalPages || 1, MAP_MAX_PAGES);
  if (totalPages <= 1) return firstPage.data || [];

  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      educationService.searchInstitutions({ ...filters, page: index + 2, limit: MAP_PAGE_SIZE }),
    ),
  );

  const seen = new Set();
  return [firstPage, ...rest].flatMap((response) => response.data || []).filter((item) => {
    const key = item.id || `${item.name}-${item.city}-${item.latitude}-${item.longitude}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function EducationDirectory({ initialCity = "", initialTypeSlug = "" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeCity = titleCaseSlug(initialCity);
  const routeType = typeFromSlug(initialTypeSlug);
  const listingsRef = useRef(null);
  const [filters, setFilters] = useState({
    search: searchParams.get("search") || "",
    region: searchParams.get("region") || "",
    province: searchParams.get("province") || "",
    city: searchParams.get("city") || routeCity || "",
    type: searchParams.get("type") || routeType || "",
    sector: searchParams.get("sector") || "",
    page: Number(searchParams.get("page") || 1),
    limit: PAGE_SIZE,
    sort: searchParams.get("sort") || "name",
    order: searchParams.get("order") || "asc",
  });
  const [institutions, setInstitutions] = useState([]);
  const [mapInstitutions, setMapInstitutions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const el = listingsRef.current;
    if (!el) return;

    const handleWheel = (event) => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const atTop = scrollTop <= 0;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1;
      if ((atTop && event.deltaY < 0) || (atBottom && event.deltaY > 0)) return;
      event.preventDefault();
      el.scrollTop += event.deltaY;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const provinces = useMemo(
    () => MOROCCO_REGIONS.find((region) => region.name === filters.region)?.provinces || [],
    [filters.region],
  );
  const cities = useMemo(
    () => provinces.find((province) => province.name === filters.province)?.cities || MOROCCO_CITIES,
    [filters.province, provinces],
  );
  const pageWindow = useMemo(() => buildPageWindow(filters.page, pagination.totalPages), [filters.page, pagination.totalPages]);

  const load = useCallback(async (next = filters, replaceUrl = true) => {
    setLoading(true);
    setError("");
    try {
      const [response, nextMapInstitutions] = await Promise.all([
        educationService.searchInstitutions(next),
        fetchMapInstitutions(next),
      ]);
      const nextInstitutions = response.data || [];
      setInstitutions(nextInstitutions);
      setMapInstitutions(nextMapInstitutions);
      setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
      setSelected(
        nextInstitutions.find((item) => item.latitude != null && item.longitude != null) ||
          nextMapInstitutions.find((item) => item.latitude != null && item.longitude != null) ||
          nextInstitutions[0] ||
          null,
      );
      if (replaceUrl && !initialCity && !initialTypeSlug) {
        const query = paramsFromState(next);
        router.replace(query ? `/education?${query}` : "/education", { scroll: false });
      }
    } catch (err) {
      setInstitutions([]);
      setMapInstitutions([]);
      setSelected(null);
      setError(err.response?.data?.message || "Impossible de charger les etablissements.");
    } finally {
      setLoading(false);
    }
  }, [filters, initialCity, initialTypeSlug, router]);

  useEffect(() => {
    const timer = setTimeout(() => load(filters, false), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || "", page: 1 }));
  };

  const setLocation = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  };

  const submit = (event) => {
    event.preventDefault();
    load(filters);
  };

  const goPage = (page) => {
    const next = { ...filters, page };
    setFilters(next);
    load(next);
  };

  return (
    <div className="flex h-[95vh] min-h-[640px] flex-col overflow-hidden bg-white lg:flex-row">
      <div className="order-1 sticky top-0 z-10 h-64 w-full shrink-0 bg-white p-3 lg:order-2 lg:static lg:h-auto lg:max-w-[50%] lg:border-l lg:border-black/[0.06]">
        <EducationMap institutions={mapInstitutions} selectedId={selected?.id} onSelect={setSelected} clusterThreshold={true} />
      </div>

      <section className="order-2 flex min-h-0 min-w-0 flex-1 flex-col lg:order-1 lg:min-w-[420px]">
        <div className="shrink-0 space-y-3 border-b border-black/[0.06] px-6 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="text-base font-bold text-black">Education au Maroc</h1>
            <p className="text-xs text-black/40">Ecoles, universites, instituts et centres de formation.</p>
          </div>

          <form onSubmit={submit} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="relative sm:col-span-2 xl:col-span-2">
              <input
                type="text"
                placeholder="Rechercher une ecole..."
                value={filters.search}
                onChange={(event) => setFilter("search", event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-700 outline-none transition-all focus:border-[#2D5016] focus:bg-white"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            </div>

            <SearchableDropdown
              label="Region"
              value={filters.region}
              options={MOROCCO_REGIONS.map((region) => region.name)}
              onSelect={(value) => setLocation({ region: value || "", province: "", city: "" })}
              emptyLabel="Toutes les regions"
              placeholder="Chercher une region..."
              width="w-full text-xs"
            />

            <SearchableDropdown
              label="Province"
              value={filters.province}
              options={provinces.map((province) => province.name)}
              onSelect={(value) => setLocation({ province: value || "", city: "" })}
              disabled={!filters.region}
              emptyLabel="Toutes les provinces"
              placeholder={filters.region ? "Chercher une province..." : "Choisir region d'abord"}
              width="w-full text-xs"
            />

            <SearchableDropdown
              label="Ville"
              value={filters.city}
              options={cities}
              onSelect={(value) => setFilter("city", value)}
              emptyLabel="Toutes les villes"
              placeholder="Chercher une ville..."
              width="w-full text-xs"
            />

            <button className="rounded-xl bg-[#A7D129] px-4 py-2 text-xs font-bold text-[#17250D] transition hover:brightness-95">
              Rechercher
            </button>

            <SearchableDropdown
              label="Type"
              value={filters.type}
              options={EDUCATION_TYPES.map((type) => ({ value: type.value, label: type.label }))}
              onSelect={(value) => setFilter("type", value)}
              emptyLabel="Tous les types"
              placeholder="Chercher un type..."
              width="w-full text-xs"
            />

            <SearchableDropdown
              label="Secteur"
              value={filters.sector}
              options={EDUCATION_SECTORS.map((sector) => ({ value: sector.value, label: sector.label }))}
              onSelect={(value) => setFilter("sector", value)}
              emptyLabel="Tous secteurs"
              searchable={false}
              width="w-full text-xs"
            />
          </form>
        </div>

        <div ref={listingsRef} className="min-h-0 flex-1 overflow-y-auto overscroll-auto px-6 py-5">
          {!loading && institutions.length > 0 && (
            <p className="mb-3 text-sm text-black/40">
              <span className="font-semibold text-black/70">{pagination.total}</span> etablissement{pagination.total > 1 ? "s" : ""} trouve{pagination.total > 1 ? "s" : ""}
            </p>
          )}

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-black/40">
              <Loader2 className="h-4 w-4 animate-spin text-[#2D5016]" /> Chargement...
            </div>
          ) : !error && institutions.length === 0 ? (
            <div className="rounded-xl border border-black/10 py-16 text-center text-sm text-black/40">
              Aucun etablissement ne correspond a vos filtres.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
              {institutions.map((institution) => (
                <EducationInstitutionCard
                  key={institution.id}
                  institution={institution}
                  selected={selected?.id === institution.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          )}
        </div>

        {!loading && pagination.totalPages > 1 && (
          <div className="shrink-0 border-t border-black/[0.06] px-6 py-4">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                onClick={() => goPage(Math.max(1, filters.page - 1))}
                disabled={filters.page === 1}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-sm text-black/50 transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-30"
              >
                {"<"}
              </button>
              {pageWindow.map((p, index) =>
                p === "..." ? (
                  <span key={`ellipsis-${index}`} className="w-9 text-center text-sm text-black/30">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goPage(p)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition ${
                      filters.page === p
                        ? "bg-[#2D5016] text-white shadow-sm"
                        : "border border-black/10 bg-white text-[#2D5016] hover:border-[#2D5016]"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                onClick={() => goPage(Math.min(pagination.totalPages, filters.page + 1))}
                disabled={filters.page === pagination.totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-sm text-black/50 transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-30"
              >
                {">"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
