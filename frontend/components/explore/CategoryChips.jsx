// frontend/components/explore/CategoryChips.jsx
"use client";

import { CATEGORY_LIST } from "@/constants/tourismCategories";

export default function CategoryChips({ active, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
          active === "all"
            ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-black"
            : "bg-white border-black/10 text-black/60 hover:border-black/20"
        }`}
      >
        Tous
      </button>
      {CATEGORY_LIST.map(({ slug, label, icon: Icon }) => (
        <button
          key={slug}
          type="button"
          onClick={() => onChange(slug)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${
            active === slug
              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-black"
              : "bg-white border-black/10 text-black/60 hover:border-black/20"
          }`}
        >
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
        </button>
      ))}
    </div>
  );
}