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
  MessageSquare,
  LogOut,
  X,
  Grid3x3,
  Briefcase,
  Home,
  Car,
} from "lucide-react";
import GoogleAuth from "../../components/auth/GoogleAuth";
import Logo from "./logos/Logo";

// ── TOP-LEVEL MODULE LINKS (shown directly in the navbar) ────────────────────
const MODULE_LINKS = [
  { label: "Emploi", href: "/jobs", icon: Briefcase },
  { label: "Immobilier", href: "/real-estate", icon: Home },
  { label: "Véhicule", href: "/cars", icon: Car },
];

// ── ALL CATEGORIES (shown inside the "Catégories" left drawer) ───────────────
const NAV_SERVICES = [
  {
    label: "Emploi",
    href: "/jobs",
    categories: [
      "Offres d'emploi",
      "Formation",
      { label: "Mini-jobs", href: "/mini-jobs" },
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
    href: "/cars",
    categories: ["Voitures occasion", "Voitures neuves", "Motos", "Auto info"],
  },
{
  label: "Tourisme",
  href: "/tourisme",
  categories: [
    "Hôtels",
    "Privé (Appartement + Maison)",
    "Wellness / SPA",
    "Hammam",
    "Magazine des touristes",
    "Mosquée",
    "Musée",
    "Cinéma",
    "Restaurant",
    "Café",
    "Jardin",
    "Forêt",
    "Terrains de proximité",
    "Piscine publique",
    "Plage",
    "Hôpitaux",
    "Zoo",
    "Carte touristique de la ville",
  ],
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
    href: "/press",
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

// ── Avatar ────────────────────────────────────────────────────────────────────
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

// ── Account switcher list (shared between desktop + mobile) ──────────────────
function AccountSwitcher({ accounts, user, switchingId, onSwitch }) {
  const others = accounts.filter((a) => (a.user?.id || a.id) !== user?.id);
  if (others.length === 0) return null;

  return (
    <div className="border-b border-gray-100 py-2 px-4 max-h-[160px] overflow-y-auto bg-white">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        Changer de compte
      </p>
      <div className="flex flex-col gap-1">
        {others.map((acc) => {
          const u = acc.user || acc;
          if (!u?.id) return null;
          const uName = u.name || u.email?.split("@")[0] || "Utilisateur";
          const uEmail = u.email || "";
          const uRole = u.role || "citoyen";

          return (
            <button
              key={u.id}
              disabled={switchingId !== null}
              onClick={() => onSwitch(u.id)}
              className="w-full flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 transition group text-left disabled:opacity-60"
            >
              <Avatar user={u} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-[#2D5016]">
                  {uName}
                </p>
                <p className="text-[10px] text-gray-400 truncate">{uEmail}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 group-hover:bg-[#E8F5D0] group-hover:text-[#2D5016] uppercase tracking-wide shrink-0 transition-colors">
                {switchingId === u.id ? "..." : getRoleLabel(uRole)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddAccountForm({
  showAddAccount,
  setShowAddAccount,
  addForm,
  setAddForm,
  addError,
  setAddError,
  addLoading,
  handleAddAccountSubmit,
  setUserMenuOpen,
}) {
  return (
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
              setAddForm((f) => ({ ...f, password: e.target.value }))
            }
            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#A7D129] transition"
          />
          {addError && (
            <p className="text-[10px] text-red-500 font-medium">{addError}</p>
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
  );
}

// ── Categories left drawer (replaces the old "Services" mega dropdown) ───────
function CategoriesDrawer({
  open,
  onClose,
  expandedModule,
  setExpandedModule,
  router,
}) {
  const handleGo = (href, category) => {
    const url = category
      ? `${href}?category=${encodeURIComponent(category)}`
      : href;
    router.push(url);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-0 left-0 h-full w-[320px] bg-white z-[61] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-[11px] text-gray-400 font-medium">
                  Toutes les catégories
                </p>
                <p className="text-sm font-bold text-[#2D5016]">Catégories</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Module list (accordion) */}
            <div className="flex-1 overflow-y-auto py-2">
              {NAV_SERVICES.map((svc) => {
                const isExpanded = expandedModule === svc.label;
                return (
                  <div key={svc.label} className="border-b border-gray-50">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedModule(isExpanded ? null : svc.label)
                      }
                      className="w-full flex items-center justify-between px-5 py-3 text-left"
                    >
                      <span
                        className={`text-sm font-medium ${
                          isExpanded ? "text-[#2D5016]" : "text-gray-700"
                        }`}
                      >
                        {svc.label}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-gray-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden bg-gray-50/60"
                        >
                          <button
                            onClick={() => handleGo(svc.href)}
                            className="w-full text-left px-8 py-2 text-xs font-semibold text-[#2D5016] hover:bg-[#E8F5D0] transition-colors"
                          >
                            Voir tout — {svc.label} →
                          </button>
                          {svc.categories.map((cat) => {
                            const label = typeof cat === 'string' ? cat : cat.label;
                            const href = typeof cat === 'string' ? svc.href : (cat.href || svc.href);
                            return (
                              <button
                                key={label}
                                onClick={() => handleGo(href)}
                                className="w-full flex items-center gap-2 text-left px-8 py-2 text-sm text-gray-600 hover:bg-[#E8F5D0] hover:text-[#2D5016] transition-colors"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#7BA428] shrink-0" />
                                {label}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const {
    user,
    loading,
    logout,
    accounts = [],
    switchAccount,
    addAccount,
    logoutAll,
  } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", password: "" });
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [switchingId, setSwitchingId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  // Categories drawer state
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);
  const [hoveredModule, setHoveredModule] = useState(null);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
        setTimeout(() => {
          setShowAddAccount(false);
          setAddError("");
          setAddForm({ email: "", password: "" });
        }, 150);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
    setShowAddAccount(false);
    setMobileOpen(false);
    setNotifOpen(false);
    setCategoriesOpen(false);
    setExpandedModule(null);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=5`,
          { headers: { Authorization: `Bearer ${storedToken}` } },
        );
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, [user]);

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
      await addAccount(addForm.email, addForm.password);
      setShowAddAccount(false);
      setAddForm({ email: "", password: "" });
      setUserMenuOpen(false);
    } catch (error) {
      setAddError(
        error?.response?.data?.message || "Email ou mot de passe incorrect",
      );
    } finally {
      setAddLoading(false);
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      try {
        const storedToken = localStorage.getItem("token");
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notif.id}/read`,
          {
            method: "PATCH",
            headers: { Authorization: `Bearer ${storedToken}` },
          },
        );
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }
    if (notif.link) router.push(notif.link);
    setNotifOpen(false);
  };

  const isActive = (path) => pathname === path;
  // A module is "active" whenever the current path is inside it, e.g. /jobs/123 -> Emploi stays highlighted
  const isModuleActive = (href) =>
    pathname === href || pathname?.startsWith(href + "/");
  const role = user?.role;

  // ── Shared logout buttons ─────────────────────────────────────────────────
  const LogoutButtons = ({ small = false }) => (
    <div className="border-t border-gray-100 py-1 bg-white flex flex-col">
      {accounts.length > 1 ? (
        <>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors text-left"
          >
            <LogOut size={14} className="text-gray-400 shrink-0" />
            Se déconnecter de{" "}
            <span className="font-semibold truncate max-w-[80px]">
              {user?.name ? user.name.split(" ")[0] : "mon compte"}
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
  );

  return (
    <nav
      className={`bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 transition-shadow ${
        scrolled ? "shadow-md" : ""
      }`}
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

        {/* Separator before module group */}
        <span className="h-5 w-px bg-gray-200" />

        {/* MODULE LINKS — Emploi / Immobilier / Véhicule */}
       {MODULE_LINKS.map((mod) => {
  const ModIcon = mod.icon;
  const svc = NAV_SERVICES.find((s) => s.href === mod.href);
  const isHovered = hoveredModule === mod.label;

  return (
    <div
      key={mod.label}
      className="relative"
      onMouseEnter={() => svc && setHoveredModule(mod.label)}
      onMouseLeave={() => setHoveredModule(null)}
    >
      <a
        href={mod.href}
        className={`text-sm px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
          isModuleActive(mod.href)
            ? "bg-[#E8F5D0] text-[#2D5016]"
            : "text-gray-600 hover:text-[#2D5016]"
        }`}
      >
        <ModIcon size={14} />
        {mod.label}
        {svc && (
          <ChevronDown
            size={12}
            className={`transition-transform duration-150 ${isHovered ? "rotate-180" : ""}`}
          />
        )}
      </a>

      <AnimatePresence>
        {svc && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full pt-2 w-56 z-50"
          >
            <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden py-1.5">
              <a
                href={svc.href}
                className="block px-4 py-2 text-xs font-bold text-[#2D5016] hover:bg-[#E8F5D0] transition-colors"
              >
                Voir tout — {svc.label} →
              </a>
              {svc.categories.map((cat) => {
                const label = typeof cat === "string" ? cat : cat.label;
                const href = typeof cat === "string" ? svc.href : cat.href || svc.href;
                return (
                  <a
                    key={label}
                    href={href}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#E8F5D0] hover:text-[#2D5016] transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7BA428] shrink-0" />
                    {label}
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
})}

        {/* Separator after module group */}
        <span className="h-5 w-px bg-gray-200" />

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

        {/* CATEGORIES — opens left drawer (placed last) */}
        <button
          type="button"
          onClick={() => setCategoriesOpen(true)}
          className="text-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition text-gray-600 hover:text-[#2D5016]"
        >
          <Grid3x3 size={14} />
          Catégories
        </button>

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
        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-700 font-medium text-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          ☰
        </button>

        {/* Loading placeholder — prevents hydration flash */}
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
        ) : user ? (
          <>
            {/* ── NOTIFICATION BELL ──────────────────────────────────────── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((p) => !p)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 hover:border-[#A7D129] bg-white transition"
              >
                <Bell size={16} className="text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-11 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                      <p className="font-bold text-gray-900 text-sm">
                        Notifications
                      </p>
                      {unreadCount > 0 && (
                        <span className="text-xs text-[#2D5016] font-semibold bg-[#E8F5D0] px-2 py-0.5 rounded-full">
                          {unreadCount} non lues
                        </span>
                      )}
                    </div>

                    <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400">
                          Aucune notification
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition ${
                              !notif.isRead ? "bg-[#E8F5D0]/30" : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  !notif.isRead
                                    ? "bg-[#A7D129]"
                                    : "bg-transparent"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`text-sm ${
                                    !notif.isRead
                                      ? "font-semibold text-gray-900"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {notif.body}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString(
                                    "fr-FR",
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t border-gray-100 px-4 py-2">
                      <a
                        href={
                          role === "business"
                            ? "/dashboard/notifications"
                            : "/my-space/notifications"
                        }
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-semibold text-[#2D5016] hover:underline"
                      >
                        Voir toutes les notifications →
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── AVATAR DROPDOWN ─────────────────────────────────────────── */}
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
                    className={`transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
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

                    {/* Account switcher */}
                    <AccountSwitcher
                      accounts={accounts}
                      user={user}
                      switchingId={switchingId}
                      onSwitch={handleSwitch}
                    />

                    {/* Add account */}
                    <AddAccountForm
                      showAddAccount={showAddAccount}
                      setShowAddAccount={setShowAddAccount}
                      addForm={addForm}
                      setAddForm={setAddForm}
                      addError={addError}
                      setAddError={setAddError}
                      addLoading={addLoading}
                      handleAddAccountSubmit={handleAddAccountSubmit}
                      setUserMenuOpen={setUserMenuOpen}
                    />

                    {/* Nav links — role-aware */}
                    <div className="py-1 bg-white">
                      {role === "business" ? (
                        <>
                          <DropdownItem
                            href="/dashboard"
                            icon={<Shield size={16} />}
                            label="Dashboard"
                            active={pathname === "/dashboard"}
                            onClick={() => setUserMenuOpen(false)}
                          />
                          <DropdownItem
                            href="/my-space/profile"
                            icon={<User size={16} />}
                            label="Mon profil"
                            active={pathname === "/my-space/profile"}
                            onClick={() => setUserMenuOpen(false)}
                          />
                          <DropdownItem
                            href="/my-space/favorites"
                            icon={<Heart size={16} />}
                            label="Mes favoris"
                            active={pathname === "/my-space/favorites"}
                            onClick={() => setUserMenuOpen(false)}
                          />
                        </>
                      ) : role === "admin" ? (
                        <DropdownItem
                          href="/admin"
                          icon={<Shield size={16} />}
                          label="Espace Admin"
                          active={pathname?.startsWith("/admin")}
                          onClick={() => setUserMenuOpen(false)}
                        />
                      ) : (
                        <>
                          <DropdownItem
                            href="/my-space/profile"
                            icon={<User size={16} />}
                            label="Mon espace"
                            active={pathname?.startsWith("/my-space/profile")}
                            onClick={() => setUserMenuOpen(false)}
                          />
                          <DropdownItem
                            href="/my-space/messages"
                            icon={<MessageSquare size={16} />}
                            label="Messages"
                            active={pathname === "/my-space/messages"}
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
                        </>
                      )}
                    </div>

                    <LogoutButtons />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* ── GUEST BUTTONS ───────────────────────────────────────────── */
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

      {/* CATEGORIES DRAWER (slides from the left) */}
      <CategoriesDrawer
        open={categoriesOpen}
        onClose={() => {
          setCategoriesOpen(false);
          setExpandedModule(null);
        }}
        expandedModule={expandedModule}
        setExpandedModule={setExpandedModule}
        router={router}
      />

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

            {/* Module links */}
            {MODULE_LINKS.map((mod) => {
              const ModIcon = mod.icon;
              return (
                <a
                  key={mod.label}
                  href={mod.href}
                  className={`flex items-center gap-2 text-sm px-2 py-2 rounded-lg hover:bg-gray-50 ${
                    isModuleActive(mod.href)
                      ? "text-[#2D5016] font-semibold bg-[#E8F5D0]"
                      : "text-gray-700"
                  }`}
                >
                  <ModIcon size={14} className="text-gray-400" />
                  {mod.label}
                </a>
              );
            })}

            <a
              href="/explorer"
              className="text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50"
            >
              Explorer
            </a>

            <a
              href="/blog"
              className="text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50 mt-1"
            >
              Blog
            </a>

            {/* Categories drawer trigger (placed last) */}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setCategoriesOpen(true);
              }}
              className="flex items-center gap-2 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50 text-left"
            >
              <Grid3x3 size={14} className="text-gray-400" />
              Catégories
            </button>

            {role === "admin" && (
              <a
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold bg-[#2D5016] text-white mt-2 w-fit"
              >
                <Shield size={14} />
                Espace Admin
              </a>
            )}

            {/* Mobile user section */}
            {!loading &&
              (user ? (
                <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-1">
                  {/* User header */}
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

                  {/* Account switcher */}
                  <AccountSwitcher
                    accounts={accounts}
                    user={user}
                    switchingId={switchingId}
                    onSwitch={handleSwitch}
                  />

                  {/* Nav links */}
                  <a
                    href={
                      role === "business"
                        ? "/dashboard"
                        : role === "admin"
                          ? "/admin"
                          : "/my-space/profile"
                    }
                    className="flex items-center gap-3 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <User size={16} className="text-gray-400" />
                    Mon espace
                  </a>
                  <a
                    href="/my-space/messages"
                    className="flex items-center gap-3 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <MessageSquare size={16} className="text-gray-400" />
                    Messages
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

                  <LogoutButtons />
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
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
