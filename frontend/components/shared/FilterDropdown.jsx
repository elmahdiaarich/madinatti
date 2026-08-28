"use client";

import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

export function FilterDropdown({
  label,
  icon: Icon,
  active,
  isOpen,
  onToggle,
  onClose,
  width = "w-64",
  className = "",
  align = "left", // 'left' | 'right' — 'right' opens the panel leftward, useful for the last item in a row so it doesn't overflow past the viewport edge
  children,
}) {
  const ref = useRef(null);
  useClickOutside(ref, onClose);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-2 border border-gray-400 rounded-3xl px-3 py-3 text-left text-sm transition-colors
          ${
            active
              ? "bg-[#E8F5D0] text-[#2D5016] font-medium"
              : "bg-gray-50 text-gray-700 hover:bg-gray-100"
          }`}
      >
        {Icon && (
          <Icon
            size={14}
            className={`flex-shrink-0 ${active ? "text-[#2D5016]" : "text-gray-400"}`}
          />
        )}
        <span className="flex-1 truncate">{label}</span>
        <ChevronDown
          size={13}
          className={`flex-shrink-0 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-[calc(100%+6px)] ${width} max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-gray-200 shadow-xl z-[100] p-4`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function OptionRow({ label, isChecked, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors
        ${isChecked ? "bg-[#2D5016] text-white" : "text-gray-600 hover:bg-gray-50"}`}
    >
      <div
        className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0
          ${isChecked ? "bg-[#A7D129] border-[#A7D129]" : "border-gray-300"}`}
      >
        {isChecked && (
          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="truncate">{label}</span>
    </div>
  );
}