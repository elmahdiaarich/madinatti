"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { realEstateService } from "@/services/realEstateService";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import axios from "axios";
import moroccoCities from "morocco-cities";
import { useToast } from "@/context/ToastContext";

const API = process.env.NEXT_PUBLIC_API_URL;

const LISTING_TYPES = [
  { label: "Vente", value: "SALE" },
  { label: "Location", value: "RENT" },
];

const PROPERTY_TYPE_TO_SLUG = {
  APARTMENT: "appartement",
  VILLA:     "villa",
  HOUSE:     "maison",
  STUDIO:    "studio",
  LAND:      "terrain",
  OFFICE:    "bureau",
  SHOP:      "commerce",
};

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
              : "border-gray-200 hover:border-primary hover:bg-primary/5"
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-primary font-semibold">Upload en cours...</p>
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
                img.isCover ? "border-primary" : "border-gray-200"
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                {!img.isCover && (
                  <button type="button" onClick={() => setCover(i)}
                    className="text-[10px] bg-white text-primary-dark px-2 py-0.5 rounded-full font-bold">
                    Couverture
                  </button>
                )}
                <button type="button" onClick={() => remove(i)}
                  className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
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
          placeholder="Équipement (ex: Parking)"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <input value={val} onChange={(e) => setVal(e.target.value)}
          placeholder="Valeur (optionnel)"
          className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <button type="button" onClick={add}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition">
          +
        </button>
      </div>
      {Object.keys(features).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(features).map(([k, v]) => (
            <span key={k}
              className="flex items-center gap-1 px-3 py-1 bg-primary-mint border border-primary rounded-full text-xs font-semibold text-primary-dark">
              {k}{v !== true ? `: ${v}` : ""}
              <button type="button" onClick={() => remove(k)}
                className="ml-1 text-red-400 hover:text-red-600 font-bold font-mono">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EditListingPage() {
  return (
    <ProtectedRoute roles={["citizen"]}>
      <EditListingForm />
    </ProtectedRoute>
  );
}

function EditListingForm() {
  const { id } = useParams();
  const { token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [flyTo, setFlyTo] = useState(null);

  const sectionRefs = {
    title: useRef(null),
    description: useRef(null),
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

  const ERROR_ORDER = ["title", "description", "price", "region", "city", "location", "images"];

  // ── Fetch subcategories ───────────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/api/categories`).then((r) => {
      const data = r.data.data || [];
      setSubcategories(data.filter((c) => c.module === "immobilier"));
    });
  }, []);

  // ── Load listing ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await realEstateService.getMyListingById(id, token);
        const d = res.data;
        setForm({
          title: d.title || "",
          description: d.description || "",
          categoryId: d.categoryId || "",
          listingType: d.listingType || "SALE",
          propertyType: d.propertyType || "APARTMENT",
          price: d.price?.toString() || "",
          surface: d.surface?.toString() || "",
          rooms: d.rooms?.toString() || "",
          bathrooms: d.bathrooms?.toString() || "",
          floor: d.floor?.toString() || "",
          region: d.region || "",
          city: d.city || "",
          location: d.location || "",
          latitude: d.latitude?.toString() || "",
          longitude: d.longitude?.toString() || "",
          contactPhone: d.contactPhone || "",
          images: Array.isArray(d.images) ? d.images : [],
          features: d.features && typeof d.features === "object" ? d.features : {},
        });
        if (d.latitude && d.longitude) {
          setFlyTo({
            lat: parseFloat(d.latitude),
            lng: parseFloat(d.longitude),
            zoom: 14,
          });
        }
      } catch (e) {
        toast.error("Annonce introuvable ou accès refusé.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  // ── Auto-set categoryId based on propertyType ─────────────────────────────
  useEffect(() => {
    if (!subcategories.length || !form) return;
    const slug = PROPERTY_TYPE_TO_SLUG[form.propertyType];
    const match = subcategories.find((c) => c.slug === slug);
    if (match && form.categoryId !== match.id) {
      set("categoryId", match.id);
    }
  }, [form?.propertyType, subcategories]);

  const propertyTypeOptions = subcategories.map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const availableCities = form?.region ? citiesByRegion(form.region) : [];

  // ── Shared geocode function ───────────────────────────────────────────────
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
  }, [form?.location, geocodeAddress]);

  useEffect(() => {
    if (!form?.city || !form?.location.trim()) return;
    const t = setTimeout(() => {
      geocodeAddress(form.city, form.location);
    }, 500);
    return () => clearTimeout(t);
  }, [form?.location, form?.city, geocodeAddress]);

  const validate = () => {
    const e = {};
    if (!form.title.trim() || form.title.trim().length < 5) e.title = "Min 5 caractères";
    if (!form.description.trim() || form.description.trim().length < 10) e.description = "Min 10 caractères";
    if (!form.price || Number(form.price) <= 0) e.price = "Prix invalide";
    if (!form.region) e.region = "Veuillez sélectionner une région";
    if (!form.city) e.city = "Veuillez sélectionner une ville";
    if (!form.location.trim()) e.location = "Requis";
    if (form.images.length === 0) e.images = "Ajoutez au moins une photo";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      const firstKey = ERROR_ORDER.find((k) => e[k]);
      if (firstKey && sectionRefs[firstKey]?.current) {
        sectionRefs[firstKey].current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
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
      await realEstateService.updateMyListing(id, payload, token);
      toast.success("Annonce modifiée avec succès !");
      router.push("/my-space/real-estate");
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Erreur serveur");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Chargement de l'annonce..." />;
  if (!form) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-red-500 font-semibold">Annonce introuvable.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-extrabold text-primary-dark text-lg">Modifier l'annonce</h1>
          <span className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full font-semibold">
            Annonce re-soumise à validation
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* General Info */}
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
              <Select value={form.listingType} onChange={(e) => set("listingType", e.target.value)}>
                {LISTING_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Type de bien *">
              <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                {propertyTypeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
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
                placeholder="Décrivez le bien en détail..."
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition resize-none ${
                  errors.description
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-200 focus:ring-primary"
                }`}
              />
            </Field>
          </div>
        </div>

        {/* Pricing / Surface */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Prix & Surface</SectionTitle>

          <div ref={sectionRefs.price} className="grid grid-cols-2 gap-4">
            <Field label="Prix (MAD) *" error={errors.price}>
              <Input
                type="number" min="1"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                error={errors.price}
              />
            </Field>
            <Field label="Surface (m²)">
              <Input
                type="number" min="0"
                value={form.surface}
                onChange={(e) => set("surface", e.target.value)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Pièces">
              <Input type="number" min="0" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} />
            </Field>
            <Field label="Salles de bain">
              <Input type="number" min="0" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
            </Field>
            <Field label="Étage">
              <Input type="number" min="0" value={form.floor} onChange={(e) => set("floor", e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Localisation</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <div ref={sectionRefs.region}>
              <Field label="Région *" error={errors.region}>
                <Select value={form.region} onChange={(e) => handleRegionChange(e.target.value)} error={errors.region}>
                  <option value="">Sélectionner une région</option>
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
                    <option value="">{form.region ? "Sélectionner une ville" : "Choisir une région d'abord"}</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                  {geocoding && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div ref={sectionRefs.location}>
            <Field label="Adresse / Quartier *" error={errors.location}>
              <div className="relative">
                <Input value={form.location} onChange={(e) => set("location", e.target.value)} error={errors.location} />
                {geocoding && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
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

        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Contact</SectionTitle>
          <Field label="Téléphone de contact">
            <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </Field>
        </div>

        {/* Photos */}
        <div ref={sectionRefs.images} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Photos *</SectionTitle>
          <ImageUploader images={form.images} onChange={(v) => set("images", v)} token={token} error={errors.images} />
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
          <SectionTitle>Équipements & extras</SectionTitle>
          <FeaturesManager features={form.features} onChange={(v) => set("features", v)} />
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition text-sm">
            Annuler
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 py-3.5 bg-primary text-white font-extrabold rounded-xl hover:bg-primary-sage transition text-sm disabled:opacity-60">
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  );
}
