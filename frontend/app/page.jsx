"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation"; // Added for routing
import { motion, AnimatePresence } from "framer-motion";
import { Search, MapPin, ChevronDown, ArrowRight } from "lucide-react";
import { cities } from "morocco-cities";
import { useAuth } from "@/context/AuthContext";
import HeroSearch from "@/components/shared/HeroSearch";
import { SERVICES, STATS, FEATURES } from "@/constants/home.constants";

const ALL_CITIES = cities.map((c) => ({ name: c.name, region: c.region_name }));
const Services = SERVICES;
const Stats = STATS;
const Features = FEATURES;

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter(); // Access Next.js router
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // const handleSearch = (e) => {
  //   e.preventDefault();

  //   // Build query params securely
  //   const params = new URLSearchParams();
  //   if (selectedCity) params.set("city", selectedCity.name);
  //   if (searchQuery) params.set("search", searchQuery);

  //   // Default main fallback for general search bar could route directly to real-estate
  //   // or you can configure it dynamically based on selected tabs later
  //   router.push(`/real-estate?${params.toString()}`);
  // };

  // const quickTags = [
  //   "Emploi à Rabat",
  //   "Appartement à Casablanca",
  //   "Événements à Marrakech",
  //   "Pharmacie de garde",
  // ];

  return (
    <main className="min-h-screen bg-white">
      {/* HERO */}
<section className="relative overflow-hidden text-white" style={{
  background: 'linear-gradient(135deg, #2D5016 0%, #7BA428 100%)'
}}>

  {/* Dot grid */}
  <div
    className="absolute inset-0"
    style={{
      backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1.5px, transparent 1.5px)`,
      backgroundSize: '24px 24px',
    }}
  />

  {/* Glow top right */}
  <div style={{
    position: 'absolute',
    top: '-160px',
    right: '-160px',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(167,209,41,0.35) 0%, transparent 70%)',
    pointerEvents: 'none',
  }} />

  {/* Glow bottom left */}
  <div style={{
    position: 'absolute',
    bottom: '-120px',
    left: '-120px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,0,0,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  }} />

  {/* Content */}
  <div className="relative max-w-5xl mx-auto px-6 py-20 md:py-28">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '9999px',
        padding: '6px 16px',
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '24px',
      }}>
        <span style={{
          width: '8px', height: '8px',
          borderRadius: '50%',
          background: '#A7D129',
          display: 'inline-block',
          animation: 'pulse 2s infinite',
        }} />
        La plateforme locale du Maroc 🇲🇦
      </div>

      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-5 max-w-2xl">
        Votre ville,{' '}
        <span style={{ color: '#A7D129' }}>
          tous ses services.
        </span>
      </h1>

      <p style={{ color: 'rgba(255,255,255,0.75)' }} className="text-lg max-w-xl mb-10 leading-relaxed">
        Emploi, immobilier, événements, santé et bien plus — tout ce dont vous avez besoin, à portée de clic.
      </p>

      <HeroSearch />

    </motion.div>
  </div>
</section>
      {/* STATS SECTION OMITTED FOR SPACE... */}

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
          {Services.map((svc, i) => {
            const Icon = svc.icon;

            // Generate the link dynamically appending selected city query parameter
            const dynamicHref = selectedCity
              ? `${svc.href}?city=${encodeURIComponent(selectedCity.name)}`
              : svc.href;

            return (
              <motion.a
                key={svc.id}
                href={dynamicHref} // Updated link
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                className="group relative bg-white border border-gray-200 rounded-2xl p-5 hover:border-[var(--color-primary)] hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Content inner items remain identical */}
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
      {!user ? (
        <section className="bg-[linear-gradient(135deg,var(--color-primary-dark)_0%,var(--color-primary-sage)_100%)] text-white">
          <div className="max-w-5xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Vous avez une annonce à publier ?
              </h2>
              <p className="text-white/70 text-sm max-w-md leading-relaxed">
                Rejoignez des milliers d'entreprises et de particuliers qui font
                confiance à Madinatti.
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
      ) : (
        <section className="bg-[linear-gradient(135deg,var(--color-primary-dark)_0%,var(--color-primary-sage)_100%)] text-white">
          <div className="max-w-5xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Bienvenue, {user.firstName || user.name || "sur Madinatti"} 👋
              </h2>
              <p className="text-white/70 text-sm max-w-md leading-relaxed">
                Gérez vos annonces, suivez vos candidatures et consultez vos
                messages depuis votre espace.
              </p>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <a
                href="/my-space"
                className="bg-[var(--color-primary)] hover:opacity-90 text-[var(--color-primary-dark)] font-semibold px-6 py-3 rounded-xl text-sm transition-opacity"
              >
                Mon espace
              </a>
              {user.role === "business" && (
                <a
                  href="/dashboard"
                  className="border border-white/30 hover:bg-white/10 text-white px-6 py-3 rounded-xl text-sm transition-colors"
                >
                  Dashboard
                </a>
              )}
            </div>
          </div>
        </section>
      )}

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[280px]">
          {Features.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`group relative overflow-hidden rounded-3xl ${item.span}`}
            >
              {/* Background image */}
              <img
                src={item.image}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

              {/* Green accent top bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-white font-bold text-lg mb-2 leading-tight">
                  {item.title}
                </h3>
                <p className="text-white/75 text-sm leading-relaxed transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
            {/* FAQ & CONTACT */}
     <section id="faq-contact" className="bg-gray-50 border-t border-gray-100 py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* FAQ */}
          <div id="faq">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Aide & FAQ</h2>
            <div className="space-y-4">
              <details className="group rounded-2xl bg-white border border-gray-100 p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="font-semibold text-sm text-gray-800">Comment publier une annonce sur Madinatti ?</h3>
                  <span className="ml-1.5 flex-shrink-0 rounded-full bg-gray-50 p-1 text-gray-400 group-open:rotate-180 transition">
                    <ChevronDown size={14} />
                  </span>
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  Pour publier une annonce, vous devez créer un compte professionnel. Une fois connecté, cliquez sur "Publier une annonce" dans la barre de navigation et remplissez les détails de votre offre.
                </p>
              </details>

              <details className="group rounded-2xl bg-white border border-gray-100 p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="font-semibold text-sm text-gray-800">Quels sont les frais de publication ?</h3>
                  <span className="ml-1.5 flex-shrink-0 rounded-full bg-gray-50 p-1 text-gray-400 group-open:rotate-180 transition">
                    <ChevronDown size={14} />
                  </span>
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  La publication d'annonces de base est entièrement gratuite. Des options de mise en avant payantes sont disponibles pour augmenter la visibilité de vos offres.
                </p>
              </details>

              <details className="group rounded-2xl bg-white border border-gray-100 p-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex items-center justify-between cursor-pointer focus:outline-none">
                  <h3 className="font-semibold text-sm text-gray-800">Comment contacter un annonceur ?</h3>
                  <span className="ml-1.5 flex-shrink-0 rounded-full bg-gray-50 p-1 text-gray-400 group-open:rotate-180 transition">
                    <ChevronDown size={14} />
                  </span>
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  Vous pouvez contacter directement l'annonceur par téléphone ou par email en utilisant les boutons de contact disponibles sur la page de détails de chaque annonce.
                </p>
              </details>
            </div>
          </div>

         {/* CONTACT */}
          <div id="contact" className="flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Nous contacter</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Une question, une suggestion ou besoin d'assistance ? Notre équipe est à votre écoute pour vous aider à tout moment. Remplissez le formulaire de contact ou utilisez nos coordonnées directes.
              </p>
              <div className="space-y-3 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-[#2D5016]">Téléphone:</span> +212 5 37 37 12 34
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-[#2D5016]">Email:</span> contact@madinatti.ma
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold text-[#2D5016]">Adresse:</span> CCIS, Avenue Mohammed Diouri, Kénitra
                </p>
              </div>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="mt-8 space-y-3 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
              <input type="text" placeholder="Votre nom" className="w-full text-xs rounded-xl border border-gray-100 px-3 py-2 outline-none focus:border-[#2D5016] bg-gray-50" />
              <input type="email" placeholder="Votre email" className="w-full text-xs rounded-xl border border-gray-100 px-3 py-2 outline-none focus:border-[#2D5016] bg-gray-50" />
              <textarea placeholder="Votre message" rows={3} className="w-full text-xs rounded-xl border border-gray-100 px-3 py-2 outline-none focus:border-[#2D5016] bg-gray-50 resize-none" />
              <button className="w-full py-2 bg-[#2D5016] text-white text-xs font-bold rounded-xl hover:bg-[#1e3a0f] transition shadow-sm">
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
