"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Crosshair, Loader2, MapPinned, Search } from "lucide-react";
import SearchableDropdown from "@/components/explore/SearchableDropdown";
import GoogleHealthMap from "@/components/health/GoogleHealthMap";
import HealthPlaceCard from "@/components/health/HealthPlaceCard";
import { HEALTH_SUBCATEGORIES, MOROCCO_CITIES } from "@/constants/healthCategories";
import { healthService } from "@/services/healthService";

const RADIUS_OPTIONS = [1000, 3000, 5000, 10000, 25000, 50000];

function paramsFromState(state) {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined && value !== false) params.set(key, String(value));
  });
  return params.toString();
}

function HealthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingsRef = useRef(null);
  const [filters, setFilters] = useState({
    subcategory: searchParams.get("subcategory") || "",
    query: searchParams.get("query") || "",
    city: searchParams.get("city") || "",
    openNow: searchParams.get("openNow") === "true",
    radius: Number(searchParams.get("radius") || 5000),
    lat: searchParams.get("lat") || "",
    lng: searchParams.get("lng") || "",
    limit: 40,
  });
  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [boundsCenter, setBoundsCenter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState("");

  const mapCenter = useMemo(() => {
    if (filters.lat && filters.lng) return { lat: Number(filters.lat), lng: Number(filters.lng) };
    return null;
  }, [filters.lat, filters.lng]);
  const mapCount = useMemo(() => places.filter((place) => place.latitude != null && place.longitude != null).length, [places]);

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

  const search = useCallback(async (next = filters, replaceUrl = true) => {
    setLoading(true);
    setError("");
    try {
      const response = await healthService.searchPlaces(next);
      const nextPlaces = response.data || [];
      setPlaces(nextPlaces);
      setSelected(nextPlaces.find((place) => place.latitude != null && place.longitude != null) || nextPlaces[0] || null);
      if (replaceUrl) {
        const query = paramsFromState(next);
        router.replace(query ? `/sante?${query}` : "/sante", { scroll: false });
      }
    } catch (err) {
      setPlaces([]);
      setSelected(null);
      setError(err.response?.data?.message || "Impossible de charger les etablissements de sante.");
    } finally {
      setLoading(false);
    }
  }, [filters, router]);

  useEffect(() => {
    const timer = setTimeout(() => search(filters, false), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const submit = (event) => {
    event?.preventDefault();
    search(filters);
  };

  const useGps = () => {
    setGpsLoading(true);
    setError("");
    if (!navigator.geolocation) {
      setGpsLoading(false);
      setError("GPS indisponible. Choisissez une ville.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          ...filters,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          city: "",
        };
        setFilters(next);
        setGpsLoading(false);
        search(next);
      },
      () => {
        setGpsLoading(false);
        setError("Permission GPS refusee ou position indisponible. Choisissez une ville.");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  const searchInMapArea = () => {
    if (!boundsCenter) return;
    const next = {
      ...filters,
      lat: boundsCenter.lat.toFixed(6),
      lng: boundsCenter.lng.toFixed(6),
      city: "",
    };
    setFilters(next);
    search(next);
  };

  return (
    <main className="flex h-[95vh] min-h-[640px] flex-col overflow-hidden bg-white lg:flex-row">
      <div className="order-1 sticky top-0 z-10 h-64 w-full shrink-0 bg-white p-3 lg:order-2 lg:static lg:h-auto lg:max-w-[50%] lg:border-l lg:border-black/[0.06]">
        <div className="flex h-full flex-col gap-2">
          <div className="flex shrink-0 items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-xs text-[var(--color-primary-dark)]/70">
              <MapPinned size={15} /> {mapCount} etablissement{mapCount > 1 ? "s" : ""} sur la carte
            </span>
            <button
              type="button"
              onClick={searchInMapArea}
              className="max-w-[58%] truncate rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:text-[#2D5016] sm:max-w-none"
            >
              Rechercher dans cette zone
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            <GoogleHealthMap places={places} selectedId={selected?.id} center={mapCenter} onSelect={setSelected} onBoundsChanged={setBoundsCenter} />
          </div>
        </div>
      </div>

      <section className="order-2 flex min-h-0 min-w-0 flex-1 flex-col lg:order-1 lg:min-w-[420px]">
        <div className="shrink-0 space-y-3 border-b border-black/[0.06] px-6 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <div>
              <h1 className="text-base font-bold text-black">Sante au Maroc</h1>
              <p className="mt-0.5 max-w-2xl text-xs text-black/45">
                Hopitaux, cliniques, pharmacies, laboratoires et cabinets proches de vous.
              </p>
            </div>
            <button
              type="button"
              onClick={useGps}
              disabled={gpsLoading}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-[#2D5016] px-3.5 text-xs font-semibold text-white transition disabled:opacity-60 sm:w-auto"
            >
              {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair size={15} />}
              Autour de moi
            </button>
          </div>

          <form onSubmit={submit} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <label className="relative sm:col-span-2 xl:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                value={filters.query}
                onChange={(e) => setFilter("query", e.target.value)}
                placeholder="Nom, specialite, quartier..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-700 outline-none transition-all focus:border-[#2D5016] focus:bg-white"
              />
            </label>

            <SearchableDropdown
              label="Categorie"
              value={filters.subcategory}
              options={HEALTH_SUBCATEGORIES.map((item) => ({ value: item.slug, label: item.label }))}
              onSelect={(value) => setFilter("subcategory", value || "")}
              emptyLabel="Toutes categories"
              placeholder="Chercher une categorie..."
              width="w-full text-xs"
            />

            <SearchableDropdown
              label="Ville"
              value={filters.city}
              options={MOROCCO_CITIES}
              onSelect={(value) => setFilters((prev) => ({ ...prev, city: value || "", lat: "", lng: "" }))}
              emptyLabel="Toutes les villes"
              placeholder="Chercher une ville..."
              width="w-full text-xs"
            />

            <SearchableDropdown
              label="Rayon"
              value={filters.radius}
              options={RADIUS_OPTIONS.map((value) => ({ value, label: `${value / 1000} km` }))}
              onSelect={(value) => setFilter("radius", Number(value || 5000))}
              searchable={false}
              width="w-full text-xs"
            />

            <button className="rounded-xl bg-[#A7D129] px-4 py-2 text-xs font-bold text-[#17250D] transition hover:brightness-95">
              Rechercher
            </button>

            <label className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs text-gray-700">
              <input type="checkbox" checked={filters.openNow} onChange={(e) => setFilter("openNow", e.target.checked)} />
              Ouvert maintenant
            </label>
          </form>
        </div>

        <div ref={listingsRef} className="min-h-0 flex-1 overflow-y-auto overscroll-auto px-6 py-5">
          {!loading && places.length > 0 && (
            <p className="mb-3 text-sm text-black/40">
              <span className="font-semibold text-black/70">{places.length}</span> resultat{places.length > 1 ? "s" : ""}
            </p>
          )}

          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-black/40">
              <Loader2 className="h-4 w-4 animate-spin text-[#2D5016]" /> Chargement...
            </div>
          ) : !error && places.length === 0 ? (
            <div className="rounded-xl border border-black/10 py-16 text-center text-sm text-black/40">
              Aucun resultat pour ce filtre.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
              {places.map((place) => (
                <HealthPlaceCard
                  key={`${place.source}-${place.id}`}
                  place={place}
                  selected={selected?.id === place.id}
                  onSelect={setSelected}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function HealthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Chargement
        </div>
      }
    >
      <HealthPageContent />
    </Suspense>
  );
}
