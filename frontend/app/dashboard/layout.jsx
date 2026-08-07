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

const IconChart = () => (
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
    <path d="M3 3v18h18" />
    <path d="M18 17V9" />
    <path d="M13 17V5" />
    <path d="M8 17v-3" />
  </svg>
);

const IconCar = () => (
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
    {/* Car body */}
    <path d="M3 11 L5 6 Q6 4 8 4 L16 4 Q18 4 19 6 L21 11" />
    <rect x="2" y="11" width="20" height="6" rx="1.5" />
    {/* Wheels */}
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    {/* Windows */}
    <path d="M7.5 4.5 L6.5 9 L11 9 L11 4.5 Z" />
    <path d="M13 4.5 L13 9 L17.5 9 L16.5 4.5 Z" />
  </svg>
);

const IconStar = () => (
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
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconDashboard = () => (
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
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const IconSearch = () => (
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
    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
  </svg>
);

const IconCoin = () => (
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
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.5c0-1.1 1.12-2 2.5-2s2.5.9 2.5 2c0 2.5-5 1.5-5 4 0 1.1 1.12 2 2.5 2s2.5-.9 2.5-2" />
  </svg>
);

const IconApplications = () => (
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
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

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

export default function DashboardLayout({ children }) {
  const { user, logout, token } = useAuth();
  const pathname = usePathname();
  const [servicesOpen, setServicesOpen] = useState(false);

  // Sidebar open/closed state — persisted to localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("dashboard-sidebar") !== "closed";
    }
    return true;
  });

  const isInListings = pathname?.startsWith("/dashboard/listings");
  const hasProBoutique = user?.role === "business" && Boolean(user?.subscription?.plan?.hasBadge);

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!token) return;
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
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/notifications?limit=1`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await res.json();
        if (json.success) setUnreadNotifs(json.unreadCount || 0);
      } catch {}
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (isInListings) setServicesOpen(true);
  }, [isInListings]);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("dashboard-sidebar", next ? "open" : "closed");
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

  const BUSINESS_SERVICES = [
    {
      key: "real-estate",
      label: "Immobilier",
      href: "/dashboard/listings/real-estate",
      icon: IconHome,
    },
    {
      key: "jobs",
      label: "Emploi",
      href: "/dashboard/listings/jobs",
      icon: IconBriefcase,
    },
    {
      key: "cars",
      label: "voitures",
      href: "/dashboard/listings/cars",
      icon: IconCar,
    },
  ];

  return (
    <ProtectedRoute roles={["business" , "citizen"]}>
      <div className="flex min-h-[calc(100vh-57px)] bg-gray-50">
        <aside
          onClick={!sidebarOpen ? toggleSidebar : undefined}
          className={`
            shrink-0 bg-white border-r border-gray-100 flex flex-col
            sticky top-[57px] h-[calc(100vh-65px)]
            transition-[width] duration-[250ms] ease-in-out overflow-hidden
            ${sidebarOpen ? "w-64" : "w-[60px] cursor-pointer"}
          `}
        >
          <div className="px-4 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between gap-2 min-h-[72px]">
            <div
              className={`transition-opacity duration-150 overflow-hidden ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            >
              <p className="text-base font-bold text-[#2D5016] tracking-tight leading-none whitespace-nowrap">
                Espace Pro
              </p>
              <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide uppercase whitespace-nowrap">
                Compte Business
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

          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 flex flex-col gap-0.5">
            <NavItem
              href="/dashboard"
              icon={IconDashboard}
              label="Vue d'ensemble"
              active={pathname === "/dashboard"}
              collapsed={!sidebarOpen}
            />

            <div className="mt-2">
              <p
                className={`
                text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5 mt-1
                transition-opacity duration-150 whitespace-nowrap
                ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
              `}
              >
                Annonces
              </p>

              <button
                onClick={() => sidebarOpen && setServicesOpen((p) => !p)}
                title={!sidebarOpen ? "Mes annonces" : undefined}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150 group
                  ${
                    isInListings
                      ? "bg-[#2D5016]/10 text-[#2D5016]"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                {isInListings && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#A7D129] rounded-r-full" />
                )}
                <span
                  className={`shrink-0 ${isInListings ? "text-[#2D5016]" : "text-gray-400 group-hover:text-gray-600"}`}
                >
                  <IconBuilding />
                </span>

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

            <div className="mt-4">
              <p
                className={`
                text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5 mt-1
                transition-opacity duration-150 whitespace-nowrap
                ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
              `}
              >
                Gestion
              </p>
              <NavItem
                href="/dashboard/applications"
                icon={IconApplications}
                label="Candidatures"
                active={pathname?.startsWith("/dashboard/applications")}
                collapsed={!sidebarOpen}
              />
              <NavItem
                href="/dashboard/messages"
                icon={IconMail}
                label="Messages"
                active={pathname?.startsWith("/dashboard/messages")}
                collapsed={!sidebarOpen}
                badge={unreadMessages}
              />
              <NavItem
                href="/dashboard/notifications"
                icon={IconBell}
                label="Notifications"
                active={pathname?.startsWith("/dashboard/notifications")}
                collapsed={!sidebarOpen}
                badge={unreadNotifs}
              />
              <NavItem
                href="/dashboard/stats"
                icon={IconChart}
                label="Statistiques"
                active={pathname?.startsWith("/dashboard/stats")}
                collapsed={!sidebarOpen}
              />
              {hasProBoutique && (
                <NavItem
                  href="/dashboard/shop"
                  icon={IconBuilding}
                  label="Boutique"
                  active={pathname?.startsWith("/dashboard/shop")}
                  collapsed={!sidebarOpen}
                />
              )}
              <NavItem
                href="/dashboard/subscription"
                icon={IconStar}
                label="Abonnement"
                active={pathname?.startsWith("/dashboard/subscription")}
                collapsed={!sidebarOpen}
              />
              <NavItem
                href="/dashboard/headhunter"
                icon={IconSearch}
                label="Headhunter"
                active={pathname?.startsWith("/dashboard/headhunter")}
                collapsed={!sidebarOpen}
              />
              <NavItem
                href="/dashboard/credits"
                icon={IconCoin}
                label="Crédits Headhunter"
                active={pathname?.startsWith("/dashboard/credits")}
                collapsed={!sidebarOpen}
              />
              <NavItem
                href="/dashboard/company"
                icon={IconBuilding}
                label="Profil entreprise"
                active={pathname?.startsWith("/dashboard/company")}
                collapsed={!sidebarOpen}
              />
            </div>
          </nav>

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

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
