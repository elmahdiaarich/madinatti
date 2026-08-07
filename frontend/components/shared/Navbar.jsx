"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Plus,
  MoreHorizontal,
  Shield,
  User,
  Heart,
  Bell,
  MessageSquare,
  LogOut,
  X,
  Grid3x3,
  HeartPulse,
  Briefcase,
  Home,
  Car,
  Newspaper,
  Compass,
  Factory,
  GraduationCap,
  CalendarDays,
  Moon,
  Sun,
  Store,
} from "lucide-react";
import GoogleAuth from "../../components/auth/GoogleAuth";
import Logo from "./logos/Logo";

// ── FEATURE FLAG (code-only, no UI control) ───────────────────────────────────
// Passe à true pour réactiver le dropdown de sous-catégories au survol du sous-nav.
const ENABLE_SUBCATEGORY_HOVER = true;

// ── TOP-LEVEL CORE MODULE LINKS (now inline with the logo/profile row) ───────
// Actualités placée juste après Véhicules, comme demandé.
const SUB_NAV_LINKS = [
  { label: "Emploi", href: "/jobs", icon: Briefcase },
  { label: "Immobilier", href: "/real-estate", icon: Home },
  { label: "Véhicules", href: "/cars", icon: Car },
  { label: "Actualités", href: "/press", icon: Newspaper },
  { label: "Evenements", href: "/evenements", icon: CalendarDays },
  { label: "Tourisme", href: "/tourisme", icon: Compass },
  { label: "Industrie", href: "/industrie", icon: Factory },
  { label: "Education", href: "/education", icon: GraduationCap },
  { label: "Santé", href: "/sante", icon: HeartPulse },
];

