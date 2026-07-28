"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Crosshair, Loader2, MapPinned, Search } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import EventMap from "@/components/events/EventMap";
import { EVENT_MODES } from "@/constants/eventCategories";
import { eventsService } from "@/services/eventsService";

const RADIUS_OPTIONS = [1000, 3000, 5000, 10000, 25000, 50000];

function queryString(state) {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined && value !== false) params.set(key, String(value));
  });
  return params.toString();
}

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [boundsCenter, setBoundsCenter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    query: searchParams.get("query") || "",
    city: searchParams.get("city") || "",
    period: searchParams.get("period") || "",
    isFree: searchParams.get("isFree") || "",
    eventMode: searchParams.get("eventMode") || "",
    verified: searchParams.get("verified") || "",
    sort: searchParams.get("sort") || "date",
    radius: Number(searchParams.get("radius") || 5000),
    lat: searchParams.get("lat") || "",
    lng: searchParams.get("lng") || "",
    limit: 40,
  });

  const mapCenter = useMemo(() => {
    if (filters.lat && filters.lng) return { lat: Number(filters.lat), lng: Number(filters.lng) };
    return null;
  }, [filters.lat, filters.lng]);

  const load = useCallback(async (next = filters, replaceUrl = true) => {
    setLoading(true);
    setError("");
    try {
      const response = await eventsService.list(next);
      setEvents(response.data || []);
      setSelected(response.data?.[0] || null);
      if (replaceUrl) {
        const qs = queryString(next);
        router.replace(qs ? `/evenements?${qs}` : "/evenements", { scroll: false });
      }
    } catch (err) {
      setEvents([]);
      setSelected(null);
      setError(err.response?.data?.message || "Impossible de charger les evenements.");
    } finally {
      setLoading(false);
    }
  }, [filters, router]);

  useEffect(() => {
    eventsService.categories().then((res) => setCategories(res.data || [])).catch(() => setCategories([]));
    const timer = setTimeout(() => load(filters, false), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const submit = (event) => {
    event?.preventDefault();
    load(filters);
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
          sort: "proximity",
        };
        setFilters(next);
        setGpsLoading(false);
        load(next);
      },
      () => {
        setGpsLoading(false);
        setError("Permission GPS refusee ou position indisponible.");
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
      sort: "proximity",
    };
    setFilters(next);
    load(next);
  };

  const favorite = async (event) => {
    try {
      await eventsService.addFavorite(event.id);
    } catch {
      setError("Connectez-vous pour ajouter un favori.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-white lg:h-[95vh] lg:min-h-[650px] lg:overflow-hidden lg:flex-row">
      <div className="order-1 h-56 w-full shrink-0 overflow-hidden sm:h-64 lg:order-2 lg:h-auto lg:max-w-[50%] lg:border-l lg:border-black/[0.06]">
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/[0.06] bg-white px-4 py-2.5">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800">
              <MapPinned size={16} /> Carte evenements
            </span>
            <button type="button" onClick={searchInMapArea} className="max-w-[58%] truncate rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#2D5016] sm:max-w-none">
              Rechercher dans cette zone
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <EventMap events={events} selectedId={selected?.id} center={mapCenter} onSelect={setSelected} onBoundsChanged={setBoundsCenter} />
          </div>
        </div>
      </div>

      <section className="order-2 flex min-h-0 min-w-0 flex-1 flex-col lg:order-1 lg:min-w-[430px]">
        <div className="shrink-0 border-b border-black/[0.06] px-4 py-4 sm:px-6 lg:py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
            <div>
              <h1 className="text-base font-bold text-black">Evenements au Maroc</h1>
              <p className="mt-0.5 max-w-2xl text-xs text-black/45">Sorties, culture, formations, marches et rencontres locales.</p>
            </div>
            <button type="button" onClick={useGps} disabled={gpsLoading} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-full bg-[#2D5016] px-3.5 text-xs font-semibold text-white transition disabled:opacity-60 sm:w-auto">
              {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair size={15} />}
              Autour de moi
            </button>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setFilter("category", "")} className={`h-9 shrink-0 rounded-full border px-3 text-xs font-semibold transition ${!filters.category ? "border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]" : "border-black/10 text-gray-600 hover:border-[#A7D129]"}`}>
              Tout
            </button>
            {categories.map((category) => (
              <button key={category.id} type="button" onClick={() => setFilter("category", category.slug)} className={`h-9 shrink-0 rounded-full border px-3 text-xs font-semibold transition ${filters.category === category.slug ? "border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]" : "border-black/10 text-gray-600 hover:border-[#A7D129]"}`}>
                {category.name}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-2.5 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_120px_130px_130px_120px_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={filters.query} onChange={(e) => setFilter("query", e.target.value)} placeholder="Titre, lieu, organisateur..." className="h-10 w-full rounded-full border border-black/10 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#2D5016]" />
            </label>
            <input value={filters.city} onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value, lat: "", lng: "" }))} placeholder="Ville" className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#2D5016]" />
            <select value={filters.period} onChange={(e) => setFilter("period", e.target.value)} className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#2D5016]">
              <option value="">A venir</option>
              <option value="today">Aujourd&apos;hui</option>
              <option value="tomorrow">Demain</option>
              <option value="weekend">Ce week-end</option>
            </select>
            <select value={filters.eventMode} onChange={(e) => setFilter("eventMode", e.target.value)} className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#2D5016]">
              {EVENT_MODES.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
            </select>
            <select value={filters.sort} onChange={(e) => setFilter("sort", e.target.value)} className="h-10 rounded-full border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#2D5016]">
              <option value="date">Date</option>
              <option value="proximity">Proximite</option>
              <option value="popularite">Popularite</option>
              <option value="nouveaute">Nouveaute</option>
            </select>
            <button type="submit" className="h-11 rounded-full bg-[#A7D129] px-5 text-sm font-bold text-[#17250D] transition hover:brightness-95 sm:col-span-2 xl:col-span-1 xl:h-10">
              Rechercher
            </button>
          </form>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <label className="flex h-8 items-center gap-2 rounded-full border border-black/10 px-3">
              <input type="checkbox" checked={filters.isFree === "true"} onChange={(e) => setFilter("isFree", e.target.checked ? "true" : "")} />
              Gratuit
            </label>
            <label className="flex h-8 items-center gap-2 rounded-full border border-black/10 px-3">
              <input type="checkbox" checked={filters.verified === "true"} onChange={(e) => setFilter("verified", e.target.checked ? "true" : "")} />
              Verifies
            </label>
            <select value={filters.radius} onChange={(e) => setFilter("radius", Number(e.target.value))} className="h-8 rounded-full border border-black/10 px-3">
              {RADIUS_OPTIONS.map((value) => <option key={value} value={value}>{value / 1000} km</option>)}
            </select>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-4 py-5 sm:px-6 lg:overflow-y-auto">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-black/40">{loading ? "Recherche en cours..." : `${events.length} resultat${events.length > 1 ? "s" : ""}`}</p>
          </div>
          {error && <div className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Chargement</div>
          ) : events.length === 0 ? (
            <div className="border border-black/10 py-16 text-center text-sm text-gray-500">Aucun evenement pour ce filtre.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} selected={selected?.id === event.id} onSelect={setSelected} onFavorite={favorite} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center gap-2 text-gray-500"><Loader2 className="h-5 w-5 animate-spin" /> Chargement</div>}>
      <EventsContent />
    </Suspense>
  );
}
