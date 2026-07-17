"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { tourismService } from "@/services/tourismService";
import { uploadService } from "@/services/uploadService";
import { getAdminCategories } from "@/lib/adminApi";
import AdminLocationPicker from "@/components/admin/AdminLocationPicker";
import TourismDetailMap from "@/components/explore/TourismDetailMap";
import SearchableDropdown from "@/components/explore/SearchableDropdown";
import { MapPin } from "lucide-react";
import { cities as MOROCCO_CITIES_RAW } from "morocco-cities";

// Standardized city list — matches the coordinates used across the app
// (map seeding, filters, etc). Keeping this as one shared source of truth
// avoids the "dropdown says Fes, DB says Fès" mismatch class of bug.
const HOURS_PRESETS = [
  "09:00 - 18:00",
  "09:00 - 20:00",
  "08:00 - 22:00",
  "10:00 - 19:00",
];

const CITY_OPTIONS = [...new Set(MOROCCO_CITIES_RAW.map((c) => c.name))].sort(
  (a, b) => a.localeCompare(b),
);

// Category slugs that require a downloadable document instead of (or in
// addition to) normal listing fields. Falls back to this if the category
// object from the API doesn't carry `displayType` for some reason.
const DOC_CATEGORY_SLUGS = ["magazine", "carte-touristique"];

const isDocCategory = (category) =>
  category?.displayType === "DOCUMENT" ||
  DOC_CATEGORY_SLUGS.includes(category?.slug);

const PHONE_RE = /^(?:\+212|00212|0)[5-7]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

function validate(formData, category) {
  const errors = {};

  if (!formData.name?.trim()) errors.name = "Le nom est requis.";
  if (!formData.categoryId) errors.categoryId = "Choisissez une catégorie.";
  if (!formData.city) errors.city = "Choisissez une ville.";
  if (formData.rating !== "" && formData.rating != null) {
  const rating = parseFloat(formData.rating);
    if (Number.isNaN(rating) || rating < 0 || rating > 5) {
      errors.rating = "La note doit être comprise entre 0 et 5.";
    }
  }
  if (formData.prix !== "" && formData.prix != null) {
  const prix = parseFloat(formData.prix);
    if (Number.isNaN(prix) || prix < 0) {
      errors.prix = "Le prix doit être un nombre positif (0 = gratuit).";
    }
  }
  const HOURS_RE =
    /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)(\s*,\s*([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d))*$/;
  if (
  formData.hours &&
  formData.hours !== "24h/24" &&
  !HOURS_RE.test(formData.hours.trim())
) {
    errors.hours =
      "Format attendu : 09:00 - 18:00 (ou plusieurs plages séparées par une virgule).";
  }
  if (
    formData.contactPhone &&
    !PHONE_RE.test(formData.contactPhone.replace(/[\s.-]/g, ""))
  ) {
    errors.contactPhone = "Numéro invalide (ex: 0612345678 ou +212612345678).";
  }
  if (formData.contactEmail && !EMAIL_RE.test(formData.contactEmail)) {
    errors.contactEmail = "Email invalide.";
  }

  if (formData.latitude !== "" && formData.latitude !== null) {
    const lat = parseFloat(formData.latitude);
    if (Number.isNaN(lat) || lat < 20 || lat > 36) {
      errors.latitude = "Latitude hors du Maroc (20 à 36).";
    }
  }
  if (formData.longitude !== "" && formData.longitude !== null) {
    const lng = parseFloat(formData.longitude);
    if (Number.isNaN(lng) || lng < -18 || lng > 0) {
      errors.longitude = "Longitude hors du Maroc (-18 à 0).";
    }
  }

  if (isDocCategory(category)) {
    if (!formData.fileUrl?.trim()) {
      errors.fileUrl = "Un fichier PDF est requis pour cette catégorie.";
    } else if (!URL_RE.test(formData.fileUrl.trim())) {
      errors.fileUrl = "Doit être une URL valide (https://...).";
    }
  }

  if (!formData.latitude || !formData.longitude) {
    errors.location =
      "Merci de définir la position (lien Google Maps ou clic sur la carte).";
  }
  return errors;
}

