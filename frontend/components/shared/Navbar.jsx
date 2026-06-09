"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Logo from "./logos/Logo";

// ── NAV SERVICES ──────────────────────────────────────────────────────────────
const NAV_SERVICES = [
  {
    label: "Emploi",
    href: "/jobs",
    categories: ["Offres d'emploi", "Formation", "Mini-jobs", "Accompagnement", "Demande d'emploi"],
  },
  {
    label: "Immobilier",
    href: "/real-estate",
    categories: ["Vendre appartement", "Acheter appartement", "Louer maison", "Déménagement", "Artisans"],
  },
  {
    label: "Événements",
    href: "/evenements",
    categories: ["Théâtre", "Concert", "Marché", "Activités enfants", "Galerie"],
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
    categories: ["Cliniques", "Médecine", "Pharmacies", "Pharmacie de garde", "Para"],
  },
  {
    label: "Petites Annonces",
    href: "/annonces",
    categories: ["Ménage & nettoyage", "Garde d'enfants", "Cours particuliers", "Soins seniors"],
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
    categories: ["Plan de ville", "Rues & boulevards", "Monuments", "Navigation"],
  },
];

// ── ICONS (inline SVG — Tabler style, strokeWidth 1.75) ───────────────────────

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" />
    <path d="M9 12l2 2l4 -4" />
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4" />
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
  </svg>
);

const IconHeart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.566" />
  </svg>
);

const IconBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
    <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
  </svg>
);

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
    <path d="M9 12h12l-3 -3m0 6l3 -3" />
  </svg>
);

// ── Avatar — initials fallback, reused everywhere ─────────────────────────────
function Avatar({ user, size = "sm" }) {
  const dim = size === "sm" ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-xs";
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";
  return (
    <div className={`${dim} rounded-full bg-[#A7D129]/20 border border-[#A7D129]/40 flex items-center justify-center font-bold text-[#2D5016] shrink-0 overflow-hidden`}>
      {user?.avatar
        ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        : initials
      }
    </div>
  );
}

