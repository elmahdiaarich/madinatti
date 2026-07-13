// frontend/components/admin/AdminLocationPicker.jsx
"use client";

import { useEffect, useRef } from "react";

const DEFAULT_CENTER = [34.261, -6.58]; // Kenitra
const DEFAULT_ZOOM = 13;

function loadLeaflet() {
  return new Promise((resolve) => {
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
      return;
    }
    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
}

/**
 * Click (or drag the pin) anywhere on the map to set latitude/longitude.
 * `latitude`/`longitude` props are strings or numbers from the form state;
 * `onChange(lat, lng)` is called with numbers rounded to 6 decimals.
 */
export default function AdminLocationPicker({ latitude, longitude, onChange }) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !mapElRef.current || mapRef.current) return;

      const hasInitial = latitude && longitude;
      const start = hasInitial
        ? [parseFloat(latitude), parseFloat(longitude)]
        : DEFAULT_CENTER;

      const map = L.map(mapElRef.current, {
        center: start,
        zoom: hasInitial ? 15 : DEFAULT_ZOOM,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(start, { draggable: true }).addTo(map);
      markerRef.current = marker;

      const emit = (latlng) => {
        onChangeRef.current(
          Math.round(latlng.lat * 1e6) / 1e6,
          Math.round(latlng.lng * 1e6) / 1e6
        );
      };

      marker.on("dragend", () => emit(marker.getLatLng()));
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        emit(e.latlng);
      });

      window.dispatchEvent(new Event("resize"));
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Only initialize once — lat/lng edits after that are driven by the map
    // itself, not re-synced from props (avoids fighting the user's drag).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <div ref={mapElRef} className="h-56 w-full" />
      <p className="bg-gray-50 px-3 py-1.5 text-[11px] text-gray-400">
        Cliquez sur la carte ou déplacez le repère pour définir la position.
      </p>
    </div>
  );
}