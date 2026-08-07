"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Copy,
  Eye,
  HeartPulse,
  ImageOff,
  LayoutGrid,
  MessageSquare,
  PhoneOff,
  Rocket,
  Store,
  TrendingUp,
  Wand2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { statsService } from "@/services/statsService";

const COLORS = {
  primary: "#A7D129",
  dark: "#2D5016",
  mint: "#E8F5D0",
  accent: "#FF8C42",
};

function KpiCard({ icon: Icon, label, value, sublabel, tone = "green" }) {
  const tones = {
    green: "bg-[#E8F5D0] text-[#2D5016]",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-600",
    gray: "bg-gray-100 text-gray-700",
  };
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={19} />
        </span>
      </div>
      {sublabel && <p className="mt-3 text-xs text-gray-500">{sublabel}</p>}
    </div>
  );
}

function HealthItem({ icon: Icon, label, value, tone = "gray" }) {
  const color = tone === "bad" ? "text-red-600 bg-red-50" : tone === "warn" ? "text-orange-600 bg-orange-50" : "text-[#2D5016] bg-[#E8F5D0]";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon size={17} /></span>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <strong className="text-lg text-gray-950">{value}</strong>
    </div>
  );
}

function moduleLabel(type) {
  if (type === "CAR") return "Vehicule";
  if (type === "REAL_ESTATE") return "Immobilier";
  if (type === "JOB") return "Emploi";
  return type;
}