// Toujours visibles dès 768px — aucun retour à la ligne possible
const PRIMARY_SUB_NAV_LINKS = SUB_NAV_LINKS.slice(0, 5);
// Repliés dans "Plus" en tablette (768–1023px), affichés en ligne dès le desktop (lg+)
const SECONDARY_SUB_NAV_LINKS = SUB_NAV_LINKS.slice(5);
 /* const SUB_NAV_LINKS = [
  { label: "Emploi", href: "/jobs" },
  { label: "Immobilier", href: "/real-estate" },
  { label: "Véhicules", href: "/cars" },
  { label: "Actualités", href: "/press" },
  { label: "Tourisme", href: "/tourisme" },
  { label: "Industrie", href: "/industrie" },
  { label: "Santé", href: "/sante", icon: HeartPulse },
];  */
// ── ALL CATEGORIES (shown inside the "Catégories" left drawer + hover dropdowns) ──
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
      "Hôpitaux et cliniques",
      "Laboratoires d'analyses",
      "Pharmacies",
      "Médecins et cabinets",
      "Dentistes",
      "Radiologie",
      "Parapharmacies",
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
        <form onSubmit={handleAddAccountSubmit} className="flex flex-col gap-2 pt-1 pb-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Nouveau Compte
            </p>
            <button
              type="button"
              onClick={() => { setShowAddAccount(false); setAddError(""); }}
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
            autoComplete="username"
            value={addForm.email}
            onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#A7D129] transition"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            required
            autoComplete="current-password"
            value={addForm.password}
            onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#A7D129] transition"
          />
          {addError && <p className="text-[10px] text-red-500 font-medium">{addError}</p>}
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
            <GoogleAuth onSuccess={() => setUserMenuOpen(false)} redirect={false} />
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
    if (category && typeof category === "object") {
      router.push(category.href);
    } else {
      const url = category
        ? `${href}?category=${encodeURIComponent(category)}`
        : href;
      router.push(url);
    }
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
                            const isObj = typeof cat === "object" && cat !== null;
                            const key = isObj ? cat.label : cat;
                            const label = isObj ? cat.label : cat;
                            return (
                              <button
                                key={key}
                                onClick={() => handleGo(svc.href, cat)}
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
  const [theme, setTheme] = useState("light");

  // Categories drawer state
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);
  const [hoveredModule, setHoveredModule] = useState(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const moreMenuRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

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
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
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
    setMoreMenuOpen(false);
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

  const handleModuleMouseEnter = (label) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredModule(label);
  };

  const handleModuleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredModule(null), 150);
  };

  // Rendu d'un lien de sous-nav, réutilisé pour les modules principaux ET secondaires
  const renderSubNavLink = (link) => {
    const svc = ENABLE_SUBCATEGORY_HOVER
      ? NAV_SERVICES.find((s) => s.href === link.href)
      : null;
    const isHovered = hoveredModule === link.label;
    const active =
      isModuleActive(link.href) || (link.href === "/" ? isActive("/") : false);
    const LinkIcon = link.icon;

    return (
      <div
        key={link.label}
        className="relative px-0 lg:px-0.5"
        onMouseEnter={() => svc && handleModuleMouseEnter(link.label)}
      >
        <a
          href={link.href}
          className={`flex items-center gap-1 text-[10px] lg:text-[11px] xl:text-[12px] font-bold tracking-normal uppercase transition whitespace-nowrap px-1.5 xl:px-2 py-1 lg:py-1.5 rounded-full ${
            active
              ? "bg-[#E8F5D0] text-[#2D5016]"
              : "text-gray-400 hover:text-[#2D5016] hover:bg-gray-50"
          }`}
        >
          {LinkIcon && (
            <LinkIcon size={12} className="shrink-0 hidden xl:inline" />
          )}
          {link.label}
          {svc && (
            <ChevronDown
              size={10}
              className={`hidden lg:inline transition-transform duration-150 ${
                isHovered ? "rotate-180" : ""
              }`}
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
              <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden py-1.5 normal-case">
                <a
                  href={svc.href}
                  className="block px-4 py-2 text-xs font-bold text-[#2D5016] hover:bg-[#E8F5D0] transition-colors"
                >
                  Voir tout — {svc.label} →
                </a>
                {svc.categories.map((cat) => {
                  const isObj = typeof cat === "object" && cat !== null;
                  const label = isObj ? cat.label : cat;
                  const href = isObj ? cat.href : svc.href;
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
  };

  const isActive = (path) => pathname === path;
  const isModuleActive = (href) =>
    pathname === href || pathname?.startsWith(href + "/");
  const role = user?.role;
  const hasProBoutique = role === "business" && Boolean(user?.subscription?.plan?.hasBadge);

  // ── Shared logout buttons ─────────────────────────────────────────────────
  const LogoutButtons = () => (
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
    <div
      className={`w-full flex flex-col bg-white border-b border-gray-200 sticky top-0 z-50 transition-shadow ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      {/* 1. Thin Top Category Trigger Bar */}
      <div className="hidden items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-1.5 backdrop-blur-xs md:flex">
        <button
          type="button"
          onClick={() => setCategoriesOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#2D5016] transition"
        >
          <span className="text-base leading-none">☰</span> Sélectionner une catégorie
        </button>

        <div className="flex gap-4 text-[11px] font-medium text-gray-400">
         <a href="/#faq" className="hover:text-black transition">Aide & FAQ</a>
          <a href="/#contact" className="hover:text-black transition">Nous contacter</a>
        </div>
      </div>

      {/* 2. Main Bar — Logo + Sous-nav (Emploi, Immobilier, Véhicules...) + Profil, tous alignés sur la même ligne */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-3"
        onMouseLeave={handleModuleMouseLeave}
      >
        {/* LOGO */}
        <a href="/" className="flex min-w-0 shrink-0 items-center gap-2 [&_img]:h-12 [&_img]:w-auto sm:[&_img]:h-16">
          <Logo />
        </a>

        {/* Sous-nav modules — au même niveau que logo & profil */}
        <div className="hidden md:flex flex-1 items-center justify-center flex-nowrap gap-x-0 lg:gap-x-0.5">
          {/* Modules principaux : toujours visibles dès 768px, ne wrappent jamais */}
          {PRIMARY_SUB_NAV_LINKS.map(renderSubNavLink)}

          {/* Modules secondaires : réintégrés en ligne à partir du desktop (lg = 1024px) */}
          <div className="hidden 2xl:contents">
            {SECONDARY_SUB_NAV_LINKS.map(renderSubNavLink)}
          </div>

          {/* Bouton "Plus" : uniquement en tablette 768–1023px, regroupe Tourisme/Industrie/Santé */}
          <div className="relative 2xl:hidden" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setMoreMenuOpen((p) => !p)}
              className={`flex items-center gap-1 text-[10px] font-bold tracking-normal uppercase transition whitespace-nowrap px-1.5 py-1 rounded-full ${
                moreMenuOpen
                  ? "bg-[#E8F5D0] text-[#2D5016]"
                  : "text-gray-400 hover:text-[#2D5016] hover:bg-gray-50"
              }`}
            >
              <MoreHorizontal size={12} className="shrink-0" />
              Plus
              <ChevronDown
                size={10}
                className={`transition-transform duration-150 ${
                  moreMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {moreMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full pt-2 w-52 z-50"
                >
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden py-1.5">
                    {SECONDARY_SUB_NAV_LINKS.map((link) => {
                      const LinkIcon = link.icon;
                      const active = isModuleActive(link.href);
                      return (
                        <a
                          key={link.label}
                          href={link.href}
                          onClick={() => setMoreMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm normal-case transition-colors ${
                            active
                              ? "bg-[#E8F5D0] text-[#2D5016] font-semibold"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {LinkIcon && (
                            <LinkIcon
                              size={15}
                              className={active ? "text-[#2D5016]" : "text-gray-400"}
                            />
                          )}
                          {link.label}
                        </a>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action controls / User dropdown */}
        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            {role === "admin" && (
              <a
                href="/admin"
                className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 overflow-hidden bg-[#2D5016] text-white hover:bg-[#3a6b1e] shadow-sm"
              >
                <Shield size={13} className="stroke-[2.5]" />
                <span>Espace Admin</span>
              </a>
            )}
            {hasProBoutique && (
              <a
                href="/dashboard/shop"
                className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 overflow-hidden bg-[#E8F5D0] text-[#2D5016] hover:bg-[#A7D129]/40 shadow-sm"
              >
                <Store size={13} className="stroke-[2.5]" />
                <span>Ma boutique</span>
              </a>
            )}
            {!loading && !user && (
              <>
                <a
                  href="/auth/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                >
                  S'inscrire
                </a>
                <a
                  href="/auth/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#2D5016] text-white hover:bg-[#1e3a0f] transition shadow-sm"
                >
                  Se connecter
                </a>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-[#A7D129] hover:text-[#2D5016] sm:flex"
              aria-label={theme === "dark" ? "Activer le theme clair" : "Activer le theme sombre"}
              title={theme === "dark" ? "Theme clair" : "Theme sombre"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              className="md:hidden text-gray-700 font-medium text-lg px-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Ouvrir le menu"
            >
              ☰
            </button>

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

                {/* ── AVATAR DROPDOWN ── */}
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

                        <AccountSwitcher
  accounts={accounts}
  user={user}
  switchingId={switchingId}
  onSwitch={handleSwitch}
/>

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

                        <div className="py-1">
                          <DropdownItem
                            href={
                              role === "business"
                                ? "/dashboard"
                                : role === "admin"
                                  ? "/admin"
                                  : "/my-space/profile"
                            }
                            icon={<User size={16} />}
                            label="Mon espace"
                            active={pathname === "/dashboard" || pathname?.startsWith("/my-space")}
                            onClick={() => setUserMenuOpen(false)}
                          />
                          {hasProBoutique && (
                            <DropdownItem
                              href="/dashboard/shop"
                              icon={<Store size={16} />}
                              label="Ma boutique"
                              active={pathname?.startsWith("/dashboard/shop")}
                              onClick={() => setUserMenuOpen(false)}
                            />
                          )}
                          {role === "citizen" && (
                            <DropdownItem
                              href="/my-space/real-estate"
                              icon={<Home size={16} />}
                              label="Mes annonces immo"
                              active={pathname?.startsWith("/my-space/real-estate")}
                              onClick={() => setUserMenuOpen(false)}
                            />
                          )}
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
                        </div>

                        <LogoutButtons />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Categories drawer */}
      <CategoriesDrawer
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
        expandedModule={expandedModule}
        setExpandedModule={setExpandedModule}
        router={router}
      />

      {/* Mobile Drawer menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-gray-200 bg-white px-6 py-4 flex flex-col gap-1 overflow-hidden"
          >
            {SUB_NAV_LINKS.map((mod) => {
              const ModIcon = mod.icon;
              return (
                <a
                  key={mod.label}
                  href={mod.href}
                  className={`flex items-center gap-2.5 text-sm py-2 px-2 rounded-lg font-medium transition ${
                    isModuleActive(mod.href)
                      ? "text-[#2D5016] font-semibold bg-[#E8F5D0]"
                      : "text-gray-700"
                  }`}
                >
                  {ModIcon && <ModIcon size={16} className="text-gray-400 shrink-0" />}
                  {mod.label}
                </a>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                setCategoriesOpen(true);
              }}
              className="flex items-center gap-2 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50 text-left w-full"
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

            {!loading &&
              (user ? (
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

                  <AccountSwitcher
  accounts={accounts}
  user={user}
  switchingId={switchingId}
  onSwitch={handleSwitch}
/>

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
                  {hasProBoutique && (
                    <a
                      href="/dashboard/shop"
                      className="flex items-center gap-3 text-sm font-semibold text-[#2D5016] px-2 py-2 rounded-lg bg-[#E8F5D0]"
                    >
                      <Store size={16} className="text-[#2D5016]" />
                      Ma boutique
                    </a>
                  )}
                  {role === "citizen" && (
                    <a
                      href="/my-space/real-estate"
                      className="flex items-center gap-3 text-sm text-gray-700 px-2 py-2 rounded-lg hover:bg-gray-50"
                    >
                      <Home size={16} className="text-gray-400" />
                      Mes annonces immo
                    </a>
                  )}
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
    </div>
  );
}
