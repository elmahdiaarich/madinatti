"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { realEstateService } from "@/services/realEstateService";
import axios from "axios";
import moroccoCities from "morocco-cities";

const API = process.env.NEXT_PUBLIC_API_URL;

const LISTING_TYPES = [
  { label: "Vente", value: "SALE" },
  { label: "Location", value: "RENT" },
];

const PROPERTY_TYPES = [
  { label: "Appartement", value: "APARTMENT" },
  { label: "Villa", value: "VILLA" },
  { label: "Maison", value: "HOUSE" },
  { label: "Studio", value: "STUDIO" },
  { label: "Terrain", value: "LAND" },
  { label: "Bureau", value: "OFFICE" },
  { label: "Commerce", value: "SHOP" },
];

// Maps PropertyType enum → category slug produced by the seed
const PROPERTY_TYPE_TO_SLUG = {
  APARTMENT: "immobilier-appartement",
  VILLA:     "immobilier-villa",
  HOUSE:     "immobilier-maison",
  STUDIO:    "immobilier-studio",
  LAND:      "immobilier-terrain",
  OFFICE:    "immobilier-bureau",
  SHOP:      "immobilier-commerce",
};

const EMPTY = {
  title: "",
  description: "",
  categoryId: "",
  listingType: "SALE",
  propertyType: "APARTMENT",
  price: "",
  surface: "",
  rooms: "",
  bathrooms: "",
  floor: "",
  city: "",
  location: "",
  latitude: "",
  longitude: "",
  contactPhone: "",
  images: [],
  features: {},
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

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
          : "border-gray-200 focus:ring-primary focus:border-transparent"
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
          : "border-gray-200 focus:ring-primary focus:border-transparent"
      }`}
    >
      {children}
    </select>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="w-1 h-5 rounded-full bg-primary inline-block" />
      <h2 className="font-bold text-gray-900 text-base">{children}</h2>
    </div>
  );
}

// ─── Map picker ───────────────────────────────────────────────────────────────

function MapPicker({ latitude, longitude, onChange }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (leafletMap.current) return;

    const initMap = () => {
      if (!mapRef.current || !window.L) return;
      // Prevent double-init (React StrictMode)
      if (mapRef.current._leaflet_id) return;

      const L = window.L;
      const defaultLat = latitude ? parseFloat(latitude) : 33.9716;
      const defaultLng = longitude ? parseFloat(longitude) : -6.8498;

      const map = L.map(mapRef.current).setView(
        [defaultLat, defaultLng],
        latitude ? 13 : 6,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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
        if (window.L) {
          clearInterval(interval);
          initMap();
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, []);

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
          Cliquez sur la carte pour épingler la position exacte du bien
          (optionnel).
        </p>
      )}
    </div>
  );
}

// ─── Image uploader ───────────────────────────────────────────────────────────

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
    if (next.length > 0 && !next.some((img) => img.isCover)) {
      next[0].isCover = true;
    }
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
            : "border-gray-200 hover:border-primary hover:bg-primary/5"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-primary font-semibold">
              Upload en cours...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <span className="text-3xl">📷</span>
            <p className="text-sm font-semibold">
              Cliquez pour choisir des photos
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, WEBP — max 5 Mo par photo — jusqu'à 10 photos
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span>
          {error}
        </p>
      )}

      {uploadError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span>
          {uploadError}
        </p>
      )}

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className={`relative group rounded-xl overflow-hidden border-2 w-24 h-24 ${
                img.isCover ? "border-primary" : "border-gray-200"
              }`}
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                {!img.isCover && (
                  <button
                    type="button"
                    onClick={() => setCover(i)}
                    className="text-[10px] bg-white text-primary-dark px-2 py-0.5 rounded-full font-bold"
                  >
                    Couverture
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold"
                >
                  Supprimer
                </button>
              </div>
              {img.isCover && (
                <span className="absolute top-1 left-1 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">
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

// ─── Features manager ─────────────────────────────────────────────────────────

function FeaturesManager({ features, onChange }) {
  const [key, setKey] = useState("");
  const [val, setVal] = useState("");

  const add = () => {
    if (!key.trim()) return;
    onChange({ ...features, [key.trim()]: val.trim() || true });
    setKey("");
    setVal("");
  };

  const remove = (k) => {
    const next = { ...features };
    delete next[k];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Équipement (ex: Parking)"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Valeur (optionnel)"
          className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition"
        >
          +
        </button>
      </div>
      {Object.keys(features).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(features).map(([k, v]) => (
            <span
              key={k}
              className="flex items-center gap-1 px-3 py-1 bg-primary-mint border border-primary rounded-full text-xs font-semibold text-primary-dark"
            >
              {k}
              {v !== true ? `: ${v}` : ""}
              <button
                type="button"
                onClick={() => remove(k)}
                className="ml-1 text-red-400 hover:text-red-600 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CreateListingPage() {
  return (
    <ProtectedRoute roles={["business"]}>
      <CreateListingForm />
    </ProtectedRoute>
  );
}

function CreateListingForm() {
  const { token } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [subcategories, setSubcategories] = useState([]);

  const sectionRefs = {
    title:       useRef(null),
    description: useRef(null),
    price:       useRef(null),
    city:        useRef(null),
    location:    useRef(null),
    images:      useRef(null),
  };

  const ERROR_ORDER = ["title", "description", "price", "city", "location", "images"];

  const cities = moroccoCities.cities
    .map((c) => c.label || c.name || c.city)
    .filter(Boolean)
    .sort();

  // ── Fetch immobilier subcategories ────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/api/categories`).then((r) => {
      const data = r.data.data || [];
      const immobilier = data.find((p) =>
        p.name.toLowerCase().includes("immobilier"),
      );
      setSubcategories(immobilier?.children || []);
    });
  }, []);

  // ── Auto-set categoryId based on propertyType ─────────────────────────────
  useEffect(() => {
    if (!subcategories.length) return;
    const slug = PROPERTY_TYPE_TO_SLUG[form.propertyType];
    const match = subcategories.find((c) => c.slug === slug);
    if (match) set("categoryId", match.id);
  }, [form.propertyType, subcategories]);

  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 5)
      e.title = "Min 5 caractères";
    if (!form.description.trim() || form.description.trim().length < 10)
      e.description = "Min 10 caractères";
    if (!form.price || Number(form.price) <= 0)
      e.price = "Prix invalide";
    if (!form.city)
      e.city = "Veuillez sélectionner une ville";
    if (!form.location.trim())
      e.location = "Requis";
    if (form.images.length === 0)
      e.images = "Ajoutez au moins une photo";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      const firstKey = ERROR_ORDER.find((k) => e[k]);
      if (firstKey && sectionRefs[firstKey]?.current) {
        sectionRefs[firstKey].current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        surface: form.surface ? parseFloat(form.surface) : undefined,
        rooms: form.rooms ? parseInt(form.rooms) : undefined,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined,
        floor: form.floor !== "" ? parseInt(form.floor) : undefined,
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      };
      await realEstateService.createListing(payload, token);
      router.push("/my-space/services/real-estate?created=1");
    } catch (err) {
      setServerError(err.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-primary-dark text-lg">
            Publier une annonce
          </h1>
          <span className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full font-semibold">
            En attente de validation admin
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* ── INFORMATIONS GÉNÉRALES ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Informations générales</SectionTitle>

          <div ref={sectionRefs.title}>
            <Field label="Titre de l'annonce *" error={errors.title}>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ex: Appartement F3 vue mer à Tanger"
                error={errors.title}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type de transaction *">
              <Select
                value={form.listingType}
                onChange={(e) => set("listingType", e.target.value)}
              >
                {LISTING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Type de bien *">
              <Select
                value={form.propertyType}
                onChange={(e) => set("propertyType", e.target.value)}
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div ref={sectionRefs.description}>
            <Field label="Description *" error={errors.description}>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Décrivez le bien en détail (état, orientation, quartier, proximités...)"
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition resize-none ${
                  errors.description
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-200 focus:ring-primary"
                }`}
              />
            </Field>
          </div>
        </div>

        {/* ── PRIX & SURFACE ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Prix & Surface</SectionTitle>

          <div ref={sectionRefs.price} className="grid grid-cols-2 gap-4">
            <Field label="Prix (MAD) *" error={errors.price}>
              <Input
                type="number"
                min="1"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="Ex: 1500000"
                error={errors.price}
              />
            </Field>
            <Field label="Surface (m²)">
              <Input
                type="number"
                min="0"
                value={form.surface}
                onChange={(e) => set("surface", e.target.value)}
                placeholder="Ex: 90"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Pièces">
              <Input
                type="number"
                min="0"
                value={form.rooms}
                onChange={(e) => set("rooms", e.target.value)}
                placeholder="Ex: 3"
              />
            </Field>
            <Field label="Salles de bain">
              <Input
                type="number"
                min="0"
                value={form.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
                placeholder="Ex: 2"
              />
            </Field>
            <Field label="Étage">
              <Input
                type="number"
                min="0"
                value={form.floor}
                onChange={(e) => set("floor", e.target.value)}
                placeholder="Ex: 4"
              />
            </Field>
          </div>
        </div>

        {/* ── LOCALISATION ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Localisation</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <div ref={sectionRefs.city}>
              <Field label="Ville *" error={errors.city}>
                <Select
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  error={errors.city}
                >
                  <option value="">Sélectionner une ville</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div ref={sectionRefs.location}>
              <Field label="Adresse / Quartier *" error={errors.location}>
                <Input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Ex: Quartier Maarif, Bd Zerktouni"
                  error={errors.location}
                />
              </Field>
            </div>
          </div>

          <Field
            label="Position sur la carte"
            hint="Cliquez sur la carte pour épingler l'emplacement exact (optionnel mais recommandé)."
          >
            <MapPicker
              latitude={form.latitude}
              longitude={form.longitude}
              onChange={(lat, lng) => {
                set("latitude", lat);
                set("longitude", lng);
              }}
            />
          </Field>

          {(form.latitude || form.longitude) && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude">
                <Input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => set("latitude", e.target.value)}
                />
              </Field>
              <Field label="Longitude">
                <Input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => set("longitude", e.target.value)}
                />
              </Field>
            </div>
          )}
        </div>

        {/* ── CONTACT ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Contact</SectionTitle>
          <Field
            label="Téléphone de contact"
            hint="Formats acceptés : 06XXXXXXXX, 07XXXXXXXX, +212XXXXXXXXX"
          >
            <Input
              value={form.contactPhone}
              onChange={(e) => set("contactPhone", e.target.value)}
              placeholder="Ex: 0612345678"
            />
          </Field>
        </div>

        {/* ── PHOTOS ── */}
        <div
          ref={sectionRefs.images}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4"
        >
          <SectionTitle>Photos *</SectionTitle>
          <ImageUploader
            images={form.images}
            onChange={(v) => set("images", v)}
            token={token}
            error={errors.images}
          />
        </div>

        {/* ── ÉQUIPEMENTS ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Équipements & extras</SectionTitle>
          <p className="text-xs text-gray-400">
            Exemples: Parking, Piscine, Terrasse, Climatisation, Ascenseur...
          </p>
          <FeaturesManager
            features={form.features}
            onChange={(v) => set("features", v)}
          />
        </div>

        {/* ── SERVER ERROR ── */}
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-sm text-red-700">
            ❌ {serverError}
          </div>
        )}

        {/* ── SUBMIT ── */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3.5 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-sage transition text-sm disabled:opacity-60"
          >
            {submitting ? "Publication..." : "Publier l'annonce"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400">
          Votre annonce sera soumise à validation avant d'être publiée.
        </p>
      </div>
    </div>
  );
}