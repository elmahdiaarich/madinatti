"use client";

import { useState } from "react";
import { Calendar, Clock, ArrowRight, Tag } from "lucide-react";

// ─── IMPORTANT: add this to your next.config.js so external images load: ────
// images: {
//   domains: ['images.unsplash.com', 'picsum.photos'],
// }
// OR if using next/image remotePatterns. For plain <img> tags (used here)
// no config is needed — images load directly from the browser.
// If photos still don't show, your network may be blocking these domains.
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = ["Tout", "Ville & Urbanisme", "Emploi", "Immobilier", "Événements", "Services", "Actualités"];

// picsum.photos/seed/<any-word>/width/height — deterministic, always works
const FEATURED = {
  id: 1,
  category: "Ville & Urbanisme",
  title: "Kénitra 2025 : les grands chantiers qui transforment la ville",
  excerpt:
    "Entre le nouveau tramway, la requalification du centre-ville et l'extension de la zone industrielle Atlantic Free Zone, Kénitra entre dans une nouvelle ère de développement urbain.",
  author: "Équipe Madinatti",
  date: "18 juin 2025",
  readTime: "6 min",
  tag: "À la une",
  image: "https://picsum.photos/seed/kenitra/900/560",
};

const ARTICLES = [
  {
    id: 2,
    category: "Emploi",
    title: "Marché de l'emploi à Kénitra : les secteurs qui recrutent en 2025",
    excerpt: "L'automobile, la logistique et le BPO concentrent l'essentiel des offres. Tour d'horizon des opportunités pour les jeunes diplômés.",
    author: "Sarah Benchekroun",
    date: "15 juin 2025",
    readTime: "4 min",
    image: "https://picsum.photos/seed/emploi/600/400",
  },
  {
    id: 3,
    category: "Immobilier",
    title: "Prix de l'immobilier : où en est-on dans les quartiers résidentiels ?",
    excerpt: "Le marché locatif reste dynamique. Les prix au m² varient fortement selon les quartiers. Notre analyse quartier par quartier.",
    author: "Youssef Alaoui",
    date: "12 juin 2025",
    readTime: "5 min",
    image: "https://picsum.photos/seed/immo/600/400",
  },
  {
    id: 4,
    category: "Événements",
    title: "Festival Mawazine : les artistes confirmés pour l'édition de Kénitra",
    excerpt: "La scène kénitroise accueillera plusieurs artistes nationaux et internationaux lors des dates régionales du festival.",
    author: "Lina Mansouri",
    date: "10 juin 2025",
    readTime: "3 min",
    image: "https://picsum.photos/seed/festival/600/400",
  },
  {
    id: 5,
    category: "Services",
    title: "Comment déposer un signalement citoyen sur Madinatti",
    excerpt: "La fonctionnalité de signalement permet à chaque habitant de remonter les problèmes de voirie, d'éclairage ou d'hygiène directement aux services municipaux.",
    author: "Équipe Madinatti",
    date: "8 juin 2025",
    readTime: "3 min",
    image: "https://picsum.photos/seed/services/600/400",
  },
  {
    id: 6,
    category: "Actualités",
    title: "Nouvelle ligne de bus : liaison directe centre-ville / zone industrielle",
    excerpt: "La RATC lance une nouvelle ligne qui facilite le quotidien des milliers de travailleurs de l'Atlantic Free Zone.",
    author: "Équipe Madinatti",
    date: "5 juin 2025",
    readTime: "2 min",
    image: "https://picsum.photos/seed/bus/600/400",
  },
  {
    id: 7,
    category: "Ville & Urbanisme",
    title: "Réaménagement du boulevard Mohammed V : ce qui va changer",
    excerpt: "Les travaux débuteront cet été pour transformer l'axe principal en boulevard semi-piétonnier avec pistes cyclables.",
    author: "Karim Ezziani",
    date: "2 juin 2025",
    readTime: "4 min",
    image: "https://picsum.photos/seed/boulevard/600/400",
  },
];

const CATEGORY_COLORS = {
  "Ville & Urbanisme": { bg: "bg-blue-50",   text: "text-blue-700"    },
  "Emploi":            { bg: "bg-[#E8F5D0]", text: "text-[#2D5016]"  },
  "Immobilier":        { bg: "bg-amber-50",  text: "text-amber-700"  },
  "Événements":        { bg: "bg-purple-50", text: "text-purple-700" },
  "Services":          { bg: "bg-teal-50",   text: "text-teal-700"   },
  "Actualités":        { bg: "bg-gray-100",  text: "text-gray-700"   },
};

function CategoryBadge({ category }) {
  const c = CATEGORY_COLORS[category] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
      {category}
    </span>
  );
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("Tout");

  const filtered =
    activeCategory === "Tout"
      ? ARTICLES
      : ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 pt-14 pb-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A7D129]" />
            <span className="text-xs font-bold text-[#2D5016] uppercase tracking-widest">
              Madinatti Blog
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            La vie de votre ville,{" "}
            <span className="text-[#2D5016]">au fil des jours</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl">
            Actualités locales, guides pratiques, opportunités emploi &amp;
            immobilier — tout ce qui compte pour bien vivre à Kénitra et dans
            les villes marocaines.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── FEATURED ARTICLE ────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-10 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="md:flex">

            {/* Photo — h-56 on mobile, stretches to match text col on md+ */}
            <div className="md:w-2/5 relative h-56 md:h-auto overflow-hidden shrink-0">
              <img
                src={FEATURED.image}
                alt={FEATURED.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D5016]/70 via-[#2D5016]/10 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="flex items-center gap-1.5 bg-[#A7D129] text-[#2D5016] text-xs font-bold px-3 py-1 rounded-full shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D5016]" />
                  {FEATURED.tag}
                </span>
              </div>
            </div>

            <div className="md:w-3/5 p-8 flex flex-col justify-between">
              <div>
                <div className="mb-4">
                  <CategoryBadge category={FEATURED.category} />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#2D5016] transition-colors leading-snug">
                  {FEATURED.title}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {FEATURED.excerpt}
                </p>
              </div>
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {FEATURED.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {FEATURED.readTime} de lecture
                  </span>
                </div>
                <button className="flex items-center gap-1.5 text-sm font-semibold text-[#2D5016] hover:gap-2.5 transition-all">
                  Lire <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CATEGORY FILTER ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[#2D5016] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#A7D129] hover:text-[#2D5016]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── ARTICLE GRID ────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((article) => (
            <article
              key={article.id}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group flex flex-col"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <CategoryBadge category={article.category} />
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 text-[15px] leading-snug mb-2 group-hover:text-[#2D5016] transition-colors flex-1">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {article.readTime}
                    </span>
                  </div>
                  <ArrowRight size={15} className="text-gray-300 group-hover:text-[#2D5016] transition-colors" />
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* ── NEWSLETTER CTA ──────────────────────────────────────────────── */}
        <div className="mt-14 relative overflow-hidden rounded-2xl" style={{ minHeight: "220px" }}>
          <img
            src="https://picsum.photos/seed/newsletter/1200/400"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#2D5016]/85" />
          <div className="relative z-10 p-8 md:p-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Tag size={22} className="text-[#A7D129]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Restez informé de l'actualité de votre ville
            </h2>
            <p className="text-[#A7D129]/80 text-sm mb-6 max-w-md mx-auto">
              Recevez chaque semaine les actualités locales, les nouvelles offres
              d'emploi et les événements à ne pas manquer.
            </p>
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-[#A7D129] transition"
              />
              <button className="bg-[#A7D129] text-[#2D5016] font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#b8e030] transition whitespace-nowrap">
                S'abonner
              </button>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}