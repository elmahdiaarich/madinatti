// frontend/components/explore/TourismDetailMap.jsx
"use client";

import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPin, Navigation } from "lucide-react";
import { TOURISM_CATEGORIES } from "@/constants/tourismCategories";

const DEFAULT_ZOOM = 16;

// Lighter loader than the explorer map's: no marker-cluster bundle needed
// for a single pin.<

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

function buildDivIcon(L, Icon) {
  const html = renderToStaticMarkup(
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "9999px",
        border: "3px solid white",
        background: "var(--color-primary-dark)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
      }}
    >
      <Icon size={18} />
    </div>
  );

  return L.divIcon({
    html,
    className: "tourism-detail-map-pin",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

export default function TourismDetailMap({ listing, className = "" }) {
  const mapElRef = useRef(null);
  const leafletMapRef = useRef(null);

  const hasCoords = listing?.latitude != null && listing?.longitude != null;

  useEffect(() => {
    if (!hasCoords) return;
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !mapElRef.current) return;

      // Rebuild fresh each time the listing changes (id navigations reuse
      // this component instance).
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(mapElRef.current, {
        center: [listing.latitude, listing.longitude],
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: false,
        zoomControl: true,
        dragging: true,
        doubleClickZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const cfg = TOURISM_CATEGORIES[listing.category];
      const Icon = cfg?.icon || MapPin;
      const icon = buildDivIcon(L, Icon);

      L.marker([listing.latitude, listing.longitude], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-size:12px;font-weight:600;">${listing.name ?? ""}</div>`
        );

      leafletMapRef.current = map;
      window.dispatchEvent(new Event("resize"));
    });

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id, listing?.latitude, listing?.longitude]);

  if (!hasCoords) return null;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;

  return (
    <div className={`relative w-full ${className}`}>
      <div ref={mapElRef} className="h-full w-full" style={{ zIndex: 0 }} />
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-dark)] shadow-md transition hover:brightness-95"
      >
        <Navigation size={13} /> Itinéraire
      </a>
    </div>
  );
}