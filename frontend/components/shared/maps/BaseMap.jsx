"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_CENTER = { lat: 31.7917, lng: -7.0926 }; // Center of Morocco

// Roughly covers Morocco (with a little padding) — [south, west], [north, east]
const MOROCCO_BOUNDS = [
  [20.5, -18.0],
  [36.5, 0.5],
];

export function loadLeaflet() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return;
    if (window.L) return resolve(window.L);

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const existing = document.getElementById("leaflet-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * BaseMap owns only: Leaflet load, map creation/teardown, tile layer,
 * resize observation. It hands the live map instance + `L` back via
 * `onReady`, and forwards clicks via `onMapClick`. No markers, no
 * listings, no interaction logic — that's for MultiPinMap / SingleLocationMap.
 *
 * Tiles: standard OSM (no API key, no low-zoom paywall). Panning/zooming
 * is constrained to Morocco via maxBounds + minZoom.
 */
export default function BaseMap({
  center = DEFAULT_CENTER,
  zoom = 6,
  scrollWheelZoom = true,
  onReady,
  onMapClick,
  className = "",
}) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;

      const map = L.map(mapEl.current, {
        center: [center.lat, center.lng],
        zoom,
        scrollWheelZoom,
        zoomControl: false,
        minZoom: 4,
        maxBounds: MOROCCO_BOUNDS,
        maxBoundsViscosity: 1.0, // fully resist dragging past the bounds
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: "abc",
        maxZoom: 19,
      }).addTo(map);

      if (onMapClick) {
        map.on("click", () => onMapClick());
      }

      mapRef.current = map;
      setMapReady(true);
      onReady?.(map, L);

      // Leaflet can lock in a stale size if the sticky container's final
      // height (calc(100vh - navbar - filterbar)) isn't settled yet on mount.
      // Re-measure a beat later, after layout has actually finished.
      setTimeout(() => {
        map.invalidateSize({ pan: true });
        map.setView(map.getCenter(), map.getZoom(), { animate: false });
      }, 250);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapReady || !mapEl.current) return;
    const ro = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    ro.observe(mapEl.current);
    return () => ro.disconnect();
  }, [mapReady]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const onWinResize = () => mapRef.current?.invalidateSize();
    window.addEventListener("resize", onWinResize);
    return () => window.removeEventListener("resize", onWinResize);
  }, [mapReady]);

  return (
    <div className={`absolute inset-0 bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-gray-200 ${className}`}>
      <div ref={mapEl} className="absolute inset-0 z-0" />
    </div>
  );
}