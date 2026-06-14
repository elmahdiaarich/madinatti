"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

// ── Icons ─────────────────────────────────────────────────────────────────────

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
    <line x1="3" y1="21" x2="21" y2="21" />
    <path d="M9 8h1" />
    <path d="M9 12h1" />
    <path d="M9 16h1" />
    <path d="M14 8h1" />
    <path d="M14 12h1" />
    <path d="M14 16h1" />
    <path d="M5 21v-16a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
  </svg>
);

const IconHome = () => (
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
    <path d="M5 12l-2 0l9-9l9 9l-2 0" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
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
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="12" y1="12" x2="12" y2="12.01" />
    <path d="M3 13a20 20 0 0 0 18 0" />
  </svg>
);

const IconChevron = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 9l6 6l6-6" />
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

// Toggle icon — flips direction based on open/closed state
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

// ── Services registry ─────────────────────────────────────────────────────────

const BUSINESS_SERVICES = [
  {
    key: "real-estate",
    label: "Immobilier",
    href: "/my-space/services/real-estate",
    icon: IconHome,
  },
  {
    key: "jobs",
    label: "Emploi",
    href: "/my-space/services/jobs",
    icon: IconBriefcase,
  },
];

const COMMON_NAV = [
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
    key: "notifications",
    label: "Notifications",
    href: "/my-space/notifications",
    icon: IconBell,
  },
  {
    key: "messages",
    label: "Messages",
    href: "/my-space/messages",
    icon: IconMail,
  },
];

// ── Nav item ──────────────────────────────────────────────────────────────────
// NEW: accepts `collapsed` prop — hides label + badge text when sidebar is narrow,
// and shows the native browser tooltip (title) for accessibility.

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

      {/* Hide label + badge smoothly via opacity when collapsed */}
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

  // Sidebar open/closed state — persisted to localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("myspace-sidebar") !== "closed";
    }
    return true;
  });

  const isBusiness = user?.role === "business";
  const isInServices = pathname?.startsWith("/my-space/services");

  // Badge messages non lus (business seulement, refresh toutes les 60s)
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!isBusiness || !token) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/messages?limit=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (json.success) setUnreadMessages(json.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, [isBusiness, token]);

  useEffect(() => {
    if (isInServices) setServicesOpen(true);
  }, [isInServices]);

  // NEW: persist sidebar state across page navigations
  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("myspace-sidebar", next ? "open" : "closed");
      return next;
    });
  };

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
        {/*
          NEW:
          - Width transitions between w-64 (open) and w-[60px] (collapsed)
          - overflow-hidden is required so content doesn't bleed during animation
          - transition-[width] animates only the width property for performance
        */}
        <aside
          onClick={!sidebarOpen ? toggleSidebar : undefined}
          className={`
    shrink-0 bg-white border-r border-gray-100 flex flex-col
    sticky top-[57px] h-[calc(100vh-65px)]
    transition-[width] duration-[250ms] ease-in-out overflow-hidden
    ${sidebarOpen ? "w-64" : "w-[60px] cursor-pointer"}
  `}
        >
          {/* Header — NEW: toggle button added, header text fades out when collapsed */}
          <div className="px-4 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between gap-2 min-h-[72px]">
            <div
              className={`transition-opacity duration-150 overflow-hidden ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <p className="text-base font-bold text-[#2D5016] tracking-tight leading-none whitespace-nowrap">
                Mon espace
              </p>
              <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide uppercase whitespace-nowrap">
                {isBusiness ? "Compte Business" : "Citoyen"}
              </p>
            </div>

            {/* Toggle button — NEW */}
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
            {COMMON_NAV.map((item) => (
              <NavItem
                key={item.key}
                {...item}
                active={pathname === item.href}
                collapsed={!sidebarOpen}
                badge={item.key === 'messages' && isBusiness ? unreadMessages : undefined}
              />
            ))}

            {/* My Services — business only */}
            {isBusiness && (
              <div className="mt-2">
                {/* Section label fades out when collapsed */}
                <p
                  className={`
                  text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5 mt-1
                  transition-opacity duration-150 whitespace-nowrap
                  ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
                `}
                >
                  Mes services
                </p>

                {/* Toggle button — shows tooltip when sidebar is collapsed */}
                <button
                  onClick={() => sidebarOpen && setServicesOpen((p) => !p)}
                  title={!sidebarOpen ? "Mes annonces" : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-150 group
                    ${
                      isInServices
                        ? "bg-[#2D5016]/10 text-[#2D5016]"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  {isInServices && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#A7D129] rounded-r-full" />
                  )}
                  <span
                    className={`shrink-0 ${isInServices ? "text-[#2D5016]" : "text-gray-400 group-hover:text-gray-600"}`}
                  >
                    <IconBuilding />
                  </span>

                  {/* Label + chevron fade out when collapsed */}
                  <span
                    className={`flex-1 text-left truncate transition-opacity duration-150 ${!sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                  >
                    Mes annonces
                  </span>
                  <span
                    className={`transition-all duration-200 text-gray-400 ${servicesOpen ? "rotate-180" : ""} ${!sidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                  >
                    <IconChevron />
                  </span>
                </button>

                {/* Sub-items — only render when sidebar is open */}
                {servicesOpen && sidebarOpen && (
                  <div className="mt-1 ml-4 pl-3 border-l-2 border-[#A7D129]/30 flex flex-col gap-0.5">
                    {BUSINESS_SERVICES.map((svc) => {
                      const active = pathname?.startsWith(svc.href);
                      const Icon = svc.icon;
                      return (
                        <Link
                          key={svc.key}
                          href={svc.href}
                          className={`
                            flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150
                            ${
                              active
                                ? "bg-[#2D5016]/10 text-[#2D5016] font-semibold"
                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                            }
                          `}
                        >
                          <span
                            className={`shrink-0 ${active ? "text-[#2D5016]" : "text-gray-400"}`}
                          >
                            <Icon />
                          </span>
                          {svc.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Bottom — avatar + logout */}
          <div className="px-3 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Avatar always visible */}
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

              {/* Name + role fade out when collapsed */}
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

              {/* Logout button fades out when collapsed */}
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
        <main className="flex-1 min-w-0 ">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
