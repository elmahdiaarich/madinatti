"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

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

// Single shared highlight color for both hover and select — simpler, one style to reason about.
function createCustomPinIcon(L, isActive) {
  const dotSize = isActive ? "22px" : "14px";
  const glow = isActive ? "0 0 0 6px rgba(167,209,41,0.35)" : "none";
  const color = isActive ? "#A7D129" : "#2D5016";

  const html = `
    <div style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
      <div style="
        width:${dotSize};
        height:${dotSize};
        border-radius:9999px;
        background:${color};
        border:2px solid white;
        box-shadow:${glow}, 0 1px 3px rgba(0,0,0,0.3);
        transition: width 0.15s ease, height 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "immo-map-pin",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export default function RealEstateMap({
  listings = [],
  hoveredListingId,
  focusListingId,
  selectedListingId,
  onSelectListing,
  onHoverListing,
}) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [activeListing, setActiveListing] = useState(null);

  const validListings = useMemo(() => {
    return listings.filter((l) => {
      const lat = Number(l.latitude ?? l.lat);
      const lng = Number(l.longitude ?? l.lng ?? l.lon);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });
  }, [listings]);

  // ── Create the map instance once ──────────────────────────────────────────
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

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map);

      map.on("click", () => {
        setActiveListing(null);
        onSelectListing?.(null);
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
  }, []);

  // ── Keep Leaflet aware of container resizes ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady || !mapEl.current) return;
    const ro = new ResizeObserver(() => {
      mapRef.current?.invalidateSize();
    });
    ro.observe(mapEl.current);
    return () => ro.disconnect();
  }, [mapReady]);

  // ── Build markers ONLY when the actual listing set changes ───────────────
  // Hover/select must NOT be in this dependency array — that was causing a
  // full marker rebuild (and re-fit/zoom) on every single hover.
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    loadLeaflet().then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      const bounds = [];

      validListings.forEach((item) => {
        const lat = Number(item.latitude ?? item.lat);
        const lng = Number(item.longitude ?? item.lng ?? item.lon);

        const icon = createCustomPinIcon(L, false);
        const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current);

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e); // don't let it bubble to map's own click-to-close
          onSelectListing?.(item.id);
          setActiveListing(item);
        });
        marker.on("mouseover", () => onHoverListing?.(item.id));
        marker.on("mouseout", () => onHoverListing?.(null));

        markersRef.current.set(item.id, marker);
        bounds.push([lat, lng]);
      });

      if (bounds.length > 1) {
        mapRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
      } else if (bounds.length === 1) {
        mapRef.current.setView(bounds[0], 13);
      }
    });
  }, [validListings, mapReady, onSelectListing, onHoverListing]);

  // ── Update ONLY the affected markers' icons when hover/select changes ────
  // No rebuild, no fitBounds — just restyle the relevant pins in place.
  useEffect(() => {
    if (!mapReady) return;
    loadLeaflet().then((L) => {
      markersRef.current.forEach((marker, id) => {
        const isActive = id === hoveredListingId || id === selectedListingId;
        marker.setIcon(createCustomPinIcon(L, isActive));
      });
    });
  }, [hoveredListingId, selectedListingId, mapReady]);

  // ── Pan/zoom to a listing ONLY when focused from the card grid ───────────
  useEffect(() => {
    if (!mapRef.current || !mapReady || !focusListingId) return;
    const marker = markersRef.current.get(focusListingId);
    if (!marker) return;

    const targetLatLng = marker.getLatLng();
    if (
      !targetLatLng ||
      !Number.isFinite(targetLatLng.lat) ||
      !Number.isFinite(targetLatLng.lng)
    ) {
      return;
    }

    // Gentle pan toward the general area — don't force a big zoom jump.
    // Only zoom in a little if we're currently very zoomed out (wide view),
    // and never zoom OUT, so we're not fighting the user's own zoom level.
    mapRef.current.panTo(targetLatLng, { animate: true, duration: 0.6 });
  }, [focusListingId, mapReady]);
  
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
          <div className="relative">
            
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
              <div className="flex-1 min-w-0 py-2 pr-8 flex flex-col justify-center">
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
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveListing(null);
                onSelectListing?.(null);
              }}
              aria-label="Fermer"
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}