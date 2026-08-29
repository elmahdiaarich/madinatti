"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import BaseMap, { loadLeaflet } from "./BaseMap";

function createPinIcon(L, isActive) {
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
    className: "shared-map-pin",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

/**
 * Generic multi-pin map: hover/select sync with an external card grid,
 * click-through popup card, auto-fit bounds. Works for any module —
 * pass `items` plus accessor props matching your data shape.
 *
 * Accessors default to real-estate's shape but can be overridden so
 * cars/jobs/tourism/health can reuse this unchanged.
 */
export default function MultiPinMap({
  items = [],
  hoveredItemId,
  focusItemId,
  selectedItemId,
  onSelectItem,
  onHoverItem,
  getId = (item) => item.id,
  getLat = (item) => Number(item.latitude ?? item.lat),
  getLng = (item) => Number(item.longitude ?? item.lng ?? item.lon),
  getImage = (item) => item.images?.[0]?.url,
  getTitle = (item) => item.title,
  getPrice = (item) => item.price,
  getHref = (item) => "#",
  emptyLabel = "Aucun élément géolocalisé sur la carte.",
}) {
  console.log("MultiPinMap rendered with items:", items);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef(new Map());
  const [mapReady, setMapReady] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const validItems = useMemo(() => {
    return items.filter((item) => {
      const lat = getLat(item);
      const lng = getLng(item);
      return Number.isFinite(lat) && Number.isFinite(lng);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleReady = (map, L) => {
    mapRef.current = map;
    leafletRef.current = L;
    setMapReady(true);
  };

  const handleMapClick = () => {
    setActiveItem(null);
    onSelectItem?.(null);
  };

  // Build markers only when the item set changes — hover/select must NOT
  // be in this dependency array, or every hover would rebuild + refit.
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;

    loadLeaflet().then((L) => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();

      const bounds = [];

      validItems.forEach((item) => {
        const lat = getLat(item);
        const lng = getLng(item);
        const id = getId(item);

        const icon = createPinIcon(L, false);
        const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current);

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectItem?.(id);
          setActiveItem(item);
        });
        marker.on("mouseover", () => onHoverItem?.(id));
        marker.on("mouseout", () => onHoverItem?.(null));

        markersRef.current.set(id, marker);
        bounds.push([lat, lng]);
      });

      requestAnimationFrame(() => {
        if (bounds.length > 1) {
          mapRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
        } else if (bounds.length === 1) {
          mapRef.current.setView(bounds[0], 13);
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validItems, mapReady]);

  // Restyle only the affected markers on hover/select change — no rebuild.
  useEffect(() => {
    if (!mapReady) return;
    loadLeaflet().then((L) => {
      markersRef.current.forEach((marker, id) => {
        const isActive = id === hoveredItemId || id === selectedItemId;
        marker.setIcon(createPinIcon(L, isActive));
      });
    });
  }, [hoveredItemId, selectedItemId, mapReady]);

  // Pan (not refit) toward a focused item from the card grid.
  useEffect(() => {
    if (!mapRef.current || !mapReady || !focusItemId) return;
    const marker = markersRef.current.get(focusItemId);
    if (!marker) return;

    const target = marker.getLatLng();
    if (!target || !Number.isFinite(target.lat) || !Number.isFinite(target.lng)) return;

    mapRef.current.panTo(target, { animate: true, duration: 0.6 });
  }, [focusItemId, mapReady]);

  return (
    <div className="absolute inset-0">
      <BaseMap onReady={handleReady} onMapClick={handleMapClick} />

      {mapReady && validItems.length === 0 && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center p-4 z-10 text-center">
          <div className="bg-white px-4 py-2.5 rounded-full shadow-md border border-gray-100 flex items-center gap-2 text-xs font-semibold text-gray-600">
            <span>🗺️</span> {emptyLabel}
          </div>
        </div>
      )}

      {activeItem && (
        <div className="absolute bottom-3 left-3 right-3 z-[500]">
          <div className="relative">

            <a href={getHref(activeItem)}
              className="flex items-stretch gap-3 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-shadow"
            >
              {getImage(activeItem) && (
                <img src={getImage(activeItem)} alt="" className="w-24 h-24 object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0 py-2 pr-8 flex flex-col justify-center">
                <p className="text-sm font-bold text-gray-900 line-clamp-1">
                  {getTitle(activeItem)}
                </p>
                {getPrice(activeItem) != null && (
                  <p className="text-base font-extrabold text-[#2D5016] mt-0.5">
                    {Number(getPrice(activeItem)).toLocaleString("fr-MA")} MAD
                  </p>
                )}
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
                setActiveItem(null);
                onSelectItem?.(null);
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