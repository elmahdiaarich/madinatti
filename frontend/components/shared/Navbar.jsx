"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./logos/Logo";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [openServices, setOpenServices] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dropdownRef = useRef(null);

  // -------------------------
  // Sticky navbar on scroll
  // -------------------------
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // -------------------------
  // Click outside dropdown
  // -------------------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenServices(false);
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

  const role = user?.role; // citizen | business | admin

  return (
    <nav
      className={`bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 transition-shadow ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      {/* LOGO */}
      <a href="/" className="flex items-center gap-2 scale-75">
        <Logo />
      </a>

      {/* DESKTOP MENU */}
      <div className="hidden md:flex items-center gap-6">
        <a
          href="/"
          className={`text-sm px-3 py-1.5 rounded-lg font-medium transition ${
            isActive("/")
              ? "bg-primary-mint text-primary-dark"
              : "text-gray-600 hover:text-primary-dark"
          }`}
        >
          Accueil
        </a>

        <a
          href="/explorer"
          className={`text-sm transition ${
            isActive("/explorer")
              ? "text-primary-dark font-medium"
              : "text-gray-600 hover:text-primary-dark"
          }`}
        >
          Explorer
        </a>

        {/* SERVICES DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setOpenServices(!openServices)}
            className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-1 transition ${
              isActive("/jobs") || isActive("/real-estate")
                ? "bg-primary-mint text-primary-dark"
                : "text-gray-600 hover:text-primary-dark"
            }`}
          >
            Services ▾
          </button>

          <AnimatePresence>
            {openServices && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-md w-44 overflow-hidden"
              >
                <a
                  href="/jobs"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Emploi
                </a>
                <a
                  href="/real-estate"
                  className="block px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Immobilier
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <a
          href="/blog"
          className={`text-sm transition ${
            isActive("/blog")
              ? "text-primary-dark font-medium"
              : "text-gray-600 hover:text-primary-dark"
          }`}
        >
          Blog
        </a>

        {/* ROLE-BASED ITEM */}
        {role === "admin" && (
          <a href="/admin" className="text-sm text-red-600 font-medium">
            Admin
          </a>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-3">
        {/* MOBILE BUTTON */}
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
              <span className="font-medium text-primary-dark">{user.name}</span>
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
              className="text-sm text-gray-600 hover:text-primary-dark"
            >
              Connexion
            </a>
            <a
              href="/auth/register"
              className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm hover:bg-primary-sage"
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
            className="absolute top-full left-0 w-full bg-white border-t border-gray-200 md:hidden px-6 py-4 flex flex-col gap-3"
          >
            <a href="/">Accueil</a>
            <a href="/explorer">Explorer</a>
            <a href="/jobs">Emploi</a>
            <a href="/real-estate">Immobilier</a>
            <a href="/blog">Blog</a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
