"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronDown,
  ArrowRight,
  Briefcase,
  Home as HomeIcon,
  Calendar,
  Car,
  Hotel,
  Heart,
  FileText,
  Newspaper,
  BookOpen,
  Factory,
  Map,
} from "lucide-react";
import { cities } from "morocco-cities";

const ALL_CITIES = cities.map((c) => ({ name: c.name, region: c.region_name }));

const SERVICES = [
  {
    id: "emploi",
    icon: Briefcase,
    label: "Emploi",
    description: "Offres, formations & mini-jobs",
    href: "/jobs",
    color: "bg-blue-50 text-blue-600",
    categories: [
      "Offres d'emploi",
      "Formation",
      "Mini-jobs",
      "Accompagnement",
      "Demande d'emploi",
    ],
  },
  {
    id: "immobilier",
    icon: HomeIcon,
    label: "Immobilier",
    description: "Vente, location & déménagement",
    href: "/real-estate",
    color: "bg-orange-50 text-orange-600",
    categories: [
      "Vendre appartement",
      "Acheter appartement",
      "Louer maison",
      "Déménagement",
      "Artisans",
    ],
  },
  {
    id: "evenements",
    icon: Calendar,
    label: "Événements",
    description: "Sorties, concerts & culture",
    href: "/evenements",
    color: "bg-purple-50 text-purple-600",
    categories: [
      "Théâtre",
      "Concert",
      "Marché",
      "Activités enfants",
      "Galerie",
    ],
  },
  {
    id: "voitures",
    icon: Car,
    label: "Automobile",
    description: "Véhicules neufs & occasion",
    href: "/voitures",
    color: "bg-red-50 text-red-600",
    categories: ["Voitures occasion", "Voitures neuves", "Motos", "Auto info"],
  },
  {
    id: "tourisme",
    icon: Hotel,
    label: "Tourisme",
    description: "Hôtels, restaurants & loisirs",
    href: "/tourisme",
    color: "bg-teal-50 text-teal-600",
    categories: ["Hôtels", "Restaurants", "Cafés", "Musées", "Spas & Hammams"],
  },
  {
    id: "sante",
    icon: Heart,
    label: "Santé",
    description: "Cliniques, pharmacies & soins",
    href: "/sante",
    color: "bg-pink-50 text-pink-600",
    categories: [
      "Cliniques",
      "Médecine",
      "Pharmacies",
      "Pharmacie de garde",
      "Para",
    ],
  },
  {
    id: "annonces",
    icon: FileText,
    label: "Petites Annonces",
    description: "Services à domicile & particuliers",
    href: "/annonces",
    color: "bg-yellow-50 text-yellow-600",
    categories: [
      "Ménage & nettoyage",
      "Garde d'enfants",
      "Cours particuliers",
      "Soins seniors",
    ],
  },
  {
    id: "presse",
    icon: Newspaper,
    label: "Actualités",
    description: "Presse, TV, radio & vidéo",
    href: "/presse",
    color: "bg-indigo-50 text-indigo-600",
    categories: ["Journaux", "Presse locale", "Télé locale", "Radio locale"],
  },
  {
    id: "annuaire",
    icon: BookOpen,
    label: "Annuaire",
    description: "Entreprises & services publics",
    href: "/annuaire",
    color: "bg-emerald-50 text-emerald-600",
    categories: ["Mairie", "Police", "Bureau des impôts", "Office de tourisme"],
  },
  {
    id: "industrie",
    icon: Factory,
    label: "Industrie",
    description: "Zones industrielles & commerce",
    href: "/industrie",
    color: "bg-gray-100 text-gray-600",
    categories: ["Zone industrielle", "Free Zone", "Chambre de commerce"],
  },
  {
    id: "plan",
    icon: Map,
    label: "Plan de Ville",
    description: "Cartes, rues & monuments",
    href: "/plan",
    color: "bg-cyan-50 text-cyan-600",
    categories: [
      "Plan de ville",
      "Rues & boulevards",
      "Monuments",
      "Navigation",
    ],
  },
];

