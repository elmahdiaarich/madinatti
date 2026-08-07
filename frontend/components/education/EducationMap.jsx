"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { renderToStaticMarkup } from "react-dom/server";
import { GraduationCap, LocateFixed } from "lucide-react";
import { EDUCATION_TYPE_MAP } from "@/constants/educationConstants";
import { educationImageFor } from "@/utils/educationImages";

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

function buildDivIcon(L, institution) {
  const cfg = EDUCATION_TYPE_MAP[institution.institutionType];
  const Icon = cfg?.icon || GraduationCap;
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
    </div>,
  );

  return L.divIcon({
    html,
    className: "education-map-pin",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function popupHtml(institution) {
  const type = EDUCATION_TYPE_MAP[institution.institutionType]?.label || institution.institutionType || "Education";
  const image = educationImageFor(institution);
  const location = [institution.address, institution.city].filter(Boolean).join(" - ");

  return `
    <div style="width:190px;overflow:hidden;">
      <img src="${escapeHtml(image)}" alt="" style="width:190px;height:88px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />
      <div style="font-size:12px;font-weight:700;line-height:1.3;color:#111827;">${escapeHtml(institution.name)}</div>
      <div style="margin-top:3px;font-size:11px;font-weight:600;color:#2D5016;">${escapeHtml(type)}</div>
      ${location ? `<div style="margin-top:4px;font-size:11px;line-height:1.35;color:#6B7280;">${escapeHtml(location)}</div>` : ""}
    </div>
  `;
}

function formatAccuracy(value) {
  if (!Number.isFinite(value)) return "";
  if (value >= 1000) return `+/-${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} km`;
  return `+/-${Math.round(value)} m`;
}

export default function EducationMap({ institutions, selectedId, onSelect, clusterThreshold = 20 }) {
  const router = useRouter();
  const mapElRef = useRef(null);
  const leafletMapRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const markersRef = useRef([]);
  const userLocationRef = useRef(null);
  const lastFitKeyRef = useRef("");
  const [manualClustering, setManualClustering] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const pins = useMemo(
    () => (institutions || []).filter((item) => item.latitude != null && item.longitude != null),
    [institutions],
  );
  const pinsKey = useMemo(
    () => pins.map((item) => `${item.id}:${item.latitude}:${item.longitude}`).join("|"),
    [pins],
  );

  const useClustering =
    manualClustering !== null
      ? manualClustering
      : clusterThreshold !== false && pins.length >= (clusterThreshold === true ? 1 : clusterThreshold);

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
        doubleClickZoom: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      leafletMapRef.current = map;
      clusterGroupRef.current = L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 60,
      });
      map.addLayer(clusterGroupRef.current);
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
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet().then((L) => {
      const map = leafletMapRef.current;
      const clusterGroup = clusterGroupRef.current;
      if (cancelled || !map || !clusterGroup) return;

      clusterGroup.clearLayers();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const built = pins.map((institution) => {
        const marker = L.marker([Number(institution.latitude), Number(institution.longitude)], {
          icon: buildDivIcon(L, institution),
          opacity: selectedId && selectedId !== institution.id ? 0.7 : 1,
          keyboardNavigation: true,
        });

        marker.bindPopup(popupHtml(institution), {
          closeButton: false,
          autoPan: false,
          offset: [0, -6],
        });
        marker.on("mouseover", () => {
          onSelect?.(institution);
          marker.openPopup();
        });
        marker.on("mouseout", () => marker.closePopup());
        marker.on("click", () => {
          router.push(`/education/etablissement/${encodeURIComponent(institution.slug)}`);
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
        if (lastFitKeyRef.current !== pinsKey) {
          const bounds = L.latLngBounds(pins.map((item) => [Number(item.latitude), Number(item.longitude)]));
          map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
          lastFitKeyRef.current = pinsKey;
        }
      } else {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        lastFitKeyRef.current = pinsKey;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pins, pinsKey, selectedId, onSelect, useClustering, router]);

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
      setLocationError("Localisation non supportee par ce navigateur.");
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

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--color-primary-dark)]/70">
          {pins.length} etablissement{pins.length > 1 ? "s" : ""} geolocalise{pins.length > 1 ? "s" : ""}
        </span>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm">
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-2 py-1 text-xs font-semibold text-[var(--color-primary-dark)] transition hover:bg-[#E8F5D0] disabled:opacity-50"
          >
            <LocateFixed size={13} /> {locating ? "..." : "Ma position"}
          </button>
          <span className="text-xs text-[var(--color-primary-dark)]/70">Grouper</span>
          <button
            type="button"
            role="switch"
            aria-checked={useClustering}
            aria-label="Grouper les etablissements proches"
            onClick={() => setManualClustering((prev) => !(prev ?? useClustering))}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              useClustering ? "bg-[var(--color-primary-dark)]" : "bg-black/15"
            }`}
          >
            <span
              className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
              style={{ transform: useClustering ? "translateX(16px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </div>

      <div className="relative h-full w-full flex-1">
        <div ref={mapElRef} className="absolute inset-0 h-full w-full" style={{ zIndex: 0 }} />
        {locationError && (
          <p className="absolute left-3 top-3 z-10 max-w-[220px] rounded bg-white/95 px-3 py-2 text-xs text-red-600 shadow">
            {locationError}
          </p>
        )}
        {userLocation?.accuracy && (
          <p className="absolute left-3 bottom-3 z-10 max-w-[240px] rounded bg-white/95 px-3 py-2 text-xs text-[#1D4ED8] shadow">
            Position navigateur: precision {formatAccuracy(userLocation.accuracy)}. Sur ordinateur, elle peut etre approximative.
          </p>
        )}
        {pins.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center" style={{ zIndex: 10 }}>
            <p className="rounded bg-white/90 px-3 py-2 text-sm text-[var(--color-primary-dark)]/70">
              Aucun etablissement geolocalise pour ce filtre.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
