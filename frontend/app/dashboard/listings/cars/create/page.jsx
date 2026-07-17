"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { carsService } from "@/services/carsService";
import PricingModal from "@/components/shared/PricingModal";
import VehicleMakeModelFields from "@/components/cars/VehicleMakeModelFields";
import axios from "axios";
import moroccoCities from "morocco-cities";
import { useToast } from "@/context/ToastContext";

const API = process.env.NEXT_PUBLIC_API_URL;

const LISTING_TYPES = [
  { label: "Vente", value: "SALE" },
  { label: "Location", value: "RENT" },
];

const CONDITIONS = [
  { label: "Occasion", value: "USED" },
  { label: "Neuf", value: "NEW" },
  { label: "Accidenté", value: "DAMAGED" },
];

const FUEL_TYPES = [
  { label: "Diesel", value: "DIESEL" },
  { label: "Essence", value: "PETROL" },
  { label: "Hybride", value: "HYBRID" },
  { label: "Électrique", value: "ELECTRIC" },
  { label: "GPL", value: "LPG" },
  { label: "Autre", value: "OTHER" },
];

const TRANSMISSIONS = [
  { label: "Manuelle", value: "MANUAL" },
  { label: "Automatique", value: "AUTOMATIC" },
  { label: "Semi-automatique", value: "SEMI_AUTOMATIC" },
];

const BODY_TYPES = [
  { label: "Berline", value: "SEDAN" },
  { label: "SUV", value: "SUV" },
  { label: "Citadine", value: "HATCHBACK" },
  { label: "Coupé", value: "COUPE" },
  { label: "Cabriolet", value: "CONVERTIBLE" },
  { label: "Break", value: "WAGON" },
  { label: "Utilitaire / Van", value: "VAN" },
  { label: "Pickup", value: "PICKUP" },
  { label: "Monospace", value: "MINIVAN" },
  { label: "Autre", value: "OTHER" },
];

const ALL_CITIES = moroccoCities.cities;

const REGIONS = [...new Set(ALL_CITIES.map((c) => c.region_name))]
  .filter(Boolean)
  .sort();

function citiesByRegion(region) {
  return ALL_CITIES
    .filter((c) => c.region_name === region)
    .map((c) => c.name)
    .sort();
}

const EMPTY = {
  title: "",
  description: "",
  categoryId: "",
  listingType: "SALE",
  condition: "USED",
  make: "",
  model: "",
  year: "",
  mileage: "",
  fuelType: "DIESEL",
  transmission: "MANUAL",
  bodyType: "SEDAN",
  color: "",
  doors: "",
  seats: "",
  engineSize: "",
  horsePower: "",
  price: "",
  isNegotiable: false,
  region: "",
  city: "",
  location: "",
  latitude: "",
  longitude: "",
  contactPhone: "",
  images: [],
  features: {},
};

function Field({ label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
        error
          ? "border-red-300 focus:ring-red-200 bg-red-50"
          : "border-gray-200 focus:ring-[#2D5016] focus:border-transparent"
      }`}
    />
  );
}

function Select({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition bg-white ${
        error
          ? "border-red-300 focus:ring-red-200"
          : "border-gray-200 focus:ring-[#2D5016] focus:border-transparent"
      }`}
    >
      {children}
    </select>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="w-1 h-5 rounded-full bg-[#2D5016] inline-block" />
      <h2 className="font-bold text-gray-900 text-base">{children}</h2>
    </div>
  );
}

