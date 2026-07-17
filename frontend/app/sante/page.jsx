"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Crosshair, Loader2, MapPinned, Search } from "lucide-react";
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
  const [filters, setFilters] = useState({
    subcategory: searchParams.get("subcategory") || "",
    query: searchParams.get("query") || "",
    city: searchParams.get("city") || "",
    openNow: searchParams.get("openNow") === "true",
    radius: Number(searchParams.get("radius") || 5000),
    lat: searchParams.get("lat") || "",
    lng: searchParams.get("lng") || "",
    limit: 20,
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

  const search = useCallback(async (next = filters, replaceUrl = true) => {
    setLoading(true);
    setError("");
    try {
      const response = await healthService.searchPlaces(next);
      setPlaces(response.data || []);
      setSelected(response.data?.[0] || null);
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
      <div className="order-1 sticky top-0 z-10 h-64 w-full shrink-0 lg:order-2 lg:static lg:h-auto lg:max-w-[50%] lg:border-l lg:border-black/[0.06]">
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between border-b border-black/[0.06] bg-white px-4 py-2.5">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
              <MapPinned size={16} /> Carte santé
            </span>
            <button
              type="button"
              onClick={searchInMapArea}
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#2D5016]"
            >
              Rechercher dans cette zone
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <GoogleHealthMap
              places={places}
              selectedId={selected?.id}
              center={mapCenter}
              onSelect={setSelected}
              onBoundsChanged={setBoundsCenter}
            />
          </div>
        </div>
      </div>

      <section className="order-2 flex min-h-0 min-w-0 flex-1 flex-col lg:order-1 lg:min-w-[420px]">
        <div className="shrink-0 border-b border-black/[0.06] px-6 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div>
              <h1 className="text-base font-bold text-black">Santé au Maroc</h1>
              <p className="mt-0.5 max-w-2xl text-xs text-black/45">
                Les horaires et informations peuvent changer. En cas d&apos;urgence medicale, contactez les services d&apos;urgence competents.
              </p>
            </div>
            <button
              type="button"
              onClick={useGps}
              disabled={gpsLoading}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-[#2D5016] px-3.5 text-xs font-semibold text-white transition disabled:opacity-60"
            >
              {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair size={15} />}
              Autour de moi
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setFilter("subcategory", "")}
              className={`h-9 shrink-0 rounded-full border px-3 text-xs font-semibold transition ${
                !filters.subcategory ? "border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]" : "border-black/10 text-gray-600 hover:border-[#A7D129]"
              }`}
            >
              Tout
            </button>
            {HEALTH_SUBCATEGORIES.map((item) => {
              const Icon = item.icon;
              const active = filters.subcategory === item.slug;
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setFilter("subcategory", item.slug)}
                  className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition ${
                    active ? "border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]" : "border-black/10 text-gray-600 hover:border-[#A7D129]"
                  }`}
                >
                  <Icon size={14} style={{ color: item.color }} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={submit} className="mt-2.5 grid gap-2 xl:grid-cols-[1fr_150px_120px_145px_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={filters.query}
                onChange={(e) => setFilter("query", e.target.value)}
                placeholder="Nom, specialite, quartier..."
                className="h-10 w-full rounded-full border border-black/10 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#2D5016]"
              />
            </label>
            <select
              value={filters.city}
              onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value, lat: "", lng: "" }))}
              className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#2D5016]"
            >
              <option value="">Ville</option>
              {MOROCCO_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
            <select
              value={filters.radius}
              onChange={(e) => setFilter("radius", Number(e.target.value))}
              className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#2D5016]"
            >
              {RADIUS_OPTIONS.map((value) => <option key={value} value={value}>{value / 1000} km</option>)}
            </select>
            <label className="flex h-10 items-center gap-2 rounded-full border border-black/10 bg-white px-3 text-sm">
              <input type="checkbox" checked={filters.openNow} onChange={(e) => setFilter("openNow", e.target.checked)} />
              Ouvert maintenant
            </label>
            <button type="submit" className="h-10 rounded-full bg-[#A7D129] px-5 text-sm font-bold text-[#17250D] transition hover:brightness-95">
              Rechercher
            </button>
          </form>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-black/40">
              {loading ? "Recherche en cours..." : `${places.length} resultat${places.length > 1 ? "s" : ""}`}
            </p>
          </div>

          {error && <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Chargement
            </div>
          ) : !error && places.length === 0 ? (
            <div className="border border-black/10 py-16 text-center text-sm text-gray-500">
              Aucun résultat pour ce filtre.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
