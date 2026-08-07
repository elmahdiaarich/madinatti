// frontend/components/explore/TourismDetailMap.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LocateFixed, MapPin, Navigation } from "lucide-react";
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

function formatAccuracy(value) {
  if (!Number.isFinite(value)) return "";
  if (value >= 1000) return `+/-${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} km`;
  return `+/-${Math.round(value)} m`;
}

export default function TourismDetailMap({ listing, className = "" }) {
  const mapElRef = useRef(null);
  const leafletMapRef = useRef(null);
  const userLocationRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

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
        attribution: "&copy; OpenStreetMap contributors",
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

  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      const map = leafletMapRef.current;
      if (cancelled || !map) return;

      if (userLocationRef.current) {
        userLocationRef.current.remove();
        userLocationRef.current = null;
      }

      if (!userLocation) return;

      const group = L.layerGroup().addTo(map);
      const accuracy = Number(userLocation.accuracy);

      if (Number.isFinite(accuracy) && accuracy > 0) {
        L.circle([userLocation.latitude, userLocation.longitude], {
          radius: accuracy,
          color: "#1D4ED8",
          weight: 1,
          fillColor: "#93C5FD",
          fillOpacity: 0.14,
        }).addTo(group);
      }

      L.circleMarker([userLocation.latitude, userLocation.longitude], {
        radius: 8,
        color: "#1D4ED8",
        weight: 3,
        fillColor: "#60A5FA",
        fillOpacity: 0.75,
      })
        .addTo(group)
        .bindPopup(
          `<div style="font-size:12px;font-weight:700;">Ma localisation</div>${
            formatAccuracy(accuracy)
              ? `<div style="font-size:11px;color:#6B7280;margin-top:3px;">Precision navigateur ${formatAccuracy(accuracy)}</div>`
              : ""
          }`,
        );

      userLocationRef.current = group;
      map.flyTo([userLocation.latitude, userLocation.longitude], Math.max(map.getZoom(), 14), { duration: 0.7 });
    });

    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  const locateMe = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Localisation non supportee.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocating(false);
      },
      () => {
        setLocationError("Autorise la localisation pour voir ta position.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

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
        <Navigation size={13} /> Itineraire
      </a>
      <button
        type="button"
        onClick={locateMe}
        disabled={locating}
        className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-dark)] shadow-md transition hover:brightness-95 disabled:opacity-50"
      >
        <LocateFixed size={13} /> {locating ? "..." : "Ma position"}
      </button>
      {locationError && (
        <p className="absolute left-3 top-3 z-10 max-w-[220px] rounded bg-white/95 px-3 py-2 text-xs text-red-600 shadow">
          {locationError}
        </p>
      )}
      {userLocation?.accuracy && (
        <p className="absolute left-3 top-3 z-10 max-w-[240px] rounded bg-white/95 px-3 py-2 text-xs text-[#1D4ED8] shadow">
          Position navigateur: precision {formatAccuracy(userLocation.accuracy)}.
        </p>
      )}
    </div>
  );
}