const IconSearch = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="10" cy="10" r="7" />
    <path d="M21 21l-6 -6" />
  </svg>
);

const IconCompass = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IconPlus = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconEdit = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const IconUpload = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

const IconStar = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

function Field({ label, error, hint, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition ${
        error
          ? "border-red-300 focus:ring-red-200 bg-red-50"
          : "border-gray-200 focus:ring-[#A7D129]/20 focus:border-[#2D5016] bg-gray-50 focus:bg-white"
      }`}
    />
  );
}

function Select({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition bg-white ${
        error
          ? "border-red-300 focus:ring-red-200"
          : "border-gray-200 focus:ring-[#A7D129]/20 focus:border-[#2D5016] bg-gray-50 focus:bg-white"
      }`}
    >
      {children}
    </select>
  );
}

const emptyForm = () => ({
  name: "",
  categoryId: "",
  description: "",
  city: "",
  neighborhood: "",
  contactPhone: "",
  contactEmail: "",
  fileUrl: "",
  latitude: "",
  longitude: "",
  mapUrl: "",
  hours: "",
  prix: "",
  rating: "",
  facebook: "",
  instagram: "",
  website: "",
  isActive: true,
  isFeatured: false,
  images: [],
});

export default function AdminTourismPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [page, setPage] = useState(1);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewActiveImage, setViewActiveImage] = useState(0);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);
  const sessionUploadsRef = useRef([]); // uploads made THIS form session, not yet saved
  const [mapUrlError, setMapUrlError] = useState("");

  function extractLatLngFromGoogleMapsUrl(url) {
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    ];
    for (const re of patterns) {
      const match = url.match(re);
      if (match)
        return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  }

  const handleMapUrlPaste = (e) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, mapUrl: url }));

    if (!url.trim()) {
      setMapUrlError("");
      return;
    }

    const coords = extractLatLngFromGoogleMapsUrl(url);
    if (coords) {
      setFormData((prev) => ({
        ...prev,
        latitude: String(coords.lat),
        longitude: String(coords.lng),
      }));
      setMapUrlError("");
    } else {
      setMapUrlError(
        "Impossible d'extraire les coordonnées. Merci de pointer l'emplacement directement sur la carte ci-dessous.",
      );
    }
  };

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);
  const showFileField = isDocCategory(selectedCategory);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const cats = await getAdminCategories("tourisme", token);
      setCategories(cats);

      const response = await tourismService.getAll({
        search,
        categorySlug: activeCategory,
        isActive: activeStatus,
        page,
        limit: 12,
      });

      setListings(response.data || []);
      setPagination(
        response.pagination || {
          page: 1,
          totalPages: 1,
          total: response.data?.length || 0,
        },
      );
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, activeStatus, page, token, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActive = async (item) => {
    setActionLoading(item.id);
    try {
      await tourismService.update(item.id, { isActive: !item.isActive });
      toast.success(`Statut mis à jour avec succès.`);
      await loadData();
    } catch (e) {
      toast.error("Impossible de modifier le statut.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Voulez-vous supprimer ce lieu touristique ?")) return;
    setActionLoading(id);
    try {
      await tourismService.delete(id);
      toast.success("Lieu supprimé avec succès.");
      await loadData();
    } catch (e) {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenCreate = () => {
    sessionUploadsRef.current = [];
  setEditId(null);
    setErrors({});
    setFormData({
      ...emptyForm(),
      categoryId: categories[0]?.id || "",
      city: "Kenitra",
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    sessionUploadsRef.current = []; // existing images aren't "this session's" uploads
  setEditId(item.id);
    setErrors({});
    setFormData({
      name: item.name || "",
      categoryId: item.categoryId || "",
      description: item.description || "",
      city: item.city || "",
      neighborhood: item.neighborhood || "",
      contactPhone: item.contactPhone || "",
      contactEmail: item.contactEmail || "",
      fileUrl: item.fileUrl || "",
      latitude: item.latitude ? String(item.latitude) : "",
      longitude: item.longitude ? String(item.longitude) : "",
      mapUrl: item.mapUrl || "",
      hours: item.hours || "",
      prix: item.prix != null ? String(item.prix) : "",
      rating: item.rating != null ? String(item.rating) : "",
      facebook: item.facebook || "",
      instagram: item.instagram || "",
      website: item.website || "",
      isActive: item.isActive,
      isFeatured: item.isFeatured,
      images: item.images || [],
    });
    setFormOpen(true);
  };
const handleImageFilePick = async (e) => {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  if (formData.images.length + files.length > 10) {
    toast.error("Maximum 10 photos par lieu.");
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }

  setUploadingImage(true);
  try {
    const uploaded = await Promise.all(
      files.map((file) => uploadService.uploadImage(file, token))
    );
    uploaded.forEach(({ publicId }) => {
      sessionUploadsRef.current.push({ publicId, resourceType: "image" });
    });
    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        ...uploaded.map(({ url }, i) => ({
          url,
          isCover: prev.images.length === 0 && i === 0,
        })),
      ],
    }));
  } catch (err) {
    console.error(err);
    toast.error("Échec de l'upload d'une ou plusieurs images.");
  } finally {
    setUploadingImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
};

const handleCancelForm = () => {
  sessionUploadsRef.current.forEach(({ publicId, resourceType }) => {
    uploadService.deleteUpload(publicId, resourceType, token).catch(() => {});
  });
  sessionUploadsRef.current = [];
  setFormOpen(false);
};

const handleDocFilePick = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.type !== "application/pdf") {
    toast.error("Seuls les fichiers PDF sont acceptés.");
    if (docInputRef.current) docInputRef.current.value = "";
    return;
  }
  setUploadingDoc(true);
  try {
    const { url, publicId } = await uploadService.uploadDocument(file, token);
    sessionUploadsRef.current.push({ publicId, resourceType: "raw" });
    setFormData((prev) => ({ ...prev, fileUrl: url }));
    setErrors((prev) => ({ ...prev, fileUrl: undefined }));
  } catch (err) {
    console.error(err);
    toast.error("Échec de l'upload du document.");
  } finally {
    setUploadingDoc(false);
    if (docInputRef.current) docInputRef.current.value = "";
  }
};

  const handleSetCover = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isCover: i === index })),
    }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      // Keep exactly one cover if any images remain.
      if (images.length && !images.some((i) => i.isCover))
        images[0].isCover = true;
      return { ...prev, images };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate(formData, selectedCategory);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      toast.error("Veuillez corriger les champs en rouge.");
      return;
    }

    const payload = {
      ...formData,
      latitude: formData.latitude !== "" ? parseFloat(formData.latitude) : null,
      longitude:
        formData.longitude !== "" ? parseFloat(formData.longitude) : null,
      fileUrl: showFileField ? formData.fileUrl.trim() : null,
      mapUrl: formData.mapUrl?.trim() || null,
      rating: formData.rating !== "" ? parseFloat(formData.rating) : null,
      prix: formData.prix !== "" ? parseFloat(formData.prix) : null,
      hours: formData.hours?.trim() || null,
      facebook: formData.facebook?.trim() || null,
      instagram: formData.instagram?.trim() || null,
      website: formData.website?.trim() || null,
    };

    setSubmitting(true);
    try {
      if (editId) {
  await tourismService.update(editId, payload);
  toast.success("Lieu mis à jour avec succès.");
} else {
  await tourismService.create(payload);
  toast.success("Lieu créé avec succès.");
}
sessionUploadsRef.current = [];
setFormOpen(false);
      await loadData();
    } catch (err) {
      // Surface backend validation messages if present.
      const backendErrors = err?.response?.data?.errors;
      if (backendErrors) {
        setErrors(backendErrors);
        toast.error("Le serveur a rejeté certains champs.");
      } else {
        toast.error(err?.response?.data?.message || "Erreur de sauvegarde.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <IconCompass />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gestion Tourisme
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Gérez les monuments, hôtels, restaurants et documents touristiques
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2D5016] hover:bg-[#1e3a0f] transition-all shadow-sm"
        >
          <IconPlus /> Ajouter une annonce
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <IconSearch />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#2D5016] focus:bg-white transition-all"
          />
        </div>

        <select
          value={activeCategory}
          onChange={(e) => setActiveCategory(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#2D5016] focus:bg-white"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={activeStatus}
          onChange={(e) => setActiveStatus(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:border-[#2D5016] focus:bg-white"
        >
          <option value="all">Tous statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Désactivés</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Catégorie</th>
                <th className="px-6 py-4">Ville / Quartier</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400">
                    Chargement en cours...
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400">
                    Aucun résultat.
                  </td>
                </tr>
              ) : (
                listings.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setViewItem(item);
                      setViewActiveImage(0);
                      setViewDrawerOpen(false);
                    }}
                    className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {item.images?.[0]?.url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.images[0].url}
                            alt=""
                            className="h-8 w-8 rounded-lg object-cover"
                          />
                        )}
                        <span>{item.name}</span>
                        {item.isFeatured && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-amber-500 rounded-full">
                            ★ Recommandé
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        {item.category?.name ||
                          item.category ||
                          item.categoryId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.city || "-"}{" "}
                      {item.neighborhood ? `(${item.neighborhood})` : ""}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(item);
                        }}
                        disabled={actionLoading === item.id}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          item.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {item.isActive ? "Actif" : "Désactivé"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(item);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#2D5016] hover:bg-[#A7D129]/10 transition-all"
                        title="Modifier"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        disabled={actionLoading === item.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        title="Supprimer"
                      >
                        <IconTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <span className="text-xs text-gray-400">
              Total : {pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal (read-only) */}
      {viewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
          onClick={() => setViewItem(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-base font-bold text-gray-900">
                {viewItem.name}
              </h2>
              <button
               onClick={handleCancelForm}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {viewItem.images?.length > 0 ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setViewActiveImage((i) => i)}
                    className="block w-full"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        viewItem.images[viewActiveImage]?.url ||
                        viewItem.images[0].url
                      }
                      alt=""
                      className="h-64 w-full rounded-xl object-cover"
                    />
                  </button>

                  {viewItem.images.length > 1 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex flex-1 gap-2 overflow-x-auto">
                        {viewItem.images.slice(0, 6).map((img, i) => (
                          <button
                            key={img.url + i}
                            type="button"
                            onClick={() => setViewActiveImage(i)}
                            className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                              i === viewActiveImage
                                ? "border-[#2D5016]"
                                : "border-transparent opacity-70 hover:opacity-100"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={img.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                      {viewItem.images.length > 6 && (
                        <button
                          type="button"
                          onClick={() => setViewDrawerOpen(true)}
                          className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-[#2D5016] hover:text-[#2D5016]"
                        >
                          Voir les {viewItem.images.length} photos
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
                  Aucune photo
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
                  {viewItem.category?.name || viewItem.category}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-bold ${viewItem.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {viewItem.isActive ? "Actif" : "Désactivé"}
                </span>
                {viewItem.isFeatured && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
                    ★ Recommandé
                  </span>
                )}
              </div>

              {viewItem.description && (
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                  {viewItem.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Ville / Quartier
                  </p>
                  <p className="mt-0.5 text-gray-800">
                    {viewItem.city || "-"}{" "}
                    {viewItem.neighborhood ? `(${viewItem.neighborhood})` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Évaluation
                  </p>
                  <div className="mt-0.5 flex items-center gap-0.5 text-amber-400">
                    {viewItem?.rating ? (
                      [1, 2, 3, 4, 5].map((n) => (
                        <IconStar
                          key={n}
                          filled={
                            n <=
                            Math.round(
                              parseFloat(viewItem.rating) || 0,
                            )
                          }
                        />
                      ))
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Téléphone
                  </p>
                  <p className="mt-0.5 text-gray-800">
                    {viewItem.contactPhone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Email
                  </p>
                  <p className="mt-0.5 text-gray-800">
                    {viewItem.contactEmail || "—"}
                  </p>
                </div>
                {viewItem?.hours && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Horaires
                    </p>
                    <p className="mt-0.5 text-gray-800">
                      {viewItem.hours}
                    </p>
                  </div>
                )}
                {viewItem?.prix && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Prix
                    </p>
                    <p className="mt-0.5 text-gray-800">
                      {viewItem.prix}
                    </p>
                  </div>
                )}
                {viewItem.fileUrl && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Document
                    </p>
                    <a
                      href={viewItem.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-block font-medium text-[#2D5016] hover:underline"
                    >
                      Ouvrir le PDF
                    </a>
                  </div>
                )}
              </div>

              {viewItem.latitude != null && viewItem.longitude != null && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Localisation
                  </p>
                  <TourismDetailMap
                    listing={viewItem}
                    className="h-48 w-full overflow-hidden rounded-xl border border-gray-200"
                  />
                </div>
              )}

              {(viewItem.facebook ||
                viewItem.instagram ||
                viewItem.website) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                    Réseaux
                  </p>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {viewItem.facebook && (
                      <a
                        href={viewItem.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2D5016] hover:underline"
                      >
                        Facebook
                      </a>
                    )}
                    {viewItem.instagram && (
                      <a
                        href={viewItem.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2D5016] hover:underline"
                      >
                        Instagram
                      </a>
                    )}
                    {viewItem.website && (
                      <a
                        href={viewItem.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#2D5016] hover:underline"
                      >
                        Site web
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-gray-400">
                {viewItem.viewsCount != null && (
                  <span>{viewItem.viewsCount} vues</span>
                )}
                {viewItem.downloadsCount != null && (
                  <span>{viewItem.downloadsCount} téléchargements</span>
                )}
                {viewItem.createdAt && (
                  <span>
                    Créé le{" "}
                    {new Date(viewItem.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setViewItem(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  const item = viewItem;
                  setViewItem(null);
                  handleOpenEdit(item);
                }}
                className="px-5 py-2.5 bg-[#2D5016] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a0f] transition shadow-xs"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full photo grid — only used when a listing has more than 6 photos */}
      {viewDrawerOpen && viewItem?.images?.length > 0 && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">
              {viewItem.images.length} photos — {viewItem.name}
            </p>
            <button
              onClick={() => setViewDrawerOpen(false)}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3">
              {viewItem.images.map((img, i) => (
                <button
                  key={img.url + i}
                  type="button"
                  onClick={() => {
                    setViewActiveImage(i);
                    setViewDrawerOpen(false);
                  }}
                  className="aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="h-full w-full object-cover hover:brightness-95"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-base font-bold text-gray-900">
                {editId ? "Modifier la fiche" : "Créer une fiche tourisme"}
              </h2>
              <button
                onClick={() => setFormOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleFormSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {/* Section 1: Main Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#2D5016] uppercase tracking-wide border-b pb-1 border-gray-100">
                  Informations Générales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nom" required error={errors.name}>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      error={errors.name}
                    />
                  </Field>
                  <Field label="Catégorie" required error={errors.categoryId}>
                    <Select
                      value={formData.categoryId}
                      onChange={(e) =>
                        setFormData({ ...formData, categoryId: e.target.value })
                      }
                      error={errors.categoryId}
                    >
                      <option value="">— Choisir —</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="Description / Présentation">
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition border-gray-200 focus:ring-[#A7D129]/20 focus:border-[#2D5016] bg-gray-50 focus:bg-white resize-none"
                  />
                </Field>
              </div>

              {/* Section 2: Address & Coordinates */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#2D5016] uppercase tracking-wide border-b pb-1 border-gray-100">
                  Adresse & Position
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Ville" required error={errors.city}>
                    <SearchableDropdown
                      label="Ville"
                      icon={MapPin}
                      value={formData.city}
                      options={CITY_OPTIONS}
                      onSelect={(v) =>
                        setFormData({ ...formData, city: v || "" })
                      }
                      emptyLabel="— Choisir —"
                      placeholder="Tapez pour chercher une ville..."
                      width="w-full"
                    />
                  </Field>
                  <Field label="Quartier">
                    <Input
                      type="text"
                      value={formData.neighborhood}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          neighborhood: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
                <Field
                  label="Lien Google Maps"
                  hint="Collez le lien de partage Google Maps de l'établissement"
                  error={mapUrlError || errors.location}
                >
                  <Input
                    type="text"
                    placeholder="https://www.google.com/maps/place/..."
                    value={formData.mapUrl || ""}
                    onChange={handleMapUrlPaste}
                    error={!!(mapUrlError || errors.location)}
                  />
                </Field>
                <AdminLocationPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onChange={(lat, lng) =>
                    setFormData((prev) => ({
                      ...prev,
                      latitude: String(lat),
                      longitude: String(lng),
                    }))
                  }
                />
              </div>

              {/* Section 3: Contact & Document */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#2D5016] uppercase tracking-wide border-b pb-1 border-gray-100">
                  Contact & Contenu
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Téléphone" error={errors.contactPhone}>
                    <Input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPhone: e.target.value,
                        })
                      }
                      error={errors.contactPhone}
                    />
                  </Field>
                  <Field label="Email" error={errors.contactEmail}>
                    <Input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactEmail: e.target.value,
                        })
                      }
                      error={errors.contactEmail}
                    />
                  </Field>
                </div>

                {/* Only shown for document categories (Magazine / Carte Touristique) */}
                {showFileField && (
                  <Field
                    label="Document PDF (Magazine / Carte)"
                    required
                    hint={
                      formData.fileUrl
                        ? "Un document est déjà lié — en choisir un nouveau le remplace."
                        : "PDF uniquement, 20 Mo max"
                    }
                    error={errors.fileUrl}
                  >
                    <div className="flex items-center gap-3">
                      {formData.fileUrl && (
                        <a
                          href={formData.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-[#2D5016] hover:border-[#2D5016]"
                        >
                          📄 Voir le fichier actuel
                        </a>
                      )}
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition ${
                          errors.fileUrl
                            ? "border-red-300 text-red-600"
                            : "border-gray-200 text-gray-600 hover:border-[#2D5016] hover:text-[#2D5016]"
                        }`}
                      >
                        <IconUpload />
                        {uploadingDoc
                          ? "Envoi..."
                          : formData.fileUrl
                            ? "Remplacer le PDF"
                            : "Choisir un PDF"}
                        <input
                          ref={docInputRef}
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={handleDocFilePick}
                          disabled={uploadingDoc}
                        />
                      </label>
                    </div>
                  </Field>
                )}
              </div>

              {/* Section 4: Images */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#2D5016] uppercase tracking-wide border-b pb-1 border-gray-100">
                  Photos
                </h3>

                <div className="flex flex-wrap gap-3">
                  {formData.images.map((img, i) => (
                    <div
                      key={img.url + i}
                      className="relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleSetCover(i)}
                        title={
                          img.isCover
                            ? "Photo de couverture"
                            : "Définir comme couverture"
                        }
                        className={`absolute left-1 top-1 rounded-full p-1 ${
                          img.isCover
                            ? "bg-amber-400 text-white"
                            : "bg-white/80 text-gray-400 hover:text-amber-500"
                        }`}
                      >
                        <IconStar filled={img.isCover} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute right-1 top-1 rounded-full bg-white/80 p-1 text-gray-500 hover:text-red-600"
                        title="Supprimer"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  ))}

                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#2D5016] hover:text-[#2D5016] transition-colors">
                    {uploadingImage ? (
                      <span className="text-xs">Envoi...</span>
                    ) : (
                      <>
                        <IconUpload />
                        <span className="text-[10px] font-medium">Ajouter</span>
                      </>
                    )}
                    <input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  multiple
  className="hidden"
  onChange={handleImageFilePick}
  disabled={uploadingImage}
/>
                  </label>
                </div>
                <p className="text-xs text-gray-400">
                  L'étoile marque la photo de couverture affichée dans les
                  listes.
                </p>
              </div>

              {/* Section 5: JSON Attributes */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#2D5016] uppercase tracking-wide border-b pb-1 border-gray-100">
                  Options & Attributs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Horaires" error={errors.hours}>
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
      <input
        type="checkbox"
        checked={formData.hours === "24h/24"}
        onChange={(e) => {
          const is24h = e.target.checked;
          setFormData({ ...formData, hours: is24h ? "24h/24" : "" });
        }}
        className="w-4 h-4 rounded border-gray-300 text-[#2D5016] focus:ring-[#A7D129]/20"
      />
      Ouvert 24h/24
    </label>

    <Select
      value={HOURS_PRESETS.includes(formData.hours) ? formData.hours : "custom"}
      onChange={(e) => {
        const val = e.target.value;
        setFormData({ ...formData, hours: val === "custom" ? "" : val });
      }}
      disabled={formData.hours === "24h/24"}
      error={errors.hours}
    >
      {HOURS_PRESETS.map((h) => (
        <option key={h} value={h}>{h}</option>
      ))}
      <option value="custom">Personnalisé...</option>
    </Select>

    {!HOURS_PRESETS.includes(formData.hours) && formData.hours !== "24h/24" && (
      <Input
        type="text"
        placeholder="Ex: 09:00 - 12:00, 14:00 - 19:00"
        value={formData.hours}
        onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
        error={errors.hours}
      />
    )}
  </div>
</Field>
                  <Field label="Prix moyen (DH)" error={errors.prix} hint="0 = Gratuit">
  <Input
    type="number"
    inputMode="numeric"
    min="0"
    step="1"
    placeholder="Ex: 50"
    value={formData.prix}
    onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
    error={errors.prix}
  />
</Field>
                  <Field label="Évaluation moyenne" error={errors.rating}>
  <Input
    type="number"
    inputMode="decimal"
    min="0"
    max="5"
    step="0.1"
    placeholder="Ex: 4.5"
    value={formData.rating}
    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
    error={errors.rating}
  />
</Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Facebook URL">
  <Input
    type="text"
    value={formData.facebook}
    onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
  />
</Field>
<Field label="Instagram URL">
  <Input
    type="text"
    value={formData.instagram}
    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
  />
</Field>
<Field label="Site Web URL">
  <Input
    type="text"
    value={formData.website}
    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
  />
</Field>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6 border-t pt-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-[#2D5016] focus:ring-[#A7D129]/20"
                  />
                  Publier l'annonce
                </label>

                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      setFormData({ ...formData, isFeatured: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300 text-[#2D5016] focus:ring-[#A7D129]/20"
                  />
                  Recommandé / En vedette
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
  type="button"
  onClick={handleCancelForm}
  className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
>
  Annuler
</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#2D5016] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a0f] transition shadow-xs disabled:opacity-60"
                >
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
