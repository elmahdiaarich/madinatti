"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Eye, LayoutGrid, MessageSquare, TrendingUp, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { statsService } from "@/services/statsService";

// Couleurs reprises des tokens de globals.css (--color-primary, --color-accent, ...)
const COLORS = {
  primary: "#A7D129",
  primaryDark: "#2D5016",
  accent: "#FF8C42",
};

// ───────────────────────────────────────────────────────────────────────────
// MODE DÉMO — données factices pour voir le rendu de la page avant d'avoir
// assez de vraies vues en base. Mettre MOCK_MODE à false pour repasser sur
// l'API réelle (statsService). À retirer entièrement une fois en production.
// ───────────────────────────────────────────────────────────────────────────
const MOCK_MODE = true;

const MOCK_DAILY_VIEWS = [
  12, 18, 9, 25, 31, 14, 20, 17, 29, 35, 22, 19, 26, 33, 15, 21, 28, 24, 30,
  38, 17, 23, 27, 32, 19, 14, 25, 29, 33, 21,
];

const buildMockTimeline = () =>
  MOCK_DAILY_VIEWS.map((views, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (MOCK_DAILY_VIEWS.length - 1 - i));
    return { date: d.toISOString().split("T")[0], views };
  });

const MOCK_OVERVIEW = {
  totalViews: 742,
  totalListings: 50,
  totalApplications: 32,
  totalInquiries: 15,
  conversionRate: 6.3,
  jobs: {
    count: 36,
    viewsCount: 612,
    applications: 32,
    statusBreakdown: { APPROVED: 28, PENDING: 5, REJECTED: 3 },
  },
  realEstate: {
    count: 14,
    viewsCount: 130,
    inquiries: 15,
    statusBreakdown: { APPROVED: 11, PENDING: 2, REJECTED: 1 },
  },
};

const MOCK_TOP_LISTINGS = [
  { id: "mock-1", type: "JOB", title: "Développeur Full-Stack React / Node.js", views: 145, conversions: 12, status: "APPROVED", isFeatured: true },
  { id: "mock-2", type: "REAL_ESTATE", title: "Appartement 3 pièces vue mer — Tanger", views: 98, conversions: 6, status: "APPROVED", isFeatured: false },
  { id: "mock-3", type: "JOB", title: "Comptable senior — CDI", views: 87, conversions: 9, status: "APPROVED", isFeatured: true },
  { id: "mock-4", type: "REAL_ESTATE", title: "Villa avec piscine — Marrakech", views: 76, conversions: 3, status: "APPROVED", isFeatured: false },
  { id: "mock-5", type: "JOB", title: "Assistant marketing digital", views: 64, conversions: 4, status: "PENDING", isFeatured: false },
];

const MOCK_BOOST_IMPACT = {
  boostedAvgViews: 116.5,
  regularAvgViews: 58.2,
  boostedCount: 12,
  regularCount: 38,
};

function StatCard({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-mint text-primary-dark">
            <Icon size={16} strokeWidth={2} />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-semibold text-primary-dark">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex h-40 flex-1 items-center justify-center text-center text-sm text-gray-400">
      {message}
    </div>
  );
}