// ── Dropdown menu item ────────────────────────────────────────────────────────
function DropdownItem({ href, icon, label, active, onClick }) {
  return (
    
    <a href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
        active
          ? "bg-[#E8F5D0] text-[#2D5016] font-semibold"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span className={`shrink-0 ${active ? "text-[#2D5016]" : "text-gray-400"}`}>
        {icon}
      </span>
      {label}
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [openServices, setOpenServices] = useState(false);
  const [activeService, setActiveService] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  // Scroll shadow
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close services dropdown on outside click
  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenServices(false);
        setActiveService(null);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const fn = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Close everything on route change
  useEffect(() => {
    setOpenServices(false);
    setActiveService(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push("/auth/login");
  };

  const isActive = (path) => pathname === path;
  const role = user?.role;
  const isBusiness = role === "business";

  return (
    <nav className={`bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 transition-shadow ${scrolled ? "shadow-md" : ""}`}>

      {/* LOGO */}
      <a href="/" className="flex items-center gap-2 scale-75 origin-left">
        <Logo />
      </a>

      {/* DESKTOP MENU */}
      <div className="hidden md:flex items-center gap-6">

        
        <a href="/"
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
            isActive("/")
              ? "bg-[#E8F5D0] text-[#2D5016]"
              : "text-gray-600 hover:text-[#2D5016]"
          }`}
        >
          Accueil
        </a>

        
        <a href="/explorer"
          className={`text-sm transition ${
            isActive("/explorer")
              ? "text-[#2D5016] font-medium"
              : "text-gray-600 hover:text-[#2D5016]"
          }`}
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
            className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
              openServices
                ? "bg-[#E8F5D0] text-[#2D5016]"
                : "text-gray-600 hover:text-[#2D5016]"
            }`}
          >
            Services
            <ChevronDown size={14} className={`transition-transform ${openServices ? "rotate-180" : ""}`} />
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
                  {/* Left — service list */}
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
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                          activeService === svc.label
                            ? "bg-[#E8F5D0] text-[#2D5016] font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {svc.label}
                        <ChevronDown size={12} className="-rotate-90 text-gray-400" />
                      </button>
                    ))}
                  </div>

                  {/* Right — subcategories */}
                  <div className="flex-1 p-5 min-h-[300px]">
                    {activeService ? (() => {
                      const svc = NAV_SERVICES.find((s) => s.label === activeService);
                      return (
                        <>
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                            {svc.label}
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            {svc.categories.map((cat) => (
                              
                              <a key={cat}
                                href={svc.href}
                                onClick={() => setOpenServices(false)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[#E8F5D0] hover:text-[#2D5016] transition-colors"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#7BA428] shrink-0" />
                                {cat}
                              </a>
                            ))}
                          </div>
                          
                          <a href={svc.href}
                            onClick={() => setOpenServices(false)}
                            className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-[#2D5016] hover:underline"
                          >
                            Voir tout — {svc.label} →
                          </a>
                        </>
                      );
                    })() : (
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

        
        <a href="/blog"
          className={`text-sm transition ${
            isActive("/blog")
              ? "text-[#2D5016] font-medium"
              : "text-gray-600 hover:text-[#2D5016]"
          }`}
        >
          Blog
        </a>

        {/* ESPACE ADMIN — admin only */}
        {role === "admin" && (
          
          <a href="/admin"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 overflow-hidden group bg-[#2D5016] text-white hover:bg-[#3a6b1e] shadow-md shadow-[#2D5016]/20 hover:shadow-lg hover:shadow-[#2D5016]/30"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <IconShield />
            <span>Espace Admin</span>
            {pathname?.startsWith("/admin") && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#A7D129] animate-pulse ml-0.5" />
            )}
          </a>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          ☰
        </button>

        {user ? (
          /* ── AVATAR DROPDOWN ───────────────────────────────────────── */
          <div className="relative" ref={userMenuRef}>

            {/* Trigger pill */}
            <button
              onClick={() => setUserMenuOpen((p) => !p)}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-[#A7D129] transition-colors bg-white"
            >
              <Avatar user={user} size="sm" />
              <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[110px] truncate">
                {user.name}
              </span>
              <span className="hidden md:block text-gray-400">
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${userMenuOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            {/* Dropdown panel */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-11 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  {/* User header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] uppercase tracking-wide">
                          {isBusiness ? "Business" : "Citoyen"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nav items */}
                  <div className="py-1">
                    <DropdownItem
                      href="/my-space/profile"
                      icon={<IconUser />}
                      label="Mon espace"
                      active={pathname?.startsWith("/my-space")}
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <DropdownItem
                      href="/my-space/favorites"
                      icon={<IconHeart />}
                      label="Mes favoris"
                      active={pathname === "/my-space/favorites"}
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <DropdownItem
                      href="/my-space/notifications"
                      icon={<IconBell />}
                      label="Notifications"
                      active={pathname === "/my-space/notifications"}
                      onClick={() => setUserMenuOpen(false)}
                    />
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <span className="shrink-0 text-red-400"><IconLogout /></span>
                      Déconnexion
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        ) : (
          /* ── GUEST BUTTONS ─────────────────────────────────────────── */
          <div className="hidden md:flex items-center gap-3">
            
            <a href="/auth/login"
              className="text-sm text-gray-600 hover:text-[#2D5016]"
            >
              Connexion
            </a>
            
            <a href="/auth/register"
              className="bg-[#2D5016] text-white px-4 py-1.5 rounded-lg text-sm hover:bg-[#3a6b1e] transition-colors"
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
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 w-full bg-white border-t border-gray-200 md:hidden px-6 py-4 flex flex-col gap-1 z-40 overflow-hidden"
          >
            <a href="/" className="text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50">Accueil</a>
            <a href="/explorer" className="text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50">Explorer</a>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mt-3 mb-1">
              Services
            </p>
            {NAV_SERVICES.map((s) => (
              
              <a key={s.label}
                href={s.href}
                className="text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50 pl-4"
              >
                {s.label}
              </a>
            ))}

            <a href="/blog" className="text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50 mt-1">Blog</a>

            {/* Admin link — mobile */}
            {role === "admin" && (
              
              <a href="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-[#2D5016] text-white mt-2 w-fit"
              >
                <IconShield />
                Espace Admin
              </a>
            )}

            {/* User section — mobile */}
            {user ? (
              <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-1">
                {/* User info */}
                <div className="flex items-center gap-3 px-2 pb-3">
                  <Avatar user={user} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] uppercase tracking-wide">
                      {isBusiness ? "Business" : "Citoyen"}
                    </span>
                  </div>
                </div>

                <a href="/my-space/profile" className="flex items-center gap-3 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50">
                  <span className="text-gray-400"><IconUser /></span>
                  Mon espace
                </a>
                <a href="/my-space/favorites" className="flex items-center gap-3 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50">
                  <span className="text-gray-400"><IconHeart /></span>
                  Mes favoris
                </a>
                <a href="/my-space/notifications" className="flex items-center gap-3 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50">
                  <span className="text-gray-400"><IconBell /></span>
                  Notifications
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 text-sm text-red-500 px-2 py-2 rounded-lg hover:bg-red-50 mt-1 w-full text-left"
                >
                  <span className="text-red-400"><IconLogout /></span>
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-2 px-2">
                <a href="/auth/login" className="text-sm text-gray-700 py-2">Connexion</a>
                <a href="/auth/register" className="text-sm font-bold text-[#2D5016] py-2">S'inscrire</a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}