export default function StatsPage() {
  const { token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topListings, setTopListings] = useState([]);
  const [boostImpact, setBoostImpact] = useState(null);
  const [days, setDays] = useState(30);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = { days };
      if (typeFilter) params.type = typeFilter;
      const [overviewRes, timelineRes, topRes, boostRes] = await Promise.all([
        statsService.getOverview(token),
        statsService.getViewsTimeline(params, token),
        statsService.getTopListings({ limit: 8 }, token),
        statsService.getBoostImpact(token),
      ]);
      setOverview(overviewRes);
      setTimeline(timelineRes.timeline || []);
      setTopListings(topRes.topListings || []);
      setBoostImpact(boostRes);
    } catch (err) {
      setError(err.message || "Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  }, [token, days, typeFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const formattedTimeline = useMemo(() => timeline.map((point) => ({
    ...point,
    label: new Date(point.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
  })), [timeline]);

  const totalConversions = overview?.totalContacts || ((overview?.totalApplications || 0) + (overview?.totalInquiries || 0));
  const boostDelta = boostImpact?.regularAvgViews > 0
    ? Math.round(((boostImpact.boostedAvgViews - boostImpact.regularAvgViews) / boostImpact.regularAvgViews) * 100)
    : null;

  if (loading && !overview) {
    return <div className="flex h-64 items-center justify-center text-gray-400">Chargement des statistiques...</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-600">
        {error}
        <button onClick={loadAll} className="ml-3 underline underline-offset-2 hover:text-red-700">Reessayer</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-[#2D5016] text-white shadow-sm">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px] lg:p-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
              <BarChart3 size={14} />
              Business cockpit
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-normal">Statistiques et performance</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
              Suivez vos vues, contacts, annonces, boutique PRO et actions utiles pour ameliorer vos resultats.
            </p>
          </div>
          {overview?.boutique && (
            <div className="rounded-2xl bg-white p-4 text-gray-950">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#E8F5D0]">
                  {overview.boutique.logo ? <img src={overview.boutique.logo} alt="" className="h-full w-full object-cover" /> : <Store size={24} className="text-[#2D5016]" />}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-extrabold">{overview.boutique.name}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {overview.boutique.isVerified && <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700"><BadgeCheck size={12} /> Verifiee</span>}
                    {overview.boutique.plan && <span className="rounded-full bg-[#E8F5D0] px-2 py-0.5 text-[11px] font-bold text-[#2D5016]">{overview.boutique.plan.name}</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Link href={overview.boutique.url} className="flex-1 rounded-xl bg-[#2D5016] px-3 py-2 text-center text-sm font-extrabold text-white">Voir ma boutique</Link>
                <button
                  onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}${overview.boutique.url}`); setMessage("Lien boutique copie."); }}
                  className="rounded-xl border border-gray-200 px-3 text-[#2D5016]"
                  aria-label="Copier le lien boutique"
                >
                  <Copy size={17} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {message && <div className="rounded-xl border border-[#2D5016]/20 bg-[#E8F5D0] p-3 text-sm text-[#2D5016]">{message}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={Eye} label="Vues totales" value={overview?.totalViews ?? 0} />
        <KpiCard icon={LayoutGrid} label="Annonces" value={overview?.totalListings ?? 0} sublabel={`${overview?.cars?.count ?? 0} vehicules · ${overview?.realEstate?.count ?? 0} immo · ${overview?.jobs?.count ?? 0} emploi`} />
        <KpiCard icon={MessageSquare} label="Contacts" value={totalConversions} sublabel={`${overview?.totalApplications ?? 0} candidatures · ${overview?.totalInquiries ?? 0} demandes`} tone="blue" />
        <KpiCard icon={TrendingUp} label="Conversion" value={`${overview?.conversionRate ?? 0}%`} tone="orange" />
        <KpiCard icon={Store} label="Boutique visites" value={overview?.boutique?.visits ?? 0} tone="gray" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-extrabold text-gray-950">Evolution des vues</h2>
              <p className="text-sm text-gray-500">Analyse par type d'annonce et periode.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Segmented value={typeFilter} onChange={setTypeFilter} options={[["", "Tout"], ["CAR", "Vehicules"], ["REAL_ESTATE", "Immo"], ["JOB", "Emploi"]]} />
              <Segmented value={days} onChange={setDays} options={[[7, "7j"], [30, "30j"], [90, "90j"]]} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={310}>
            <AreaChart data={formattedTimeline}>
              <defs>
                <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2EA" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} formatter={(value) => [value, "Vues"]} />
              <Area type="monotone" dataKey="views" stroke={COLORS.dark} strokeWidth={2.5} fill="url(#viewsFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-extrabold text-gray-950">Sante des annonces</h2>
          <div className="mt-4 space-y-2">
            <HealthItem icon={CheckCircle2} label="Approuvees" value={overview?.listingHealth?.approved || 0} />
            <HealthItem icon={HeartPulse} label="En attente" value={overview?.listingHealth?.pending || 0} tone="warn" />
            <HealthItem icon={ImageOff} label="Sans image" value={overview?.listingHealth?.missingImages || 0} tone="bad" />
            <HealthItem icon={PhoneOff} label="Sans telephone" value={overview?.listingHealth?.missingPhone || 0} tone="bad" />
            <HealthItem icon={TrendingUp} label="Faibles vues" value={overview?.listingHealth?.lowViews || 0} tone="warn" />
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-extrabold text-gray-950">Top annonces</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {topListings.map((listing) => (
              <Link key={`${listing.type}-${listing.id}`} href={listing.href || "#"} className="group flex gap-3 rounded-xl border border-gray-100 p-3 transition hover:border-[#A7D129] hover:bg-[#F6F8F3]">
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {listing.image ? <img src={listing.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" /> : <Store className="m-auto mt-6 text-gray-300" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#E8F5D0] px-2 py-0.5 text-[10px] font-bold text-[#2D5016]">{moduleLabel(listing.type)}</span>
                    {(listing.isFeatured || listing.isSponsored) && <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">Boost</span>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-bold text-gray-900">{listing.title}</p>
                  <p className="mt-1 text-xs text-gray-500">{listing.views} vues · {listing.conversions} contacts</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-extrabold text-gray-950">Impact boost</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#E8F5D0] p-3">
                <p className="text-xs text-[#2D5016]/70">Boostees</p>
                <p className="text-xl font-extrabold text-[#2D5016]">{boostImpact?.boostedAvgViews || 0}</p>
                <p className="text-xs text-[#2D5016]/70">vues / annonce</p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Classiques</p>
                <p className="text-xl font-extrabold text-gray-900">{boostImpact?.regularAvgViews || 0}</p>
                <p className="text-xs text-gray-500">vues / annonce</p>
              </div>
            </div>
            <p className="mt-3 text-sm font-bold text-orange-600">{boostDelta !== null ? `+${boostDelta}% de vues en moyenne` : "Boostez une annonce pour comparer."}</p>
            <p className="mt-1 text-xs text-gray-500">{boostImpact?.extraContactsEstimate || 0} contacts supplementaires estimes.</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-extrabold text-gray-950">Audience</h2>
            <div className="mt-4 space-y-3">
              {(overview?.audience?.topCities || []).map((city) => (
                <div key={city.city} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">{city.city}</span>
                  <span className="font-bold text-[#2D5016]">{city.views} vues</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Wand2 size={19} className="text-[#2D5016]" />
          <h2 className="font-extrabold text-gray-950">Recommandations</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(overview?.recommendations?.length ? overview.recommendations : ["Continuez a publier regulierement et gardez vos annonces avec photos, prix clair et telephone visible."]).map((text) => (
            <div key={text} className="flex gap-3 rounded-xl bg-[#F6F8F3] p-4 text-sm text-gray-700">
              <Rocket size={17} className="mt-0.5 shrink-0 text-[#2D5016]" />
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex rounded-xl border border-gray-200 bg-white p-1 text-xs">
      {options.map(([optionValue, label]) => (
        <button
          key={String(optionValue)}
          type="button"
          onClick={() => onChange(optionValue)}
          className={`rounded-lg px-3 py-1.5 font-bold transition ${value === optionValue ? "bg-[#2D5016] text-white" : "text-gray-500 hover:text-[#2D5016]"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