const STATS = [
  { value: "300+", label: "Villes couvertes" },
  { value: "50k+", label: "Annonces actives" },
  { value: "11", label: "Catégories" },
  { value: "100%", label: "Marocain" },
];

const ACTORS = [
  {
    role: "Visiteur",
    icon: "👁️",
    color: "bg-gray-50 border-gray-200",
    badge: "bg-gray-100 text-gray-600",
    actions: [
      "Consulter les annonces publiques",
      "Explorer les services par ville",
      "Voir les événements & actualités",
      "Accéder au plan de ville",
    ],
  },
  {
    role: "Citoyen",
    icon: "🙋",
    color: "bg-blue-50 border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    actions: [
      "Tout ce que le visiteur peut faire",
      "Postuler aux offres d'emploi",
      "Gérer ses favoris & son profil",
      "Soumettre des signalements",
      "Contacter des annonceurs",
    ],
  },
  {
    role: "Entreprise",
    icon: "🏢",
    color: "bg-[var(--color-primary-mint)] border-[var(--color-primary)]",
    badge: "bg-[var(--color-primary-mint)] text-[var(--color-primary-dark)]",
    highlight: true,
    actions: [
      "Publier des offres d'emploi",
      "Mettre en ligne des annonces",
      "Gérer ses services & produits",
      "Accéder aux statistiques",
      "Promouvoir son activité",
    ],
  },
  {
    role: "Administrateur",
    icon: "🛡️",
    color: "bg-red-50 border-red-200",
    badge: "bg-red-100 text-red-700",
    actions: [
      "Modérer les contenus publiés",
      "Gérer les utilisateurs",
      "Accéder au tableau de bord CMS",
      "Valider les annonces",
      "Configurer la plateforme",
    ],
  },
];

const FEATURES = [
  {
    title: "Trouver un logement",
    icon: "🏠",
    description:
      "Explorez des appartements, villas, terrains et biens immobiliers dans votre ville.",
  },
  {
    title: "Découvrir des opportunités",
    icon: "💼",
    description:
      "Consultez les offres d'emploi et les opportunités professionnelles locales.",
  },
  {
    title: "Développer votre activité",
    icon: "🏢",
    description:
      "Publiez vos annonces, présentez vos services et gagnez en visibilité.",
  },
  {
    title: "Vivre votre ville",
    icon: "📍",
    description:
      "Retrouvez événements, actualités, entreprises et services à proximité.",
  },
];

