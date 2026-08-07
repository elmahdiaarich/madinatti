"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import HeroSearch from "@/components/shared/HeroSearch";
import { FEATURES, SERVICES } from "@/constants/home.constants";

const heroImage =
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=70";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden text-white">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 object-cover"
        />
        <div className="absolute inset-0 bg-[#182A10]/75" />

        <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-1.5 text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-[#A7D129]" />
              La plateforme locale du Maroc
            </div>

            <h1 className="mb-5 max-w-2xl text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Votre ville, <span className="text-[#A7D129]">tous ses services.</span>
            </h1>

            <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/80">
              Emploi, immobilier, événements, santé et bien plus, tout ce dont vous avez besoin à portée de clic.
            </p>

            <HeroSearch />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-10">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Nos services</h2>
          <p className="text-gray-500">Explorez tout ce que Madinatti a à offrir dans votre ville.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((svc, i) => {
            const Icon = svc.icon;

            return (
              <motion.a
                key={svc.id}
                href={svc.href}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                whileHover={{ y: -2 }}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-[var(--color-primary)] hover:shadow-md"
              >
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${svc.color}`}>
                  <Icon size={20} />
                </div>
                <h3 className="mb-1 text-base font-semibold text-gray-900">{svc.label}</h3>
                <p className="mb-4 text-sm text-gray-500">{svc.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {svc.categories.slice(0, 3).map((cat) => (
                    <span key={cat} className="rounded bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600 transition-colors group-hover:bg-[#E8F5D0]">
                      {cat}
                    </span>
                  ))}
                </div>
                <ArrowRight size={16} className="absolute right-5 top-5 text-gray-300 transition-colors group-hover:text-[var(--color-primary-sage)]" />
              </motion.a>
            );
          })}
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,var(--color-primary-dark)_0%,var(--color-primary-sage)_100%)] text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-8 px-6 py-14 md:flex-row">
          <div>
            <h2 className="mb-2 text-2xl font-bold">
              {user ? `Bienvenue, ${user.firstName || user.name || "sur Madinatti"}` : "Vous avez une annonce à publier ?"}
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-white/75">
              {user
                ? "Gérez vos annonces, suivez vos candidatures et consultez vos messages depuis votre espace."
                : "Rejoignez des milliers d'entreprises et de particuliers qui font confiance à Madinatti."}
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            {user ? (
              <>
                <a href="/my-space" className="rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary-dark)] transition-opacity hover:opacity-90">
                  Mon espace
                </a>
                {user.role === "business" && (
                  <a href="/dashboard" className="rounded-lg border border-white/30 px-6 py-3 text-sm text-white transition-colors hover:bg-white/10">
                    Dashboard
                  </a>
                )}
              </>
            ) : (
              <>
                <a href="/auth/register" className="rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-[var(--color-primary-dark)] transition-opacity hover:opacity-90">
                  Créer un compte
                </a>
                <a href="/auth/login" className="rounded-lg border border-white/30 px-6 py-3 text-sm text-white transition-colors hover:bg-white/10">
                  Se connecter
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 text-center">
          <span className="inline-flex items-center rounded-full bg-[var(--color-primary-mint)] px-4 py-1 text-sm font-medium text-[var(--color-primary-dark)]">
            Une plateforme pour toute la ville
          </span>
          <h2 className="mt-4 text-4xl font-bold text-gray-900">
            Tout ce dont vous avez besoin, <span className="text-[var(--color-primary)]">au même endroit</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Madinatti centralise les services, opportunités et informations locales pour simplifier votre quotidien.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:auto-rows-[280px]">
          {FEATURES.map((item) => (
            <div key={item.title} className={`group relative min-h-[260px] overflow-hidden rounded-lg ${item.span}`}>
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="mb-2 text-lg font-bold leading-tight text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/80">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq-contact" className="border-t border-gray-100 bg-gray-50 px-6 py-20">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-12 md:grid-cols-2">
          <div id="faq">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Aide & FAQ</h2>
            <div className="space-y-4">
              {[
                ["Comment publier une annonce sur Madinatti ?", "Pour publier une annonce, vous devez créer un compte professionnel. Une fois connecté, cliquez sur Publier une annonce et remplissez les détails de votre offre."],
                ["Quels sont les frais de publication ?", "La publication d'annonces de base est entièrement gratuite. Des options de mise en avant payantes sont disponibles pour augmenter la visibilité de vos offres."],
                ["Comment contacter un annonceur ?", "Vous pouvez contacter directement l'annonceur par téléphone ou par email en utilisant les boutons de contact disponibles sur la page de détails de chaque annonce."],
              ].map(([question, answer]) => (
                <details key={question} className="group rounded-lg border border-gray-100 bg-white p-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between focus:outline-none">
                    <h3 className="text-sm font-semibold text-gray-800">{question}</h3>
                    <span className="ml-1.5 shrink-0 rounded-full bg-gray-50 p-1 text-gray-400 transition group-open:rotate-180">
                      <ChevronDown size={14} />
                    </span>
                  </summary>
                  <p className="mt-3 text-xs leading-relaxed text-gray-500">{answer}</p>
                </details>
              ))}
            </div>
          </div>

          <div id="contact" className="flex flex-col justify-between">
            <div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Nous contacter</h2>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                Une question, une suggestion ou besoin d&apos;assistance ? Notre équipe est à votre écoute pour vous aider à tout moment.
              </p>
              <div className="space-y-3 text-sm text-gray-600">
                <p><span className="font-semibold text-[#2D5016]">Téléphone:</span> +212 5 37 37 12 34</p>
                <p><span className="font-semibold text-[#2D5016]">Email:</span> contact@madinatti.ma</p>
                <p><span className="font-semibold text-[#2D5016]">Adresse:</span> CCIS, Avenue Mohammed Diouri, Kénitra</p>
              </div>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="mt-8 space-y-3 rounded-lg border border-gray-100 bg-white p-6 shadow-xs">
              <input type="text" placeholder="Votre nom" className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-[#2D5016]" />
              <input type="email" placeholder="Votre email" className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-[#2D5016]" />
              <textarea placeholder="Votre message" rows={3} className="w-full resize-none rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-xs outline-none focus:border-[#2D5016]" />
              <button className="w-full rounded-lg bg-[#2D5016] py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1e3a0f]">
                Envoyer le message
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
