"use client";

import { useEffect, useRef, useState } from "react";
import BaseMap, { loadLeaflet } from "./BaseMap";

function createPinIcon(L) {
  const html = `
    <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
      <div style="
        width:22px;
        height:22px;
        border-radius:9999px;
        background:#2D5016;
        border:2px solid white;
        box-shadow:0 0 0 6px rgba(167,209,41,0.35), 0 1px 3px rgba(0,0,0,0.3);
      "></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: "shared-map-pin",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const IDLE_RESET_MS = 3000;

/**
 * Single fixed-location map — replaces MapFrame. No hover/select interaction,
 * but auto-recenters on the marker after a few seconds of no user activity
 * (pan/zoom), so the pin never stays scrolled out of view for long.
 */
export default function SingleLocationMap({
  latitude,
  longitude,
  location,
  city,
  zoom = 15,
}) {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);
  const idleTimerRef = useRef(null);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const handleReady = (map, L) => {
    mapRef.current = map;
    if (!hasCoords) return;

    // Add the marker + set the view on the next tick, after the map has
    // finished applying its maxBounds/minZoom constraints from BaseMap —
    // calling setView too early can get silently clamped/ignored.
    requestAnimationFrame(() => {
      L.marker([lat, lng], { icon: createPinIcon(L) }).addTo(map);
      map.setView([lat, lng], zoom);
      setMapReady(true);
    });

    const resetToMarker = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        map.setView([lat, lng], zoom, { animate: true });
      }, IDLE_RESET_MS);
    };

    map.on("dragend", resetToMarker);
    map.on("zoomend", resetToMarker);
  };

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <BaseMap
        center={hasCoords ? { lat, lng } : undefined}
        zoom={hasCoords ? zoom : 6}
        scrollWheelZoom={false}
        onReady={handleReady}
      />

      {!hasCoords && (
        <div className="absolute inset-x-0 bottom-0 px-6 py-2.5 bg-amber-50 border-t border-amber-100 text-xs text-amber-600 flex items-center gap-1.5 z-10">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Localisation approximative — {location || ""} {city || ""}
        </div>
      )}
    </div>
  );
}