function CityDropdown({ selectedCity, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const filtered =
    query.length > 0
      ? ALL_CITIES.filter((c) =>
          c.name.toLowerCase().includes(query.toLowerCase()),
        ).slice(0, 8)
      : [];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative flex-none" ref={ref} style={{ zIndex: 100 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-3 py-2.5 text-sm w-48 hover:border-gray-300 transition-colors"
      >
        <MapPin
          size={14}
          className="text-[var(--color-primary-sage)] flex-shrink-0"
        />
        <span className="flex-1 text-left truncate">
          {selectedCity ? selectedCity.name : "Toutes les villes"}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            // position fixed so it escapes any overflow:hidden parent
            style={{ position: "fixed", zIndex: 9999, width: "256px" }}
            className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
            ref={(el) => {
              if (el && ref.current) {
                const btn = ref.current.getBoundingClientRect();
                el.style.top = btn.bottom + 6 + "px";
                el.style.left = btn.left + "px";
              }
            }}
          >
            <div className="p-2">
              <input
                autoFocus
                type="text"
                placeholder="Rechercher une ville..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full text-primary-dark bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Toutes les villes
              </button>
              {filtered.length > 0 ? (
                filtered.map((c) => (
                  <button
                    key={c.name + c.region}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--color-primary-mint)] transition-colors"
                  >
                    <span className="font-medium text-gray-900">{c.name}</span>
                    <span className="text-xs text-gray-400 ml-1">
                      — {c.region}
                    </span>
                  </button>
                ))
              ) : query.length > 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">
                  Aucune ville trouvée
                </p>
              ) : (
                <p className="px-4 py-3 text-sm text-gray-400">
                  Tapez pour rechercher…
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomePage() {
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const quickTags = [
    "Emploi à Rabat",
    "Appartement à Casablanca",
    "Événements à Marrakech",
    "Pharmacie de garde",
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,var(--color-primary-dark)_0%,var(--color-primary-sage)_100%)] text-white">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10 pointer-events-none"
          style={{ background: "var(--color-primary)" }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 pointer-events-none"
          style={{ background: "var(--color-primary)" }}
        />

        <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
              La plateforme locale du Maroc
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5 max-w-2xl">
              Votre ville,{" "}
              <span style={{ color: "var(--color-primary)" }}>
                tous ses services.
              </span>
            </h1>

            <p className="text-lg text-white/75 max-w-xl mb-10 leading-relaxed">
              Emploi, immobilier, événements, santé et bien plus — tout ce dont
              vous avez besoin, à portée de clic.
            </p>

            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3 max-w-2xl bg-white rounded-2xl p-2 shadow-xl"
            >
              <CityDropdown
                selectedCity={selectedCity}
                onSelect={setSelectedCity}
              />
              <div className="hidden sm:block w-px bg-gray-200 my-1" />
              <input
                type="text"
                placeholder="Chercher un service, une offre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm text-gray-800 bg-transparent outline-none placeholder-gray-400 min-w-0"
              />
              <button
                type="submit"
                className="flex-none bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary-sage)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Search size={15} />
                Rechercher
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-5">
              {quickTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <p className="text-3xl font-bold text-[var(--color-primary-dark)]">
                {s.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Nos services
          </h2>
          <p className="text-gray-500">
            Explorez tout ce que Madinatti a à offrir dans votre ville.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <motion.a
                key={svc.id}
                href={svc.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-primary-mint) 0%, transparent 60%)",
                  }}
                />
                <div className="relative">
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${svc.color}`}
                  >
                    <Icon size={20} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base mb-1">
                    {svc.label}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {svc.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {svc.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="text-xs bg-gray-100 group-hover:bg-white/70 text-gray-600 rounded-full px-2.5 py-0.5 transition-colors"
                      >
                        {cat}
                      </span>
                    ))}
                    {svc.categories.length > 3 && (
                      <span className="text-xs text-gray-400 px-1 py-0.5">
                        +{svc.categories.length - 3}
                      </span>
                    )}
                  </div>
                  <ArrowRight
                    size={16}
                    className="absolute top-0 right-0 text-gray-300 group-hover:text-[var(--color-primary-sage)] transition-colors"
                  />
                </div>
              </motion.a>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[linear-gradient(135deg,var(--color-primary-dark)_0%,var(--color-primary-sage)_100%)] text-white">
        <div className="max-w-5xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Vous avez une annonce à publier ?
            </h2>
            <p className="text-white/70 text-sm max-w-md leading-relaxed">
              Rejoignez des milliers d'entreprises et de particuliers qui font
              confiance à Madinatti pour toucher leurs concitoyens.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <a
              href="/auth/register"
              className="bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-dark)] font-semibold px-6 py-3 rounded-xl text-sm transition-opacity"
            >
              Créer un compte
            </a>
            <a
              href="/auth/login"
              className="border border-white/30 hover:bg-white/10 text-white px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Se connecter
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="inline-flex items-center rounded-full bg-[var(--color-primary-mint)] px-4 py-1 text-sm font-medium text-[var(--color-primary-dark)]">
            Une plateforme pour toute la ville
          </span>

          <h2 className="mt-4 text-4xl font-bold text-gray-900">
            Tout ce dont vous avez besoin,
            <span className="text-[var(--color-primary)]">
              {" "}
              au même endroit
            </span>
          </h2>

          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Madinatti centralise les services, opportunités et informations
            locales pour simplifier votre quotidien.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-mint)] flex items-center justify-center text-2xl mb-5">
                {item.icon}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {item.title}
              </h3>

              <p className="text-sm text-gray-600 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
