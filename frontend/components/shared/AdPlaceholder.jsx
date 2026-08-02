"use client";

/**
 * Placeholder ad slot. Swap the inner content for your ad SDK/script later —
 * keep the outer wrapper (size + className) stable when you wire in a real
 * provider so the surrounding layout doesn't shift.
 */
export default function AdPlaceholder({
  variant = "grid", // "grid" | "sidebar" | "mobile-banner"
  label = "Espace publicitaire",
}) {
  const sizing = {
    grid: "h-[260px] w-full",
    sidebar: "h-[600px] w-full",
    rail: "w-[160px] h-[600px]",
    "mobile-banner": "h-[90px] w-full",
  };

  return (
    <div
      className={`${sizing[variant]} rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-300`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide">
        {label}
      </span>
      <span className="text-xs text-gray-300">{variant}</span>
    </div>
  );
}