function MapPicker({ latitude, longitude, onChange, flyTo }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (leafletMap.current) return;

    const initMap = () => {
      if (!mapRef.current || !window.L) return;
      if (mapRef.current._leaflet_id) return;

      const L = window.L;
      const defaultLat = latitude ? parseFloat(latitude) : 31.7917;
      const defaultLng = longitude ? parseFloat(longitude) : -7.0926;

      const map = L.map(mapRef.current).setView(
        [defaultLat, defaultLng],
        latitude ? 13 : 6,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      if (latitude && longitude) {
        markerRef.current = L.marker(
          [parseFloat(latitude), parseFloat(longitude)],
          { icon },
        ).addTo(map);
      }

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        }
        onChange(lat.toFixed(6), lng.toFixed(6));
      });

      leafletMap.current = map;
      setReady(true);
    };

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    if (window.L) {
      initMap();
    } else if (!document.getElementById("leaflet-js")) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) { clearInterval(interval); initMap(); }
      }, 50);
      return () => clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (!flyTo || !leafletMap.current || !window.L) return;
    const { lat, lng, zoom = 12 } = flyTo;

    const L = window.L;
    const icon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });

    leafletMap.current.flyTo([lat, lng], zoom, { duration: 1.2 });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon }).addTo(leafletMap.current);
    }
  }, [flyTo]);

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={mapRef}
        className="w-full h-64 rounded-xl border border-gray-200 overflow-hidden"
        style={{ position: "relative", zIndex: 0 }}
      />
      {!ready && (
        <p className="text-xs text-gray-400">Chargement de la carte...</p>
      )}
      {latitude && longitude ? (
        <p className="text-xs text-green-600 font-semibold">
          📍 Position sélectionnée : {parseFloat(latitude).toFixed(5)},{" "}
          {parseFloat(longitude).toFixed(5)}
        </p>
      ) : (
        <p className="text-xs text-gray-400">
          Cliquez sur la carte pour épingler la position exacte (optionnel).
        </p>
      )}
    </div>
  );
}

