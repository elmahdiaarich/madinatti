"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l-2 0l9-9l9 9l-2 0" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
  </svg>
);

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="5" width="16" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M4 11h16" />
    <path d="M9 15l2 2l4-4" />
  </svg>
);
const IconUser = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
  </svg>
);

const IconHeart = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.566" />
  </svg>
);

const IconBell = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2-3v-3a7 7 0 0 1 4-6" />
    <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
  </svg>
);

const IconMail = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <polyline points="3 7 12 13 21 7" />
  </svg>
);

const IconBriefcase = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <path d="M2 12h9m11 0h-4" />
  </svg>
);

const IconBuilding = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 21h18" />
    <path d="M5 21V7l8-4v18" />
    <path d="M19 21V11l-6-4" />
    <rect x="9" y="10" width="2" height="3" />
    <rect x="13" y="14" width="2" height="7" />
  </svg>
);

const IconClipboard = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

const IconLogout = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 8v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2" />
    <path d="M9 12h12l-3-3m0 6l3-3" />
  </svg>
);

const IconSidebarToggle = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
  </svg>
);

// ── Nav registries ────────────────────────────────────────────────────────────

const COMMON_NAV = [
  { key: "overview", label: "Vue d'ensemble", href: "/my-space", icon: IconHome },
  { key: "profile", label: "Mon profil", href: "/my-space/profile", icon: IconUser },
  { key: "real-estate", label: "Mes annonces immo", href: "/my-space/real-estate", icon: IconBuilding },
  { key: "worker-profiles", label: "Mes profils prestataire", href: "/my-space/worker-profiles", icon: IconBriefcase },
  { key: "bookings", label: "Mes réservations", href: "/my-space/bookings", icon: IconCalendar },
  { key: "task-requests", label: "Mes demandes", href: "/my-space/task-requests", icon: IconClipboard },
  { key: "events", label: "Mes evenements", href: "/my-space/events", icon: IconCalendar },
  { key: "favorites", label: "Mes favoris", href: "/my-space/favorites", icon: IconHeart },
  { key: "alerts", label: "Mes alertes", href: "/my-space/alerts", icon: IconBell },
  { key: "notifications", label: "Notifications", href: "/my-space/notifications", icon: IconBell },  
  { key: "messages", label: "Messages", href: "/my-space/messages", icon: IconMail },
];

const BUSINESS_NAV = [
  {
    key: "profile",
    label: "Mon profil",
    href: "/my-space/profile",
    icon: IconUser,
  },
  {
    key: "favorites",
    label: "Mes favoris",
    href: "/my-space/favorites",
    icon: IconHeart,
  },
  {
    key: "events",
    label: "Mes evenements",
    href: "/my-space/events",
    icon: IconCalendar,
  },
];

const JOURNALIST_NAV = [
  { key: "profile", label: "Mon profil", href: "/my-space/profile", icon: IconUser },
  { key: "newsroom", label: "Mes articles", href: "/my-space/newsroom", icon: IconClipboard },
  { key: "notifications", label: "Notifications", href: "/my-space/notifications", icon: IconBell },
  { key: "messages", label: "Messages", href: "/my-space/messages", icon: IconMail },
];

// ── Nav item ──────────────────────────────────────────────────────────────────

function NavItem({ href, icon: Icon, label, active, badge, collapsed }) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={`
        relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-150 group
        ${
          active
            ? "bg-[#2D5016]/10 text-[#2D5016]"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
        }
      `}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#A7D129] rounded-r-full" />
      )}

      <span
        className={`shrink-0 transition-colors ${active ? "text-[#2D5016]" : "text-gray-400 group-hover:text-gray-600"}`}
      >
        <Icon />
      </span>

      <span
        className={`flex-1 truncate transition-opacity duration-150 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        {label}
      </span>

      {badge > 0 && (
        <span
          className={`shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center bg-[#A7D129]/20 text-[#2D5016] transition-opacity duration-150 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

export default function MySpaceLayout({ children }) {
  const { user, logout, token } = useAuth();
  const pathname = usePathname();
  const [servicesOpen, setServicesOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("myspace-sidebar") !== "closed";
    }
    return true;
  });

  const isInServices = pathname?.startsWith("/my-space/services");

  useEffect(() => {
    if (isInServices) setServicesOpen(true);
  }, [isInServices]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("myspace-sidebar", next ? "open" : "closed");
      return next;
    });
  };

  const isBusiness = user?.role === "business";
  const isJournalist = user?.role === "journalist";
  const activeNav = isBusiness ? BUSINESS_NAV : isJournalist ? JOURNALIST_NAV : COMMON_NAV;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const handleLogout = async () => {
    await logout();
    window.location.href = "/auth/login";
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-[calc(100vh-57px)] bg-gray-50">
        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <aside
          onClick={!sidebarOpen ? toggleSidebar : undefined}
          className={`
            shrink-0 bg-white border-r border-gray-100 flex flex-col
            sticky top-[57px] h-[calc(100vh-65px)]
            transition-[width] duration-[250ms] ease-in-out overflow-hidden
            ${sidebarOpen ? "w-64" : "w-[60px] cursor-pointer"}
          `}
        >
          {/* Header */}
          <div className="px-4 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between gap-2 min-h-[72px]">
            <div
              className={`transition-opacity duration-150 overflow-hidden ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <p className="text-base font-bold text-[#2D5016] tracking-tight leading-none whitespace-nowrap">
                Mon espace
              </p>
              <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide uppercase whitespace-nowrap">
                {isBusiness ? "Business" : isJournalist ? "Journaliste" : "Citoyen"}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar();
              }}
              title={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
              aria-label={sidebarOpen ? "Réduire le menu" : "Agrandir le menu"}
              className={`
                shrink-0 w-7 h-7 rounded-md border border-gray-200
                flex items-center justify-center
                text-gray-400 hover:text-gray-700 hover:bg-gray-100
                transition-all duration-150
                ${!sidebarOpen ? "mx-auto" : ""}
              `}
            >
              <span
                className={`transition-transform duration-[250ms] inline-flex ${sidebarOpen ? "" : "rotate-180"}`}
              >
                <IconSidebarToggle />
              </span>
            </button>
          </div>

          {/* Nav */}
<nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 flex flex-col gap-0.5">
  {activeNav.map(({ key, href, ...item }) => {
    const isExactOnly = href === "/my-space";
    const active = isExactOnly ? pathname === href : pathname?.startsWith(href);
    return (
      <NavItem
        key={key}
        href={href}
        {...item}
        active={active}
        collapsed={!sidebarOpen}
      />
    );
  })}
</nav>

          {/* Bottom — avatar + logout */}
          <div className="px-3 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-[#A7D129]/20 border border-[#A7D129]/40 flex items-center justify-center shrink-0 overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#2D5016]">
                    {initials}
                  </span>
                )}
              </div>

              <div
                className={`flex-1 min-w-0 transition-opacity duration-150 ${!sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
              >
                <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {user?.name || "Utilisateur"}
                </p>
                <p className="text-xs text-gray-400 truncate leading-tight mt-0.5 capitalize">
                  {user?.role}
                </p>
              </div>

              <button
                onClick={handleLogout}
                title="Se déconnecter"
                className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 ${!sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
              >
                <IconLogout />
              </button>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
