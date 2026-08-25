"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CENTER = { lat: 31.7917, lng: -7.0926 }; // Center of Morocco

function loadLeaflet() {
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

function createCustomPinIcon(L, isSelected, isHovered) {
  const isActive = isSelected || isHovered;
  const scale = isActive ? "scale-125" : "scale-100";

  const html = `
    <div class="w-4 h-4 rounded-full bg-[#2D5016] border-2 border-white shadow-md transition-transform duration-150 ${scale}"></div>
  `;

  return L.divIcon({
    html,
    className: "immo-map-pin",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

export default function RealEstateMap({
  listings = [],
  hoveredListingId,
  selectedListingId,
  onSelectListing,
}) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const [mapReady, setMapReady] = useState(false);

  const validListings = useMemo(() => {
    console.log("Filtering valid listings from:", listings);
    return listings.filter(
      (l) => (l.latitude || l.lat) && (l.longitude || l.lng || l.lon)
    );
  }, [listings]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;

      const map = L.map(mapEl.current, {
        center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: 6,
        scrollWheelZoom: true,
        zoomControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

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
  }, []);
  const [activeListing, setActiveListing] = useState(null);

  // Leaflet doesn't auto-detect container resizes (sidebar toggle,
  // mobile drawer open, window resize) — force it to remeasure so it
  // doesn't leave stale blank space on the edges.
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

    loadLeaflet().then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      const bounds = [];

      validListings.forEach((item) => {
        const lat = Number(item.latitude || item.lat);
        const lng = Number(item.longitude || item.lng || item.lon);
        const isHovered = hoveredListingId === item.id;
        const isSelected = selectedListingId === item.id;

        const icon = createCustomPinIcon(L, isSelected, isHovered);
        const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current);

        const isTouchDevice = window.matchMedia("(hover: none)").matches;
        if (isTouchDevice) {
          marker.on("click", () => {
            onSelectListing?.(item.id);
            setActiveListing(item);
          });
        } else {
          marker.on("mouseover", () => setActiveListing(item));
          marker.on("mouseout", () => setActiveListing(null));
          marker.on("click", () => onSelectListing?.(item.id));
        }

        markersRef.current.set(item.id, marker);
        bounds.push([lat, lng]);
      });

      if (bounds.length > 1) {
        mapRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
      } else if (bounds.length === 1) {
        mapRef.current.setView(bounds[0], 13);
      }
    });
  }, [validListings, hoveredListingId, selectedListingId, onSelectListing, mapReady]);

  return (
    <div className="absolute inset-0 bg-gray-100 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      <div ref={mapEl} className="absolute inset-0 z-0" />

      {validListings.length === 0 && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center p-4 z-10 text-center">
          <div className="bg-white px-4 py-2.5 rounded-full shadow-md border border-gray-100 flex items-center gap-2 text-xs font-semibold text-gray-600">
            <span>🗺️</span> Aucune annonce géolocalisée sur la carte.
          </div>
        </div>
      )}

      {activeListing && (
        <div className="absolute bottom-3 left-3 right-3 z-[500]">

          <a href={`/real-estate/${activeListing.id}`}
            className="flex items-stretch gap-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow"
          >
            {activeListing.images?.[0]?.url && (
              <img
                src={activeListing.images[0].url}
                alt=""
                className="w-24 h-24 object-cover shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 py-2 pr-3 flex flex-col justify-center">
              <p className="text-sm font-bold text-gray-900 line-clamp-1">
                {activeListing.title}
              </p>
              <p className="text-base font-extrabold text-[#2D5016] mt-0.5">
                {Number(activeListing.price).toLocaleString("fr-MA")} MAD
              </p>
              <span className="text-xs font-semibold text-[#2D5016] underline mt-1">
                Voir plus →
              </span>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}