"use client";

import { useState, useEffect } from "react";
import { Maximize2, Minimize2, Map as MapIcon, X } from "lucide-react";

export default function SplitMapLayout({ children, map }) {
  const [mapWidth, setMapWidth] = useState("quarter"); // 'quarter' | 'half'
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handle = (e) => {
      if (!e.matches) setMapWidth("half");
    };
    handle(mq);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);
  
  // Measure the sticky filter bar's height so the map panel sticks right
  // below it instead of overlapping it.
  useEffect(() => {
    const el = document.querySelector("[data-sticky-filterbar]");
    if (!el) return;

    const setVar = () => {
      document.documentElement.style.setProperty("--filterbar-h", `${el.offsetHeight}px`);
      requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
    };
    setVar();

    const observer = new ResizeObserver(setVar);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const widthClass = mapWidth === "half" ? "md:w-1/2" : "md:w-1/3";

  return (
    <div className="relative flex items-start">
      {/* Listings column — cards size themselves via CSS grid auto-fill.
          min-w-0 is required so this flex child can shrink below its
          content's natural width instead of overflowing the row. */}
      <div className="flex-1 min-w-0">{children}</div>

      {/* Desktop map panel */}
      <div
        className={`hidden md:flex ${widthClass} shrink-0 sticky flex-col`}
        style={{
          top: "calc(var(--navbar-h, 0px) + var(--filterbar-h, 0px) + 16px)",
          height: "calc(100vh - var(--navbar-h, 0px) - var(--filterbar-h, 0px) - 32px)",
          minHeight: "400px",
        }}
      >
        <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setMapWidth((w) => (w === "half" ? "quarter" : "half"))}
            aria-label={mapWidth === "half" ? "Réduire la carte" : "Agrandir la carte"}
            className="hidden lg:flex absolute top-3 left-3 z-[500] w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md items-center justify-center text-gray-600 hover:bg-gray-50 transition"
          >
            {mapWidth === "half" ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          {map}
        </div>
      </div>

      {/* Mobile floating trigger */}
      <button
        type="button"
        onClick={() => setMobileMapOpen(true)}
        className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#2D5016] text-white font-bold text-sm shadow-lg"
      >
        <MapIcon size={16} />
        Carte
      </button>

      {/* Mobile drawer */}
      {mobileMapOpen && (
        <div className="md:hidden fixed inset-0 z-[200]">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMapOpen(false)}
          />
          <div className="absolute top-0 left-0 h-full w-full bg-white shadow-2xl flex flex-col animate-slide-in-left">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <span className="font-bold text-gray-800 text-sm">Carte</span>
              <button
                type="button"
                onClick={() => setMobileMapOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative flex-1 min-h-0">{map}</div>
          </div>
        </div>
      )}
    </div>
  );
}