"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Logo from "./logos/Logo";

const NAV_SERVICES = [
  {
    label: "Emploi",
    href: "/jobs",
    categories: [
      "Offres d'emploi",
      "Formation",
      "Mini-jobs",
      "Accompagnement",
      "Demande d'emploi",
    ],
  },
  {
    label: "Immobilier",
    href: "/real-estate",
    categories: [
      "Vendre appartement",
      "Acheter appartement",
      "Louer maison",
      "Déménagement",
      "Artisans",
    ],
  },
  {
    label: "Événements",
    href: "/evenements",
    categories: [
      "Théâtre",
      "Concert",
      "Marché",
      "Activités enfants",
      "Galerie",
    ],
  },
  {
    label: "Automobile",
    href: "/voitures",
    categories: ["Voitures occasion", "Voitures neuves", "Motos", "Auto info"],
  },
  {
    label: "Tourisme",
    href: "/tourisme",
    categories: ["Hôtels", "Restaurants", "Cafés", "Musées", "Spas & Hammams"],
  },
  {
    label: "Santé",
    href: "/sante",
    categories: [
      "Cliniques",
      "Médecine",
      "Pharmacies",
      "Pharmacie de garde",
      "Para",
    ],
  },
  {
    label: "Petites Annonces",
    href: "/annonces",
    categories: [
      "Ménage & nettoyage",
      "Garde d'enfants",
      "Cours particuliers",
      "Soins seniors",
    ],
  },
  {
    label: "Actualités",
    href: "/presse",
    categories: ["Journaux", "Presse locale", "Télé locale", "Radio locale"],
  },
  {
    label: "Annuaire",
    href: "/annuaire",
    categories: ["Mairie", "Police", "Bureau des impôts", "Office de tourisme"],
  },
  {
    label: "Industrie",
    href: "/industrie",
    categories: ["Zone industrielle", "Free Zone", "Chambre de commerce"],
  },
  {
    label: "Plan de Ville",
    href: "/plan",
    categories: [
      "Plan de ville",
      "Rues & boulevards",
      "Monuments",
      "Navigation",
    ],
  },
];

