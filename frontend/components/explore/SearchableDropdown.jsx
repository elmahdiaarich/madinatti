// frontend/components/explore/SearchableDropdown.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * Typeable dropdown: click to open, type to filter options, click/enter to
 * select. Options can be plain strings or { value, label } objects.
 *
 * Mirrors the SelectDropdown/SimpleSelect pattern from HeroSearch so every
 * filter across the app behaves the same way — no native <select>s.
 */
export default function SearchableDropdown({
  label,
  icon: Icon,
  value,
  options,
  onSelect,
  disabled = false,
  searchable = true,
  placeholder = "Rechercher...",
  emptyLabel,
  width = "w-full",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const btnRef = useRef(null);

  // Normalize to { value, label } pairs.
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const selected = normalized.find((o) => o.value === value);

  const filtered =
    searchable && query.length > 0
      ? normalized.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
      : normalized;

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const calculate = () => {
      const btn = btnRef.current.getBoundingClientRect();
      setPos({ top: btn.bottom + 6, left: btn.left, width: btn.width });
    };
    calculate();
    window.addEventListener("scroll", calculate, true);
    window.addEventListener("resize", calculate);
    return () => {
      window.removeEventListener("scroll", calculate, true);
      window.removeEventListener("resize", calculate);
    };
  }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className={`relative ${width}`} ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
          disabled
            ? "cursor-not-allowed bg-gray-100 text-gray-300"
            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
        }`}
      >
        {Icon && <Icon size={14} className="flex-shrink-0 text-[var(--color-primary-sage)]" />}
        <span className="flex-1 truncate">{selected ? selected.label : label}</span>
        <ChevronDown
          size={13}
          className={`flex-shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.13 }}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: Math.max(pos.width, 200),
              zIndex: 999,
            }}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
          >
            {searchable && (
              <div className="p-2">
                <input
                  autoFocus
                  type="text"
                  placeholder={placeholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none"
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => {
                  onSelect(null);
                  setQuery("");
                  setOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-400 hover:bg-gray-50"
              >
                {emptyLabel || label}
              </button>
              {filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSelect(opt.value);
                    setQuery("");
                    setOpen(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    value === opt.value
                      ? "bg-[var(--color-primary-mint)] font-medium text-[var(--color-primary-dark)]"
                      : "text-gray-800 hover:bg-[var(--color-primary-mint)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400">Aucun résultat</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}