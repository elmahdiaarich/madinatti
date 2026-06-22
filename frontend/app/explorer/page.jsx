"use client";

import { useState } from "react";
import {
  Briefcase, Home, Car, Heart, Utensils, GraduationCap,
  Newspaper, MapPin, Factory, Map, Star, Users,
  ArrowRight, Zap, Search,
} from "lucide-react";

const CITIES = ["Kénitra", "Rabat", "Salé", "Casablanca", "Tanger", "Marrakech", "Agadir"];

const STATS = [
  { label: "Offres d'emploi",      value: "1 240+", icon: Briefcase },
  { label: "Annonces immobilier",  value: "430+",   icon: Home      },
  { label: "Villes couvertes",     value: "7",      icon: MapPin    },
  { label: "Utilisateurs actifs",  value: "12 000+",icon: Users     },
];

// Hero city photos for the top banner
const CITY_PHOTOS = [
  "https://images.unsplash.com/photo-1559561853-08451507cbe7?w=1400&q=80", // Moroccan medina
  "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=1400&q=80", // Morocco street
];

const MODULES = [
  {
    id: "emploi",
    label: "Emploi",
    icon: Briefcase,
    color: "green",
    href: "/jobs",
    stat: "1 240 offres",
    live: true,
    description: "Offres d'emploi, formations, mini-jobs et accompagnement professionnel.",
    highlights: ["CDI / CDD", "Stage", "Freelance", "Formation"],
    photo: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&q=80",
  },
  {
    id: "immobilier",
    label: "Immobilier",
    icon: Home,
    color: "blue",
    href: "/real-estate",
    stat: "430 annonces",
    live: true,
    description: "Vente, location et achat de biens immobiliers dans votre ville.",
    highlights: ["Appartements", "Maisons", "Bureaux", "Artisans"],
    photo: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80",
  },
  {
    id: "automobile",
    label: "Automobile",
    icon: Car,
    color: "amber",
    href: "/voitures",
    stat: "Bientôt",
    description: "Véhicules d'occasion, neuf, motos et actualité automobile locale.",
    highlights: ["Occasion", "Neuf", "Motos", "Pièces"],
    photo: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80",
  },
  {
    id: "sante",
    label: "Santé",
    icon: Heart,
    color: "red",
    href: "/sante",
    stat: "Bientôt",
    description: "Cliniques, médecins, pharmacies et pharmacie de garde près de vous.",
    highlights: ["Cliniques", "Médecins", "Pharmacies", "Para"],
    photo: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&q=80",
  },
  {
    id: "tourisme",
    label: "Tourisme",
    icon: Utensils,
    color: "teal",
    href: "/tourisme",
    stat: "Bientôt",
    description: "Hôtels, restaurants, cafés, musées et spas de votre région.",
    highlights: ["Hôtels", "Restaurants", "Cafés", "Musées"],
    photo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
  },
  {
    id: "evenements",
    label: "Événements",
    icon: Star,
    color: "purple",
    href: "/evenements",
    stat: "Bientôt",
    description: "Concerts, théâtre, marchés, activités enfants et galeries.",
    highlights: ["Théâtre", "Concerts", "Marchés", "Enfants"],
    photo: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
  },
  {
    id: "education",
    label: "Éducation",
    icon: GraduationCap,
    color: "indigo",
    href: "/education",
    stat: "Bientôt",
    description: "Cours particuliers, écoles privées, universités et centres de langues.",
    highlights: ["Cours privés", "Langues", "Universités", "Lycées"],
    photo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80",
  },
  {
    id: "presse",
    label: "Actualités",
    icon: Newspaper,
    color: "gray",
    href: "/presse",
    stat: "Bientôt",
    description: "Journaux, presse locale, télévision et radio de votre ville.",
    highlights: ["Presse", "Radio", "TV locale", "Blog"],
    photo: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&q=80",
  },
  {
    id: "annuaire",
    label: "Annuaire",
    icon: Users,
    color: "slate",
    href: "/annuaire",
    stat: "Bientôt",
    description: "Mairie, administrations, services publics et commerces locaux.",
    highlights: ["Mairie", "Police", "Impôts", "Tourisme"],
    photo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80",
  },
  {
    id: "industrie",
    label: "Industrie",
    icon: Factory,
    color: "orange",
    href: "/industrie",
    stat: "Bientôt",
    description: "Zone industrielle, Free Zone et chambre de commerce.",
    highlights: ["Zone ind.", "Free Zone", "CCI", "Export"],
    photo: "https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=600&q=80",
  },
  {
    id: "plan",
    label: "Plan de Ville",
    icon: Map,
    color: "cyan",
    href: "/plan",
    stat: "Bientôt",
    description: "Carte interactive des rues, monuments et points d'intérêt.",
    highlights: ["Carte", "Rues", "Monuments", "GPS"],
    photo: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=600&q=80",
  },
  {
    id: "signalements",
    label: "Signalements",
    icon: MapPin,
    color: "rose",
    href: "/signalements",
    stat: "Bientôt",
    description: "Signalez les problèmes de voirie, éclairage et propreté à la commune.",
    highlights: ["Voirie", "Éclairage", "Propreté", "Eau"],
    photo: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80",
  },
];

