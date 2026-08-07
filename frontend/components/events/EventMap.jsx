"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CalendarDays } from "lucide-react";
import { EVENT_CATEGORY_MAP, DEFAULT_EVENT_ICON } from "@/constants/eventCategories";

const DEFAULT_CENTER = { lat: 33.5731, lng: -7.5898 };

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

function groupEvents(events) {
  const groups = new Map();
  for (const event of events) {
    if (event.latitude == null || event.longitude == null) continue;
    const key = `${Number(event.latitude).toFixed(2)}:${Number(event.longitude).toFixed(2)}`;
    const existing = groups.get(key) || [];
    existing.push(event);
    groups.set(key, existing);
  }
  return [...groups.values()].map((items) => ({
    items,
    lat: items.reduce((sum, item) => sum + Number(item.latitude), 0) / items.length,
    lng: items.reduce((sum, item) => sum + Number(item.longitude), 0) / items.length,
  }));
}

function markerIcon(L, group) {
  const event = group.items[0];
  const cfg = EVENT_CATEGORY_MAP[event.categorySlug];
  const Icon = cfg?.icon || DEFAULT_EVENT_ICON;
  const multi = group.items.length > 1;
  const html = renderToStaticMarkup(
    <div
      style={{
        width: multi ? 36 : 30,
        height: multi ? 36 : 30,
        borderRadius: 8,
        background: multi ? "#2D5016" : "#A7D129",
        color: multi ? "white" : "#17250D",
        border: "2px solid white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        boxShadow: "0 2px 8px rgba(0,0,0,.25)",
      }}
    >
      {multi ? group.items.length : <Icon size={15} />}
    </div>,
  );

  return L.divIcon({
    html,
    className: "event-map-pin",
    iconSize: [multi ? 36 : 30, multi ? 36 : 30],
    iconAnchor: [multi ? 18 : 15, multi ? 18 : 15],
    popupAnchor: [0, -15],
  });
}

export default function EventMap({ events, selectedId, center, onSelect, onBoundsChanged }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const groups = useMemo(() => groupEvents(events || []), [events]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      const initial = center || DEFAULT_CENTER;
      const map = L.map(mapEl.current, {
        center: [initial.lat, initial.lng],
        zoom: center ? 12 : 6,
        scrollWheelZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "(c) OpenStreetMap contributors",
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
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
  }, [center, onBoundsChanged]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    loadLeaflet().then((L) => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      const bounds = [];
      groups.forEach((group) => {
        const label = group.items.length > 1
          ? `${group.items.length} evenements`
          : group.items[0].title;
        const marker = L.marker([group.lat, group.lng], { icon: markerIcon(L, group) })
          .addTo(mapRef.current)
          .bindPopup(`<strong>${label}</strong>`);
        marker.on("click", () => onSelect?.(group.items[0]));
        markersRef.current.push(marker);
        bounds.push([group.lat, group.lng]);
      });
      if (bounds.length > 1) mapRef.current.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
      if (bounds.length === 1) mapRef.current.setView(bounds[0], 14);
      if (!bounds.length && center) mapRef.current.setView([center.lat, center.lng], 12);
    });
  }, [groups, center, selectedId, onSelect, mapReady]);

  return (
    <div className="relative h-full min-h-[320px] w-full overflow-hidden bg-gray-50">
      <div ref={mapEl} className="h-full w-full" />
      {groups.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center">
          <p className="inline-flex items-center gap-2 bg-white/90 px-3 py-2 text-sm text-gray-500">
            <CalendarDays size={16} /> Aucun evenement geolocalise.
          </p>
        </div>
      )}
    </div>
  );
}