// ── Admin shield icon ──────────────────────────────────────────────────────────
const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />
    <path d="M9 12l2 2l4 -4" />
  </svg>
)

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [openServices, setOpenServices] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeService, setActiveService] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenServices(false);
        setActiveService(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const isActive = (path) => pathname === path;
  const role = user?.role;

  return (
    <nav
      className={`bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 transition-shadow ${scrolled ? "shadow-md" : ""}`}
    >
      {/* LOGO */}
      <a href="/" className="flex items-center gap-2 scale-75 origin-left">
        <Logo />
      </a>

      {/* DESKTOP MENU */}
      <div className="hidden md:flex items-center gap-6">
        <a
          href="/"
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${isActive("/") ? "bg-[var(--color-primary-mint)] text-[var(--color-primary-dark)]" : "text-gray-600 hover:text-[var(--color-primary-dark)]"}`}
        >
          Accueil
        </a>

        <a
          href="/explorer"
          className={`text-sm transition ${isActive("/explorer") ? "text-[var(--color-primary-dark)] font-medium" : "text-gray-600 hover:text-[var(--color-primary-dark)]"}`}
        >
          Explorer
        </a>

        {/* SERVICES MEGA DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => {
              setOpenServices(!openServices);
              if (!openServices) setActiveService(null);
            }}
            className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${openServices ? "bg-[var(--color-primary-mint)] text-[var(--color-primary-dark)]" : "text-gray-600 hover:text-[var(--color-primary-dark)]"}`}
          >
            Services
            <ChevronDown
              size={14}
              className={`transition-transform ${openServices ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {openServices && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="absolute top-10 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                style={{ width: "620px" }}
              >
                <div className="flex">
                  {/* Left: service list */}
                  <div className="w-48 border-r border-gray-100 py-2 flex-shrink-0">
                    {NAV_SERVICES.map((svc) => (
                      <button
                        key={svc.label}
                        type="button"
                        onMouseEnter={() => setActiveService(svc.label)}
                        onClick={() => {
                          router.push(svc.href);
                          setOpenServices(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${activeService === svc.label ? "bg-[var(--color-primary-mint)] text-[var(--color-primary-dark)] font-medium" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {svc.label}
                        <ChevronDown
                          size={12}
                          className="-rotate-90 text-gray-400"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Right: subcategories */}
                  <div className="flex-1 p-5 min-h-[300px]">
                    {activeService ? (
                      (() => {
                        const svc = NAV_SERVICES.find(
                          (s) => s.label === activeService,
                        );
                        return (
                          <>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                              {svc.label}
                            </p>

                            <div className="grid grid-cols-2 gap-1">
                              {svc.categories.map((cat) => (
                                <a
                                  key={cat}
                                  href={svc.href}
                                  onClick={() => setOpenServices(false)}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[var(--color-primary-mint)] hover:text-[var(--color-primary-dark)] transition-colors"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-sage)] flex-shrink-0" />
                                  {cat}
                                </a>
                              ))}
                            </div>

                            <a
                              href={svc.href}
                              onClick={() => setOpenServices(false)}
                              className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-[var(--color-primary-dark)] hover:underline"
                            >
                              Voir tout — {svc.label} →
                            </a>
                          </>
                        );
                      })()
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-gray-400">
                        Survolez un service pour voir ses catégories
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <a
          href="/blog"
          className={`text-sm transition ${isActive("/blog") ? "text-[var(--color-primary-dark)] font-medium" : "text-gray-600 hover:text-[var(--color-primary-dark)]"}`}
        >
          Blog
        </a>

        {/* ── ESPACE ADMIN — visible uniquement pour les admins ─────────── */}
        {role === "admin" && (
          <a
            href="/admin"
            className={`
              relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
              tracking-wide transition-all duration-200 overflow-hidden group
              ${isActive("/admin") || pathname?.startsWith("/admin")
                ? "bg-[#2D5016] text-white shadow-lg shadow-[#2D5016]/30"
                : "bg-[#2D5016] text-white hover:bg-[#3a6b1e] shadow-md shadow-[#2D5016]/20 hover:shadow-lg hover:shadow-[#2D5016]/30"
              }
            `}
          >
            {/* Shimmer effect on hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
              -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

            <IconShield />
            <span>Espace Admin</span>

            {/* Active indicator dot */}
            {pathname?.startsWith("/admin") && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#A7D129] animate-pulse ml-0.5" />
            )}
          </a>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          ☰
        </button>

        {user ? (
          <>
            <span className="hidden md:block text-sm text-gray-600">
              Bonjour,{" "}
              <span className="font-medium text-[var(--color-primary-dark)]">
                {user.name}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="border border-gray-300 text-gray-600 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-50"
            >
              Déconnexion
            </button>
          </>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-[var(--color-primary-dark)]"
            >
              Connexion
            </a>
            <a
              href="/auth/register"
              className="bg-[var(--color-primary-dark)] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[var(--color-primary-sage)] transition-colors"
            >
              S'inscrire
            </a>
          </div>
        )}
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="absolute top-full left-0 w-full bg-white border-t border-gray-200 md:hidden px-6 py-4 flex flex-col gap-3 z-40"
          >
            <a href="/" className="text-sm text-gray-700">Accueil</a>
            <a href="/explorer" className="text-sm text-gray-700">Explorer</a>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
              Services
            </p>
            {NAV_SERVICES.map((s) => (
              <a key={s.label} href={s.href} className="text-sm text-gray-700 pl-2">
                {s.label}
              </a>
            ))}
            <a href="/blog" className="text-sm text-gray-700 mt-2">Blog</a>

            {/* Admin link mobile */}
            {role === "admin" && (
              <a
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold
                  bg-[#2D5016] text-white mt-1 w-fit"
              >
                <IconShield />
                Espace Admin
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