const COLOR_MAP = {
  green:  { icon: "text-[#2D5016]",   badge: "bg-[#2D5016] text-white",     pill: "bg-[#E8F5D0] text-[#2D5016]",   overlay: "from-[#2D5016]/80" },
  blue:   { icon: "text-blue-700",    badge: "bg-blue-700 text-white",       pill: "bg-blue-50 text-blue-700",       overlay: "from-blue-900/80"  },
  amber:  { icon: "text-amber-700",   badge: "bg-amber-600 text-white",      pill: "bg-amber-50 text-amber-700",     overlay: "from-amber-900/80" },
  red:    { icon: "text-red-700",     badge: "bg-red-700 text-white",        pill: "bg-red-50 text-red-700",         overlay: "from-red-900/80"   },
  teal:   { icon: "text-teal-700",    badge: "bg-teal-700 text-white",       pill: "bg-teal-50 text-teal-700",       overlay: "from-teal-900/80"  },
  purple: { icon: "text-purple-700",  badge: "bg-purple-700 text-white",     pill: "bg-purple-50 text-purple-700",   overlay: "from-purple-900/80"},
  indigo: { icon: "text-indigo-700",  badge: "bg-indigo-700 text-white",     pill: "bg-indigo-50 text-indigo-700",   overlay: "from-indigo-900/80"},
  gray:   { icon: "text-gray-600",    badge: "bg-gray-600 text-white",       pill: "bg-gray-100 text-gray-600",      overlay: "from-gray-900/80"  },
  slate:  { icon: "text-slate-600",   badge: "bg-slate-600 text-white",      pill: "bg-slate-100 text-slate-600",    overlay: "from-slate-900/80" },
  orange: { icon: "text-orange-700",  badge: "bg-orange-600 text-white",     pill: "bg-orange-50 text-orange-700",   overlay: "from-orange-900/80"},
  cyan:   { icon: "text-cyan-700",    badge: "bg-cyan-700 text-white",       pill: "bg-cyan-50 text-cyan-700",       overlay: "from-cyan-900/80"  },
  rose:   { icon: "text-rose-700",    badge: "bg-rose-700 text-white",       pill: "bg-rose-50 text-rose-700",       overlay: "from-rose-900/80"  },
};