function ImageUploader({ images, onChange, token, error }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const oversized = files.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length) {
      setUploadError(`${oversized.length} fichier(s) dépassent 5 Mo.`);
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));

    try {
      const res = await axios.post(`${API}/api/upload/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const newImages = res.data.files.map((f, i) => ({
        url: f.url,
        isCover: images.length === 0 && i === 0,
      }));

      onChange([...images, ...newImages]);
    } catch (err) {
      setUploadError("Échec de l'upload. Vérifiez votre connexion.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (i) => {
    const next = images.filter((_, idx) => idx !== i);
    if (next.length > 0 && !next.some((img) => img.isCover)) next[0].isCover = true;
    onChange(next);
  };

  const setCover = (i) => {
    onChange(images.map((img, idx) => ({ ...img, isCover: idx === i })));
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
          uploading
            ? "border-primary bg-primary/5 cursor-wait"
            : error
              ? "border-red-300 bg-red-50 hover:border-red-400"
              : "border-gray-200 hover:border-[#2D5016] hover:bg-[#2D5016]/5"
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#2D5016] font-semibold">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <span className="text-3xl">📷</span>
            <p className="text-sm font-semibold">Cliquez pour choisir des photos</p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 Mo par photo — jusqu'à 10 photos</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{error}</p>}
      {uploadError && <p className="text-xs text-red-500 flex items-center gap-1"><span>⚠</span>{uploadError}</p>}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className={`relative group rounded-xl overflow-hidden border-2 w-24 h-24 ${
                img.isCover ? "border-[#2D5016]" : "border-gray-200"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                {!img.isCover && (
                  <button type="button" onClick={() => setCover(i)}
                    className="text-[10px] bg-white text-gray-800 px-2 py-0.5 rounded-full font-bold">
                    Couverture
                  </button>
                )}
                <button type="button" onClick={() => remove(i)}
                  className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                  Supprimer
                </button>
              </div>
              {img.isCover && (
                <span className="absolute top-1 left-1 text-[9px] bg-[#2D5016] text-white px-1.5 py-0.5 rounded-full font-bold">
                  Couv.
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturesManager({ features, onChange }) {
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");

  const add = () => {
    if (!key.trim()) return;
    onChange({ ...features, [key.trim()]: val.trim() || true });
    setKey(""); setVal("");
  };

  const remove = (k) => {
    const next = { ...features };
    delete next[k];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input value={key} onChange={(e) => setKey(e.target.value)}
          placeholder="Option (ex: Climatisation)"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016]" />
        <input value={val} onChange={(e) => setVal(e.target.value)}
          placeholder="Valeur (optionnel)"
          className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5016]" />
        <button type="button" onClick={add}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
          +
        </button>
      </div>
      {Object.keys(features).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(features).map(([k, v]) => (
            <span key={k}
              className="flex items-center gap-1 px-3 py-1 bg-[#E8F5D0] border border-[#A7D129] rounded-full text-xs font-semibold text-[#2D5016]">
              {k}{v !== true ? `: ${v}` : ""}
              <button type="button" onClick={() => remove(k)}
                className="ml-1 text-red-500 hover:text-red-700 font-bold font-mono">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateCarPage() {
  return (
    <ProtectedRoute roles={["business"]}>
      <CreateCarForm />
    </ProtectedRoute>
  );
}

function CreateCarForm() {
  const { token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [flyTo, setFlyTo] = useState(null);
  // ── CHANGED: no longer shown on mount; shown only after validation passes ──
  const [showPricingModal, setShowPricingModal] = useState(false);

  const sectionRefs = {
    title: useRef(null),
    description: useRef(null),
    categoryId: useRef(null),
    make: useRef(null),
    model: useRef(null),
    year: useRef(null),
    price: useRef(null),
    region: useRef(null),
    city: useRef(null),
    location: useRef(null),
    images: useRef(null),
  };

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const ERROR_ORDER = [
    "title",
    "description",
    "categoryId",
    "make",
    "model",
    "year",
    "price",
    "region",
    "city",
    "location",
    "images",
  ];

  const availableCities = form.region ? citiesByRegion(form.region) : [];

  // Load car categories
  useEffect(() => {
    carsService.getCategories().then((r) => {
      setCategories(r.data || []);
    });
  }, []);

  const geocodeAddress = useCallback(async (city, address) => {
    if (!city) return;
    setGeocoding(true);
    try {
      const q = encodeURIComponent(
        `${address ? address + ", " : ""}${city}, Maroc`
      );
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { "Accept-Language": "fr" } }
      );
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat).toFixed(6);
        const lng = parseFloat(data[0].lon).toFixed(6);
        setForm((p) => ({ ...p, latitude: lat, longitude: lng }));
        setFlyTo({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          zoom: address ? 15 : 12,
        });
      }
    } catch {
      // ignore
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleRegionChange = (region) => {
    setForm((p) => ({ ...p, region, city: "", latitude: "", longitude: "" }));
    setFlyTo(null);
    if (errors.region) setErrors((p) => ({ ...p, region: null }));
  };

  const handleCityChange = useCallback(async (cityName) => {
    set("city", cityName);
    if (!cityName) return;
    await geocodeAddress(cityName, form.location || "");
  }, [form.location, geocodeAddress]);

  useEffect(() => {
    if (!form.city || !form.location.trim()) return;
    const t = setTimeout(() => {
      geocodeAddress(form.city, form.location);
    }, 500);
    return () => clearTimeout(t);
  }, [form.location, form.city, geocodeAddress]);

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 5) e.title = "Min 5 caractères";
    if (!form.description.trim() || form.description.trim().length < 10) e.description = "Min 10 caractères";
    if (!form.categoryId) e.categoryId = "Catégorie requise";
    if (!form.make.trim()) e.make = "Marque requise";
    if (!form.model.trim()) e.model = "Modèle requis";
    if (!form.year || Number(form.year) < 1900 || Number(form.year) > new Date().getFullYear() + 1) e.year = "Année invalide";
    if (!form.price || Number(form.price) <= 0) e.price = "Prix invalide";
    if (!form.region) e.region = "Veuillez sélectionner une région";
    if (!form.city) e.city = "Veuillez sélectionner une ville";
    if (!form.location.trim()) e.location = "Requis";
    if (form.images.length === 0) e.images = "Ajoutez au moins une photo";
    return e;
  };

  // ── CHANGED: "Publier" now validates first, then opens the pricing modal ──
  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      const firstKey = ERROR_ORDER.find((k) => e[k]);
      const scrollKey = firstKey === "model" ? "make" : firstKey;
      if (scrollKey && sectionRefs[scrollKey]?.current) {
        sectionRefs[scrollKey].current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    // Validation passed → show plan picker
    setShowPricingModal(true);
  };

  // ── called when user picks a plan in the modal → save listing then redirect ──
  const handlePlanSelect = async (planId) => {
    setShowPricingModal(false);
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        plan: planId,
        price: parseFloat(form.price),
        year: parseInt(form.year),
        mileage: form.mileage ? parseInt(form.mileage) : undefined,
        doors: form.doors ? parseInt(form.doors) : undefined,
        seats: form.seats ? parseInt(form.seats) : undefined,
        engineSize: form.engineSize ? parseFloat(form.engineSize) : undefined,
        horsePower: form.horsePower ? parseInt(form.horsePower) : undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      };
      await carsService.createListing(payload, token);
      router.push("/dashboard/listings/cars?created=1");
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── CHANGED: modal only shown after clicking Publier + passing validation ── */}
      {showPricingModal && (
        <PricingModal
          module="vehicules"
          onSelect={handlePlanSelect}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <h1 className="font-extrabold text-gray-900 text-lg">Publier un véhicule</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full font-semibold whitespace-nowrap">
              En attente de validation admin
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* ── GENERAL INFO ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Informations de l'annonce</SectionTitle>

          <div ref={sectionRefs.title}>
            <Field label="Titre de l'annonce *" error={errors.title}>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ex: Peugeot 208 Signature Diesel 1.6 BlueHDi"
                error={errors.title}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Type d'annonce *">
              <Select value={form.listingType} onChange={(e) => set("listingType", e.target.value)}>
                {LISTING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <div ref={sectionRefs.categoryId} className="col-span-2">
              <Field label="Catégorie de véhicule *" error={errors.categoryId}>
                <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId}>
                  <option value="">Sélectionner</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </div>

          <div ref={sectionRefs.description}>
            <Field label="Description *" error={errors.description}>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Décrivez l'état mécanique, carrosserie, entretien, options..."
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition resize-none ${
                  errors.description
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-200 focus:ring-[#2D5016]"
                }`}
              />
            </Field>
          </div>
        </div>

        {/* ── CAR SPECS ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Fiche technique du véhicule</SectionTitle>

          <div ref={sectionRefs.make}>
            <VehicleMakeModelFields
              make={form.make}
              model={form.model}
              onMakeChange={(value) => set("make", value)}
              onModelChange={(value) => set("model", value)}
              errors={errors}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div ref={sectionRefs.year}>
              <Field label="Année *" error={errors.year}>
                <Input type="number" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="Ex: 2019" error={errors.year} />
              </Field>
            </div>
            <Field label="Kilométrage (km)">
              <Input type="number" min="0" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} placeholder="Ex: 85000" />
            </Field>
            <Field label="État du véhicule *">
              <Select value={form.condition} onChange={(e) => set("condition", e.target.value)}>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Carburant *">
              <Select value={form.fuelType} onChange={(e) => set("fuelType", e.target.value)}>
                {FUEL_TYPES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Transmission *">
              <Select value={form.transmission} onChange={(e) => set("transmission", e.target.value)}>
                {TRANSMISSIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Carrosserie *">
              <Select value={form.bodyType} onChange={(e) => set("bodyType", e.target.value)}>
                {BODY_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Field label="Couleur">
              <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Ex: Gris" />
            </Field>
            <Field label="Portes">
              <Select value={form.doors} onChange={(e) => set("doors", e.target.value)}>
                <option value="">Requis</option>
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="2">2 (Coupé)</option>
              </Select>
            </Field>
            <Field label="Places">
              <Select value={form.seats} onChange={(e) => set("seats", e.target.value)}>
                <option value="">Requis</option>
                <option value="5">5</option>
                <option value="7">7</option>
                <option value="2">2</option>
                <option value="9">9</option>
              </Select>
            </Field>
            <Field label="Puissance (ch)">
              <Input type="number" value={form.horsePower} onChange={(e) => set("horsePower", e.target.value)} placeholder="Ex: 100" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cylindrée (L)">
              <Input type="number" step="0.1" value={form.engineSize} onChange={(e) => set("engineSize", e.target.value)} placeholder="Ex: 1.6" />
            </Field>
            <div ref={sectionRefs.price}>
              <Field label="Prix (MAD) *" error={errors.price}>
                <div className="flex gap-2">
                  <Input type="number" min="1" value={form.price} onChange={(e) => set("price", e.target.value)} error={errors.price} placeholder="Ex: 110000" />
                  <label className="flex items-center gap-1 shrink-0 text-xs text-gray-500 font-semibold cursor-pointer">
                    <input type="checkbox" checked={form.isNegotiable} onChange={(e) => set("isNegotiable", e.target.checked)} className="rounded text-[#2D5016]" />
                    Négociable
                  </label>
                </div>
              </Field>
            </div>
          </div>
        </div>

        {/* ── LOCALISATION ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Localisation</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <div ref={sectionRefs.region}>
              <Field label="Région *" error={errors.region}>
                <Select value={form.region} onChange={(e) => handleRegionChange(e.target.value)} error={errors.region}>
                  <option value="">Sélectionner</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div ref={sectionRefs.city}>
              <Field label="Ville *" error={errors.city}>
                <div className="relative">
                  <Select value={form.city} onChange={(e) => handleCityChange(e.target.value)} error={errors.city} disabled={!form.region}>
                    <option value="">{form.region ? "Sélectionner une ville" : "Choisir région d'abord"}</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                  {geocoding && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div ref={sectionRefs.location}>
            <Field label="Adresse / Lieu précis *" error={errors.location}>
              <div className="relative">
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Ex: Maarif, face au Twin Center" error={errors.location} />
                {geocoding && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#2D5016] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </Field>
          </div>

          <Field label="Position sur la carte">
            <MapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              flyTo={flyTo}
              onChange={(lat, lng) => {
                const lat_n = parseFloat(lat);
                const lng_n = parseFloat(lng);
                if (lat_n < 27.6 || lat_n > 35.9 || lng_n < -13.2 || lng_n > -1.0) {
                  setErrors((p) => ({ ...p, map: "Position hors du Maroc." }));
                  return;
                }
                setErrors((p) => ({ ...p, map: null }));
                set("latitude", lat);
                set("longitude", lng);
              }}
            />
            {errors.map && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><span>⚠</span> {errors.map}</p>}
          </Field>
        </div>

        {/* ── CONTACT ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Contact</SectionTitle>
          <Field label="Téléphone de contact" hint="Ex: 06XXXXXXXX, 07XXXXXXXX">
            <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="Ex: 0612345678" />
          </Field>
        </div>

        {/* ── PHOTOS ── */}
        <div ref={sectionRefs.images} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Photos du véhicule *</SectionTitle>
          <ImageUploader images={form.images} onChange={(v) => set("images", v)} token={token} error={errors.images} />
        </div>

        {/* ── ÉQUIPEMENTS ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Options & Équipements</SectionTitle>
          <p className="text-xs text-gray-400">
            Exemples: Climatisation, Jantes alliage, Caméra de recul, Toit ouvrant, GPS...
          </p>
          <FeaturesManager features={form.features} onChange={(v) => set("features", v)} />
        </div>

        {/* ── SUBMIT ── */}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm">
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 py-3.5 bg-[#2D5016] text-white font-extrabold rounded-xl hover:bg-[#A7D129] hover:text-[#2D5016] transition text-sm disabled:opacity-60">
            {submitting ? "Publication..." : "Publier le véhicule"}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400">Votre annonce sera soumise à validation avant d'être publiée.</p>
      </div>
    </div>
  );
}
