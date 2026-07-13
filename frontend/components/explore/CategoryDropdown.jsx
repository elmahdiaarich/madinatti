// frontend/components/explore/CategoryDropdown.jsx
"use client";

import { Tag } from "lucide-react";
import { TOURISM_CATEGORIES } from "@/constants/tourismCategories";
import SearchableDropdown from "./SearchableDropdown";

const CATEGORY_OPTIONS = Object.entries(TOURISM_CATEGORIES).map(([slug, cfg]) => ({
  value: slug,
  label: cfg.label,
}));

export default function CategoryDropdown({ active, onChange, width = "w-full" }) {
  return (
    <SearchableDropdown
      label="Catégorie"
      icon={Tag}
      value={active === "all" ? null : active}
      options={CATEGORY_OPTIONS}
      onSelect={(v) => onChange(v || "all")}
      emptyLabel="Toutes les catégories"
      placeholder="Tapez pour chercher une catégorie..."
      width={width}
    />
  );
}