export default function ExplorerPage() {
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Kénitra");

  const filtered = MODULES.filter(
    (m) =>
      query === "" ||
      m.label.toLowerCase().includes(query.toLowerCase()) ||
      m.description.toLowerCase().includes(query.toLowerCase()),
  );

  const available = filtered.filter((m) => m.live);
  const coming    = filtered.filter((m) => !m.live);

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── HERO WITH PHOTO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-16 px-6">
        <img
          src={CITY_PHOTOS[0]}
          alt="Ville marocaine"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2D5016]/80 via-[#2D5016]/70 to-gray-50" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-[#A7D129]" />
            <span className="text-xs font-bold text-[#A7D129] uppercase tracking-widest">
              Explorer Madinatti
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
            Tous les services de votre ville,{" "}
            <span className="text-[#A7D129]">en un seul endroit</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mb-8">
            Emploi, immobilier, santé, événements… Madinatti centralise les
            services locaux pour les citoyens, les entreprises et les visiteurs.
          </p>

          {/* Search + city */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un service..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/20 text-sm focus:outline-none focus:border-[#A7D129] transition bg-white text-gray-800 shadow-sm"
              />
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-3 rounded-xl border border-white/20 text-sm bg-white text-gray-700 focus:outline-none focus:border-[#A7D129] transition shadow-sm"
            >
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-16">

        {/* ── STATS BAR ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-6 mb-12 relative z-10">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-[#E8F5D0] flex items-center justify-center shrink-0">
                <Icon size={18} className="text-[#2D5016]" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── AVAILABLE MODULES — photo cards ───────────────────────────── */}
        {available.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-[#A7D129]" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
                Disponible maintenant
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {available.map((mod) => {
                const Icon = mod.icon;
                const c = COLOR_MAP[mod.color];
                return (
                  <a
                    key={mod.id}
                    href={mod.href}
                    className="relative rounded-2xl overflow-hidden group block h-64 shadow-sm hover:shadow-lg transition-shadow"
                  >
                    {/* Background photo */}
                    <img
                      src={mod.photo}
                      alt={mod.label}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Gradient overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-t ${c.overlay} to-transparent`} />

                    {/* Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      {/* Top row */}
                      <div className="flex items-start justify-between">
                        <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          <Icon size={22} className="text-white" />
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.badge} shadow-sm`}>
                          {mod.stat}
                        </span>
                      </div>

                      {/* Bottom */}
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">{mod.label}</h3>
                        <p className="text-white/70 text-sm mb-3 line-clamp-2">{mod.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            {mod.highlights.map((h) => (
                              <span key={h} className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/20">
                                {h}
                              </span>
                            ))}
                          </div>
                          <ArrowRight size={18} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                        </div>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COMING SOON — photo thumbnails ────────────────────────────── */}
        {coming.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                Prochainement
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {coming.map((mod) => {
                const Icon = mod.icon;
                const c = COLOR_MAP[mod.color];
                return (
                  <div
                    key={mod.id}
                    className="relative rounded-2xl overflow-hidden h-36 group"
                  >
                    <img
                      src={mod.photo}
                      alt={mod.label}
                      className="absolute inset-0 w-full h-full object-cover grayscale opacity-60"
                    />
                    <div className="absolute inset-0 bg-black/50" />

                    <div className="absolute inset-0 p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                          <Icon size={16} className="text-white" />
                        </div>
                        <span className="text-[10px] bg-white/20 backdrop-blur-sm text-white font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                          Bientôt
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm mb-1.5">{mod.label}</h3>
                        <div className="flex flex-wrap gap-1">
                          {mod.highlights.slice(0, 3).map((h) => (
                            <span key={h} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CITY CTA ──────────────────────────────────────────────────── */}
        <div className="mt-12 relative rounded-2xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1578895101408-1a36b834405b?w=1200&q=80"
            alt="Ville marocaine"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#2D5016]/85" />
          <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <MapPin size={26} className="text-[#A7D129]" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">
                  Votre ville n'est pas encore couverte ?
                </h2>
                <p className="text-white/60 text-sm mt-0.5">
                  Madinatti s'étend progressivement à d'autres villes marocaines.
                  Signalez votre intérêt.
                </p>
              </div>
            </div>
            <a
              href="/auth/register"
              className="shrink-0 bg-[#A7D129] text-[#2D5016] font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#b8e030] transition-colors flex items-center gap-2 shadow-md"
            >
              Rejoindre la liste <ArrowRight size={15} />
            </a>
          </div>
        </div>

      </div>
    </main>
  );
}