export default function StatsPage() {
  const { token } = useAuth();

  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [topListings, setTopListings] = useState([]);
  const [boostImpact, setBoostImpact] = useState(null);

  const [days, setDays] = useState(30);
  const [typeFilter, setTypeFilter] = useState(""); // "" | "JOB" | "REAL_ESTATE"

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    if (MOCK_MODE) {
      const mockTimeline = buildMockTimeline().slice(-Math.min(days, MOCK_DAILY_VIEWS.length));
      setOverview(MOCK_OVERVIEW);
      setTimeline(mockTimeline);
      setTopListings(MOCK_TOP_LISTINGS);
      setBoostImpact(MOCK_BOOST_IMPACT);
      setError(null);
      setLoading(false);
      return;
    }

    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const timelineParams = { days };
      if (typeFilter) timelineParams.type = typeFilter;

      const [overviewRes, timelineRes, topRes, boostRes] = await Promise.all([
        statsService.getOverview(token),
        statsService.getViewsTimeline(timelineParams, token),
        statsService.getTopListings({ limit: 5 }, token),
        statsService.getBoostImpact(token),
      ]);

      setOverview(overviewRes);
      setTimeline(timelineRes.timeline || []);
      setTopListings(topRes.topListings || []);
      setBoostImpact(boostRes);
    } catch (err) {
      console.error("loadAll stats error:", err);
      setError(err.message || "Erreur lors du chargement des statistiques");
    } finally {
      setLoading(false);
    }
  }, [token, days, typeFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading && !overview) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Chargement des statistiques…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-red-600">
        {error}
        <button
          onClick={loadAll}
          className="ml-3 underline underline-offset-2 hover:text-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const totalConversions =
    (overview?.totalApplications || 0) + (overview?.totalInquiries || 0);

  const formattedTimeline = timeline.map((point) => ({
    ...point,
    label: new Date(point.date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    }),
  }));

  const boostDelta =
    boostImpact && boostImpact.regularAvgViews > 0
      ? Math.round(
          ((boostImpact.boostedAvgViews - boostImpact.regularAvgViews) /
            boostImpact.regularAvgViews) *
            100,
        )
      : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-primary-dark">Statistiques</h1>
        <p className="text-sm text-gray-500">
          Performance de vos annonces emploi et immobilier.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Eye} label="Vues totales" value={overview?.totalViews ?? 0} />
        <StatCard
          icon={LayoutGrid}
          label="Annonces publiées"
          value={overview?.totalListings ?? 0}
          sublabel={`${overview?.jobs?.count ?? 0} emploi · ${overview?.realEstate?.count ?? 0} immobilier`}
        />
        <StatCard
          icon={MessageSquare}
          label="Conversions"
          value={totalConversions}
          sublabel={`${overview?.totalApplications ?? 0} candidatures · ${overview?.totalInquiries ?? 0} demandes`}
        />
        <StatCard
          icon={TrendingUp}
          label="Taux de conversion"
          value={`${overview?.conversionRate ?? 0}%`}
        />
      </div>

      {/* Graphique des vues + Annonces les plus vues, côte à côte pour profiter de l'espace */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium text-primary-dark">Évolution des vues</h2>
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs">
                {[
                  { label: "Tout", value: "" },
                  { label: "Emploi", value: "JOB" },
                  { label: "Immobilier", value: "REAL_ESTATE" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTypeFilter(opt.value)}
                    className={`rounded-md px-2.5 py-1 transition ${
                      typeFilter === opt.value
                        ? "bg-primary text-white"
                        : "text-gray-500 hover:text-primary-dark"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg border border-gray-200 p-0.5 text-xs">
                {[7, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    className={`rounded-md px-2.5 py-1 transition ${
                      days === d
                        ? "bg-primary text-white"
                        : "text-gray-500 hover:text-primary-dark"
                    }`}
                  >
                    {d}j
                  </button>
                ))}
              </div>
            </div>
          </div>

          {formattedTimeline.every((p) => p.views === 0) ? (
            <EmptyState message="Aucune vue enregistrée sur cette période." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={formattedTimeline}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #E5E7EB",
                    fontSize: 12,
                  }}
                  labelFormatter={(label) => `Le ${label}`}
                  formatter={(value) => [value, "Vues"]}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke={COLORS.primaryDark}
                  strokeWidth={2}
                  fill="url(#viewsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Annonces les plus vues — remontée ici pour occuper l'espace à côté du graphique */}
        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-medium text-primary-dark">Annonces les plus vues</h2>
          {topListings.length === 0 ? (
            <EmptyState message="Aucune annonce publiée pour le moment." />
          ) : (
            <ol className="flex flex-1 flex-col justify-between gap-3">
              {topListings.map((listing, index) => (
                <li
                  key={`${listing.type}-${listing.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-gray-50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-mint text-xs font-semibold text-primary-dark">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium text-gray-700">
                        {listing.title}
                      </p>
                      {listing.isFeatured && (
                        <Sparkles size={12} className="shrink-0 text-accent" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {listing.type === "JOB" ? "Emploi" : "Immobilier"} ·{" "}
                      {listing.conversions} conversion{listing.conversions > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-primary-dark">
                      {listing.views}
                    </p>
                    <p className="text-[10px] text-gray-400">vues</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Impact du boost — bandeau compact en pleine largeur */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-medium text-primary-dark">Impact du boost</h2>

          {boostImpact && (boostImpact.boostedCount > 0 || boostImpact.regularCount > 0) ? (
            <div className="flex flex-wrap items-center gap-4">
              <div className="rounded-xl bg-primary-mint px-4 py-2.5">
                <p className="text-xs text-primary-dark/70">
                  Boostées ({boostImpact.boostedCount})
                </p>
                <p className="text-lg font-semibold text-primary-dark">
                  {boostImpact.boostedAvgViews} vues / annonce
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-2.5">
                <p className="text-xs text-gray-500">
                  Classiques ({boostImpact.regularCount})
                </p>
                <p className="text-lg font-semibold text-gray-700">
                  {boostImpact.regularAvgViews} vues / annonce
                </p>
              </div>
              {boostDelta !== null && (
                <p className="text-sm font-medium text-accent">
                  +{boostDelta}% de vues en moyenne
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Boostez une annonce pour comparer ses performances.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}