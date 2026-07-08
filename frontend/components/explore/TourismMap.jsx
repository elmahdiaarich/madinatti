// frontend/components/explore/TourismMap.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { renderToStaticMarkup } from "react-dom/server";
import { MapPin } from "lucide-react";
import { TOURISM_CATEGORIES } from "@/constants/tourismCategories";

// Default view when there are no geolocated listings yet (Kenitra).
const DEFAULT_CENTER = [34.261, -6.58];
const DEFAULT_ZOOM = 12;

function loadLeaflet() {
  return new Promise((resolve) => {
    const ready = () => window.L && window.L.markerClusterGroup;

    if (ready()) return resolve(window.L);

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("leaflet-cluster-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-cluster-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("leaflet-cluster-default-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-cluster-default-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css";
      document.head.appendChild(link);
    }

    const loadClusterScript = () => {
      if (window.L.markerClusterGroup) return resolve(window.L);
      const existingCluster = document.getElementById("leaflet-cluster-js");
      if (existingCluster) {
        existingCluster.addEventListener("load", () => resolve(window.L));
        return;
      }
      const clusterScript = document.createElement("script");
      clusterScript.id = "leaflet-cluster-js";
      clusterScript.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
      clusterScript.onload = () => resolve(window.L);
      document.head.appendChild(clusterScript);
    };

    if (window.L) {
      loadClusterScript();
      return;
    }

    const existing = document.getElementById("leaflet-js");
    if (existing) {
      existing.addEventListener("load", loadClusterScript);
      return;
    }

    const script = document.createElement("script");
    script.id = "leaflet-js";
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = loadClusterScript;
    document.head.appendChild(script);
  });
}

// Renders a lucide icon inside a pin-shaped divIcon so markers match the
// category glyphs used elsewhere in the app.
function buildDivIcon(L, Icon) {
  const html = renderToStaticMarkup(
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "9999px",
        border: "2px solid white",
        background: "var(--color-primary-dark)",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
      }}
    >
      <Icon size={14} />
    </div>
  );

  return L.divIcon({
    html,
    className: "tourism-map-pin",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export default function TourismMap({
  listings,
  basePath = "/tourisme",
  // Cluster automatically once there are enough pins that individual
  // markers would start overlapping/hurting performance. Pass `false` to
  // always disable, or `true`/a low number to always force clustering.
  clusterThreshold = 50,
}) {
  const router = useRouter();
  const mapElRef = useRef(null);
  const leafletMapRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const markersRef = useRef([]);
  const routerRef = useRef(router);
  const basePathRef = useRef(basePath);
  routerRef.current = router;
  basePathRef.current = basePath;

  const pins = useMemo(
    () => (listings || []).filter((l) => l.latitude != null && l.longitude != null),
    [listings]
  );

  // Manual override for the toggle button. `null` means "no manual choice
  // yet, fall back to the automatic clusterThreshold heuristic".
  const [manualClustering, setManualClustering] = useState(null);

  const useClustering =
    manualClustering !== null
      ? manualClustering
      : clusterThreshold !== false &&
        pins.length >= (clusterThreshold === true ? 1 : clusterThreshold);

  // Initialize the map once.
  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      if (cancelled || !mapElRef.current || leafletMapRef.current) return;

      const map = L.map(mapElRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: true,
        zoomControl: true,
        dragging: true,
        // Read-only: no editing interactions, just navigation of the view.
        doubleClickZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      clusterGroupRef.current = L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 60,
      });
      map.addLayer(clusterGroupRef.current);

      // Trigger the marker-sync effect once the map exists.
      window.dispatchEvent(new Event("resize"));
    });

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        clusterGroupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers whenever listings change.
  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      const map = leafletMapRef.current;
      const clusterGroup = clusterGroupRef.current;
      if (cancelled || !map || !clusterGroup) return;

      // Clear previous markers from both the cluster group and the map.
      clusterGroup.clearLayers();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const built = pins.map((l) => {
        const cfg = TOURISM_CATEGORIES[l.category];
        const Icon = cfg?.icon || MapPin;
        const icon = buildDivIcon(L, Icon);

        const marker = L.marker([l.latitude, l.longitude], {
          icon,
          keyboardNavigation: true,
        });

        marker.bindPopup(
          `<div style="font-size:12px;font-weight:600;">${l.name ?? ""}</div>`
        );

        marker.on("click", () => {
          routerRef.current.push(`${basePathRef.current}/${l.id}`);
        });

        return marker;
      });

      if (useClustering) {
        clusterGroup.addLayers(built);
      } else {
        built.forEach((marker) => {
          marker.addTo(map);
          markersRef.current.push(marker);
        });
      }

      if (pins.length > 0) {
        const bounds = L.latLngBounds(pins.map((l) => [l.latitude, l.longitude]));
        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
      } else {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pins, useClustering]);

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-primary-dark)]/70">
          {pins.length} lieu{pins.length > 1 ? "x" : ""} sur la carte
        </span>

        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm">
          <span className="text-xs text-[var(--color-primary-dark)]/70">Grouper</span>
          <button
            type="button"
            role="switch"
            aria-checked={useClustering}
            aria-label="Grouper les lieux proches"
            onClick={() => setManualClustering((prev) => !(prev ?? useClustering))}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              useClustering ? "bg-[var(--color-primary-dark)]" : "bg-black/15"
            }`}
          >
            <span
              className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
              style={{ transform: useClustering ? "translateX(16px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </div>

      <div className="relative h-full w-full flex-1">
        <div ref={mapElRef} className="absolute inset-0 h-full w-full" style={{ zIndex: 0 }} />

        {pins.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center px-4" style={{ zIndex: 10 }}>
            <p className="rounded bg-white/90 px-3 py-2 text-sm text-[var(--color-primary-dark)]/70">
              Aucun lieu géolocalisé pour ce filtre.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}