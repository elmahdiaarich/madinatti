"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPin } from "lucide-react";
import { HEALTH_SUBCATEGORY_MAP } from "@/constants/healthCategories";

const DEFAULT_CENTER = { lat: 33.5731, lng: -7.5898 };
const DEFAULT_ZOOM = 12;

function hasGoogleKey() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
  return key && key !== "replace_me";
}

function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google.maps);
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
    if (!key || key === "replace_me") return reject(new Error("NO_GOOGLE_KEY"));

    const existing = document.getElementById("google-maps-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google.maps));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-js";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function loadLeaflet() {
  return new Promise((resolve, reject) => {
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

function googlePin(color) {
  return {
    path: "M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 1.25,
    anchor: new window.google.maps.Point(12, 22),
  };
}

function leafletIcon(L, place) {
  const cfg = HEALTH_SUBCATEGORY_MAP[place.subcategory];
  const Icon = cfg?.icon || MapPin;
  const html = renderToStaticMarkup(
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: cfg?.color || "#2D5016",
        color: "white",
        border: "2px solid white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,.25)",
      }}
    >
      <Icon size={15} />
    </div>,
  );

  return L.divIcon({
    html,
    className: "health-map-pin",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
}

export default function GoogleHealthMap({
  places,
  selectedId,
  onSelect,
  onBoundsChanged,
  center,
}) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const providerRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  const pins = useMemo(
    () => (places || []).filter((p) => p.latitude != null && p.longitude != null),
    [places],
  );

  useEffect(() => {
    let cancelled = false;

    const initLeaflet = () => {
      loadLeaflet().then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        providerRef.current = "leaflet";
        const initial = center || DEFAULT_CENTER;
        const map = L.map(mapEl.current, {
          center: [initial.lat, initial.lng],
          zoom: DEFAULT_ZOOM,
          scrollWheelZoom: true,
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);
        map.on("moveend", () => {
          const c = map.getCenter();
          const b = map.getBounds();
          onBoundsChanged?.({
            lat: c.lat,
            lng: c.lng,
            north: b.getNorth(),
            east: b.getEast(),
            south: b.getSouth(),
            west: b.getWest(),
          });
        });
        mapRef.current = map;
        setMapReady(true);
      });
    };

    if (!hasGoogleKey()) {
      initLeaflet();
      return () => {
        cancelled = true;
        if (providerRef.current === "leaflet" && mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        providerRef.current = "google";
        mapRef.current = new maps.Map(mapEl.current, {
          center: center || DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          clickableIcons: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        mapRef.current.addListener("idle", () => {
          const bounds = mapRef.current.getBounds();
          const c = mapRef.current.getCenter();
          if (!bounds || !c) return;
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          onBoundsChanged?.({
            lat: c.lat(),
            lng: c.lng(),
            north: ne.lat(),
            east: ne.lng(),
            south: sw.lat(),
            west: sw.lng(),
          });
        });
        setMapReady(true);
      })
      .catch(initLeaflet);

    return () => {
      cancelled = true;
      if (providerRef.current === "leaflet" && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, [center, onBoundsChanged]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (providerRef.current === "google") {
      const maps = window.google?.maps;
      if (!maps) return;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      const bounds = new maps.LatLngBounds();
      pins.forEach((place) => {
        const cfg = HEALTH_SUBCATEGORY_MAP[place.subcategory];
        const marker = new maps.Marker({
          map,
          position: { lat: Number(place.latitude), lng: Number(place.longitude) },
          title: place.name,
          icon: googlePin(cfg?.color || "#2D5016"),
          opacity: selectedId && selectedId !== place.id ? 0.7 : 1,
        });
        marker.addListener("click", () => onSelect?.(place));
        markersRef.current.push(marker);
        bounds.extend(marker.getPosition());
      });
      if (pins.length > 1) map.fitBounds(bounds, 48);
      if (pins.length === 1) map.setCenter(bounds.getCenter());
      if (!pins.length && center) map.setCenter(center);
      return;
    }

    if (providerRef.current === "leaflet") {
      loadLeaflet().then((L) => {
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];
        const bounds = [];
        pins.forEach((place) => {
          const marker = L.marker([Number(place.latitude), Number(place.longitude)], {
            icon: leafletIcon(L, place),
          })
            .addTo(map)
            .bindPopup(`<strong>${place.name || ""}</strong>`);
          marker.on("click", () => onSelect?.(place));
          markersRef.current.push(marker);
          bounds.push([Number(place.latitude), Number(place.longitude)]);
        });
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
        if (bounds.length === 1) map.setView(bounds[0], 15);
        if (!bounds.length && center) map.setView([center.lat, center.lng], DEFAULT_ZOOM);
      });
    }
  }, [pins, selectedId, onSelect, center, mapReady]);

  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden bg-gray-50">
      <div ref={mapEl} className="h-full w-full" />
      {pins.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center">
          <p className="bg-white/90 px-3 py-2 text-sm text-gray-500">
            Aucun établissement géolocalisé pour ce filtre.
          </p>
        </div>
      )}
    </div>
  );
}
