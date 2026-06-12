"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Plus,
  Shield,
  User,
  Heart,
  Bell,
  LogOut,
  X,
} from "lucide-react";
import GoogleAuth from "../../components/auth/GoogleAuth";
import Logo from "./logos/Logo";

// ── NAV SERVICES ──────────────────────────────────────────────────────────────
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

const getRoleLabel = (role) => {
  if (role === "admin") return "Admin";
  if (role === "business") return "Business";
  return "Citoyen";
};

// ── Avatar — initials fallback, reused everywhere ─────────────────────────────
function Avatar({ user, size = "sm" }) {
  const dim = size === "sm" ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-xs";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div
      className={`${dim} rounded-full bg-[#A7D129]/20 border border-[#A7D129]/40 flex items-center justify-center font-bold text-[#2D5016] shrink-0 overflow-hidden`}
    >
      {user?.avatar ? (
        <img src={user.avatar} alt="" className="w-full h-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

// ── Dropdown menu item ────────────────────────────────────────────────────────
function DropdownItem({ href, icon, label, active, onClick }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
        active
          ? "bg-[#E8F5D0] text-[#2D5016] font-semibold"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <span
        className={`shrink-0 ${active ? "text-[#2D5016]" : "text-gray-400"}`}
      >
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
  const {
    user,
    logout,
    accounts = [],
    switchAccount,
    addAccount,
    logoutAll,
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [openServices, setOpenServices] = useState(false);
  const [activeService, setActiveService] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", password: "" });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);

  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenServices(false);
        setActiveService(null);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
        setTimeout(() => {
          setShowAddAccount(false);
          setAddError("");
          setAddForm({ email: "", password: "" });
        }, 150);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    setOpenServices(false);
    setActiveService(null);
    setUserMenuOpen(false);
    setShowAddAccount(false);
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push("/");
  };

  const handleLogoutAll = async () => {
    setUserMenuOpen(false);
    await logoutAll();
    router.push("/");
  };

  const handleSwitch = async (accountId) => {
    if (switchingId) return;
    setSwitchingId(accountId);
    try {
      await switchAccount(accountId);
      setUserMenuOpen(false);
    } catch (err) {
      console.error("Account switch failed", err);
    } finally {
      setSwitchingId(null);
    }
  };

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);
    try {
      console.log("email: ",addForm.email, "; pass: ",addForm.password)
      await addAccount(addForm.email, addForm.password);
      setShowAddAccount(false);
      setAddForm({ email: "", password: "" });
      setUserMenuOpen(false);
    } catch (error) {
      setAddError(error?.message || "Email ou mot de passe incorrect");
    } finally {
      setAddLoading(false);
    }
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
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
            isActive("/")
              ? "bg-[#E8F5D0] text-[#2D5016]"
              : "text-gray-600 hover:text-[#2D5016]"
          }`}
        >
          Accueil
        </a>

        <a
          href="/explorer"
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
                        <ChevronDown
                          size={12}
                          className="-rotate-90 text-gray-400"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Right — subcategories */}
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
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-[#E8F5D0] hover:text-[#2D5016] transition-colors"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#7BA428] shrink-0" />
                                  {cat}
                                </a>
                              ))}
                            </div>

                            <a
                              href={svc.href}
                              onClick={() => setOpenServices(false)}
                              className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-[#2D5016] hover:underline"
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
          className={`text-sm transition ${
            isActive("/blog")
              ? "text-[#2D5016] font-medium"
              : "text-gray-600 hover:text-[#2D5016]"
          }`}
        >
          Blog
        </a>

        {/* ESPACE ADMIN */}
        {role === "admin" && (
          <a
            href="/admin"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 overflow-hidden group bg-[#2D5016] text-white hover:bg-[#3a6b1e] shadow-md shadow-[#2D5016]/20 hover:shadow-lg hover:shadow-[#2D5016]/30"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            <Shield size={13} className="stroke-[2.5]" />
            <span>Espace Admin</span>
            {pathname?.startsWith("/admin") && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#A7D129] animate-pulse ml-0.5" />
            )}
          </a>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden text-gray-700 font-medium text-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          ☰
        </button>

        {user ? (
          /* ── AVATAR DROPDOWN ───────────────────────────────────────── */
          <div className="relative" ref={userMenuRef}>
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

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-11 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  {/* User header */}
                  <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] uppercase tracking-wide">
                          {getRoleLabel(user.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── ACCOUNT SWITCHER ── */}
                  {accounts.filter((a) => a.user?.id !== user?.id).length >
                    0 && (
                    <div className="border-b border-gray-100 py-2 px-4 max-h-[160px] overflow-y-auto bg-white">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        Changer de compte
                      </p>
                      <div className="flex flex-col gap-1">
                        {accounts
                          .filter((a) => (a.user?.id || a.id) !== user?.id)
                          .map((acc) => {
                            const u = acc.user || acc; // Extract normalized reference
                            const uName =
                              u.name || u.email?.split("@")[0] || "Utilisateur";
                            const uEmail = u.email || "";
                            const uRole = u.role || "citoyen";

                            return (
                              <button
                                key={u.id || uEmail}
                                disabled={switchingId !== null}
                                onClick={() => handleSwitch(u.id || acc.id)}
                                className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 transition group text-left disabled:opacity-60"
                              >
                                <Avatar user={u} size="sm" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-[#2D5016]">
                                    {uName}
                                  </p>
                                  <p className="text-[10px] text-gray-400 truncate">
                                    {uEmail}
                                  </p>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 group-hover:bg-[#E8F5D0] group-hover:text-[#2D5016] uppercase tracking-wide shrink-0 transition-colors">
                                  {switchingId === u.id
                                    ? "..."
                                    : getRoleLabel(uRole)}
                                </span>
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* ── ADD ACCOUNT ── */}
                  <div className="border-b border-gray-100 py-2 px-4 bg-white">
                    {!showAddAccount ? (
                      <button
                        onClick={() => setShowAddAccount(true)}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-[#2D5016] transition w-full py-1.5"
                      >
                        <Plus size={14} className="text-gray-400" />
                        Ajouter un compte
                      </button>
                    ) : (
                      <form
                        onSubmit={handleAddAccountSubmit}
                        className="flex flex-col gap-2 pt-1 pb-1"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Nouveau Compte
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddAccount(false);
                              setAddError("");
                            }}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <input
                          type="email"
                          placeholder="Email"
                          required
                          autoFocus
                          value={addForm.email}
                          onChange={(e) =>
                            setAddForm((f) => ({ ...f, email: e.target.value }))
                          }
                          className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#A7D129] transition"
                        />
                        <input
                          type="password"
                          placeholder="Mot de passe"
                          required
                          value={addForm.password}
                          onChange={(e) =>
                            setAddForm((f) => ({
                              ...f,
                              password: e.target.value,
                            }))
                          }
                          className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#A7D129] transition"
                        />
                        {addError && (
                          <p className="text-[10px] text-red-500 font-medium">
                            {addError}
                          </p>
                        )}

                        <div className="flex gap-2 mt-0.5">
                          <button
                            type="submit"
                            disabled={addLoading}
                            className="flex-1 text-xs font-bold py-1.5 rounded-xl bg-[#2D5016] text-white hover:bg-[#3a6b1e] transition disabled:opacity-50"
                          >
                            {addLoading ? "En cours..." : "Connexion"}
                          </button>
                        </div>
                        <div className="scale-90 origin-top">
                          <GoogleAuth
                            onSuccess={() => setUserMenuOpen(false)}
                            redirect={false}
                          />
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <div className="py-1 bg-white">
                    <DropdownItem
                      href="/my-space/profile"
                      icon={<User size={16} />}
                      label="Mon espace"
                      active={pathname?.startsWith("/my-space/profile")}
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <DropdownItem
                      href="/my-space/favorites"
                      icon={<Heart size={16} />}
                      label="Mes favoris"
                      active={pathname === "/my-space/favorites"}
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <DropdownItem
                      href="/my-space/notifications"
                      icon={<Bell size={16} />}
                      label="Notifications"
                      active={pathname === "/my-space/notifications"}
                      onClick={() => setUserMenuOpen(false)}
                    />
                  </div>

                  {/* Desktop Logout Options */}
                  <div className="border-t border-gray-100 py-1 bg-white flex flex-col">
                    {accounts.length > 1 ? (
                      <>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors text-left"
                        >
                          <LogOut
                            size={14}
                            className="text-gray-400 shrink-0"
                          />
                          Se déconnecter de{" "}
                          <span className="font-semibold truncate max-w-[80px]">
                            {user?.name
                              ? user.name.split(" ")[0]
                              : "mon compte"}
                          </span>
                        </button>

                        <button
                          onClick={handleLogoutAll}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50/50 font-semibold transition-colors text-left"
                        >
                          <LogOut size={16} className="text-red-500 shrink-0" />
                          Déconnexion de toutes
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50/50 transition-colors text-left"
                      >
                        <LogOut size={16} className="text-red-400 shrink-0" />
                        Déconnexion
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          /* ── GUEST BUTTONS ─────────────────────────────────────────── */
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-[#2D5016]"
            >
              Connexion
            </a>
            <a
              href="/auth/register"
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
            <a
              href="/"
              className="text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50"
            >
              Accueil
            </a>
            <a
              href="/explorer"
              className="text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50"
            >
              Explorer
            </a>

            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mt-3 mb-1">
              Services
            </p>
            {NAV_SERVICES.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50 pl-4"
              >
                {s.label}
              </a>
            ))}

            <a
              href="/blog"
              className="text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50 mt-1"
            >
              Blog
            </a>

            {role === "admin" && (
              <a
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-[#2D5016] text-white mt-2 w-fit"
              >
                <Shield size={14} />
                Espace Admin
              </a>
            )}

            {/* User section — mobile */}
            {user ? (
              <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-1">
                <div className="flex items-center gap-3 px-2 pb-3">
                  <Avatar user={user} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {user.name}
                    </p>
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5D0] text-[#2D5016] uppercase tracking-wide">
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                </div>

                <a
                  href="/my-space/profile"
                  className="flex items-center gap-3 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50"
                >
                  <User size={16} className="text-gray-400" />
                  Mon espace
                </a>
                <a
                  href="/my-space/favorites"
                  className="flex items-center gap-3 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50"
                >
                  <Heart size={16} className="text-gray-400" />
                  Mes favoris
                </a>
                <a
                  href="/my-space/notifications"
                  className="flex items-center gap-3 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50"
                >
                  <Bell size={16} className="text-gray-400" />
                  Notifications
                </a>

                {/* Mobile Logout Options */}
                <div className="border-t border-gray-100 py-1 bg-white flex flex-col mt-2">
                  {accounts.length > 1 ? (
                    <>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors text-left"
                      >
                        <LogOut size={14} className="text-gray-400 shrink-0" />
                        Se déconnecter de{" "}
                        <span className="font-semibold truncate max-w-[80px]">
                          {user.name.split(" ")[0]}
                        </span>
                      </button>

                      <button
                        onClick={handleLogoutAll}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50/50 font-semibold transition-colors text-left"
                      >
                        <LogOut size={16} className="text-red-500 shrink-0" />
                        Déconnexion de tous les comptes
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50/50 transition-colors text-left"
                    >
                      <LogOut size={16} className="text-red-400 shrink-0" />
                      Déconnexion
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-2 px-2">
                <a href="/auth/login" className="text-sm text-gray-700 py-2">
                  Connexion
                </a>
                <a
                  href="/auth/register"
                  className="text-sm font-bold text-[#2D5016] py-2"
                >
                  S'inscrire
                </a>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
