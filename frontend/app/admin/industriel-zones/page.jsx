"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { industrielZonesService } from "@/services/industrielZonesService";
import { uploadService } from "@/services/uploadService";
import { getAdminCategories } from "@/lib/adminApi";
import AdminLocationPicker from "@/components/admin/AdminLocationPicker";
import SearchableDropdown from "@/components/explore/SearchableDropdown";
import TourismDetailMap from "@/components/explore/TourismDetailMap";
import { MapPin } from "lucide-react";
import { cities as MOROCCO_CITIES_RAW } from "morocco-cities";
import ConfirmModal from "@/components/admin/ConfirmModal";

const ALL_CITIES = MOROCCO_CITIES_RAW.map((c) => ({ name: c.name, region: c.region_name }));
const REGIONS = [...new Set(ALL_CITIES.map((c) => c.region))].sort((a, b) => a.localeCompare(b));

const PHONE_RE = /^(?:\+212|00212|0)[5-7]\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validate(formData) {
  const errors = {};
  if (!formData.name?.trim()) errors.name = "Le nom est requis.";
  if (!formData.categoryId) errors.categoryId = "Choisissez une catégorie.";
  if (!formData.region) errors.region = "Choisissez une région.";
  if (!formData.city) errors.city = "Choisissez une ville.";
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
  if (!formData.latitude || !formData.longitude) {
    errors.location = "Merci de définir la position (lien Google Maps ou clic sur la carte).";
  }
  return errors;
}

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="7" /><path d="M21 21l-6 -6" />
  </svg>
);
const IconFactory = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 21V9l4 3V9l4 3V9l4 3V5h4v16H4z" />
  </svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconUpload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" /><path d="m16 16-4-4-4 4" />
  </svg>
);
const IconStar = ({ filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
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
        error ? "border-red-300 focus:ring-red-200 bg-red-50" : "border-gray-200 focus:ring-[#A7D129]/20 focus:border-[#2D5016] bg-gray-50 focus:bg-white"
      }`}
    />
  );
}

function Select({ error, children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition bg-white ${
        error ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-[#A7D129]/20 focus:border-[#2D5016] bg-gray-50 focus:bg-white"
      }`}
    >
      {children}
    </select>
  );
}

// Tag-pill input for `attributes.secteurs` / `attributes.services`
function TagInput({ label, hint, values, onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  const removeTag = (i) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2 focus-within:border-[#2D5016] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#A7D129]/20 transition">
        {values.map((v, i) => (
          <span key={v + i} className="flex items-center gap-1 rounded-full bg-[#E8F5D0] px-2.5 py-1 text-xs font-medium text-[#2D5016]">
            {v}
            <button type="button" onClick={() => removeTag(i)} className="text-[#2D5016]/60 hover:text-[#2D5016]">
              <IconX />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={values.length ? "" : placeholder}
          className="flex-1 min-w-[100px] bg-transparent text-sm outline-none py-0.5"
        />
      </div>
    </Field>
  );
}

const emptyForm = () => ({
  name: "",
  categoryId: "",
  description: "",
  city: "",
  neighborhood: "",
  region: "",
  location: "",
  contactPhone: "",
  contactEmail: "",
  latitude: "",
  longitude: "",
  mapUrl: "",
  isActive: true,
  isFeatured: false,
  attributes: { secteurs: [], services: [] },
  images: [],
});

export default function AdminIndustrielZonesPage() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [listings, setListings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeStatus, setActiveStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const sessionUploadsRef = useRef([]); // uploads made THIS form session, not yet saved
  const [mapUrlError, setMapUrlError] = useState("");

  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function extractLatLngFromGoogleMapsUrl(url) {
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
    ];
    for (const re of patterns) {
      const match = url.match(re);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return null;
  }

    const citiesInRegion = formData.region
    ? ALL_CITIES.filter((c) => c.region === formData.region).map((c) => c.name).sort((a, b) => a.localeCompare(b))
    : [];

  const handleRegionSelect = (region) => {
    setFormData((prev) => ({
      ...prev,
      region: region || "",
      city: "", // reset city when region changes
    }));
  };

  const handleCitySelect = (city) => {
    setFormData((prev) => ({
      ...prev,
      city: city || "",
    }));
  };

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
      setMapUrlError("Impossible d'extraire les coordonnées. Merci de pointer l'emplacement directement sur la carte ci-dessous.");
    }
  };

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const cats = await getAdminCategories("espaces-pro", token);
      setCategories(cats);

      const response = await industrielZonesService.getAll({
        search,
        categorySlug: activeCategory,
        isActive: activeStatus,
        page,
        limit: 12,
      });

      setListings(response.data || []);
      setPagination(response.pagination || { page: 1, totalPages: 1, total: response.data?.length || 0 });
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, activeStatus, page, token, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggleActive = async (item) => {
    setActionLoading(item.id);
    try {
      await industrielZonesService.update(item.id, { isActive: !item.isActive });
      toast.success("Statut mis à jour avec succès.");
      await loadData();
    } catch (e) {
      toast.error("Impossible de modifier le statut.");
    } finally {
      setActionLoading(null);
    }
  };

    const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await industrielZonesService.delete(deleteItemId);
      toast.success("Espace supprimé avec succès.");
      await loadData();
    } catch (e) {
      toast.error("Erreur lors de la suppression.");
    } finally {
      setDeleteLoading(false);
      setDeleteItemId(null);
    }
  };

  const handleOpenCreate = () => {
    sessionUploadsRef.current = [];
    setEditId(null);
    setErrors({});
    setFormData({ ...emptyForm(), categoryId: categories[0]?.id || "", city: "Kenitra" });
    setFormOpen(true);
  };

  const handleOpenEdit = (item) => {
    sessionUploadsRef.current = [];
    setEditId(item.id);
    setErrors({});
    setFormData({
      name: item.name || "",
      categoryId: item.categoryId || "",
      description: item.description || "",
      city: item.city || "",
      neighborhood: item.neighborhood || "",
      region: item.region || "",
      location: item.location || "",
      contactPhone: item.contactPhone || "",
      contactEmail: item.contactEmail || "",
      latitude: item.latitude ? String(item.latitude) : "",
      longitude: item.longitude ? String(item.longitude) : "",
      mapUrl: item.mapUrl || "",
      isActive: item.isActive,
      isFeatured: item.isFeatured,
      attributes: {
        secteurs: item.attributes?.secteurs || [],
        services: item.attributes?.services || [],
      },
      images: item.images || [],
    });
    setFormOpen(true);
  };

  const handleImageFilePick = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 10) {
      toast.error("Maximum 10 photos par espace.");
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

  const handleSetCover = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({ ...img, isCover: i === index })),
    }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const images = prev.images.filter((_, i) => i !== index);
      if (images.length && !images.some((i) => i.isCover)) images[0].isCover = true;
      return { ...prev, images };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validate(formData);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      toast.error("Veuillez corriger les champs en rouge.");
      return;
    }

    const payload = {
      ...formData,
      latitude: formData.latitude !== "" ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude !== "" ? parseFloat(formData.longitude) : null,
      mapUrl: formData.mapUrl?.trim() || null,
    };

    setSubmitting(true);
    try {
      if (editId) {
        await industrielZonesService.update(editId, payload);
        toast.success("Espace mis à jour avec succès.");
      } else {
        await industrielZonesService.create(payload);
        toast.success("Espace créé avec succès.");
      }
      sessionUploadsRef.current = [];
      setFormOpen(false);
      await loadData();
    } catch (err) {
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
            <IconFactory />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Espaces Industriels & Pro</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Gérez les zones industrielles, zones franches et chambres de commerce
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2D5016] hover:bg-[#1e3a0f] transition-all shadow-sm"
        >
          <IconPlus /> Ajouter un espace
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
            <option key={c.id} value={c.slug}>{c.name}</option>
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
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">Chargement en cours...</td></tr>
              ) : listings.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-400">Aucun résultat.</td></tr>
              ) : (
                listings.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setViewItem(item)}
                    className="cursor-pointer hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {item.images?.[0]?.url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.images[0].url} alt="" className="h-8 w-8 rounded-lg object-cover" />
                        )}
                        <span>{item.name}</span>
                        {item.isFeatured && (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-amber-500 rounded-full">★ Recommandé</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        {item.category?.name || item.category || item.categoryId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.city || "-"} {item.neighborhood ? `(${item.neighborhood})` : ""}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(item); }}
                        disabled={actionLoading === item.id}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          item.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {item.isActive ? "Actif" : "Désactivé"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#2D5016] hover:bg-[#A7D129]/10 transition-all"
                        title="Modifier"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteItemId(item.id); }}
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

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
            <span className="text-xs text-gray-400">Total : {pagination.total}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-50">Précédent</button>
              <button disabled={page === pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 text-xs border rounded-lg hover:bg-gray-50 disabled:opacity-50">Suivant</button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-base font-bold text-gray-900">{viewItem.name}</h2>
              <button onClick={() => setViewItem(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {viewItem.images?.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={viewItem.images.find((i) => i.isCover)?.url || viewItem.images[0].url} alt="" className="h-64 w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">Aucune photo</div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-semibold text-gray-600">
                  {viewItem.category?.name || viewItem.category}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${viewItem.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {viewItem.isActive ? "Actif" : "Désactivé"}
                </span>
                {viewItem.isFeatured && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">★ Recommandé</span>
                )}
              </div>

              {viewItem.description && (
                <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-line">{viewItem.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ville / Quartier</p>
                  <p className="mt-0.5 text-gray-800">{viewItem.city || "-"} {viewItem.neighborhood ? `(${viewItem.neighborhood})` : ""}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Téléphone</p>
                  <p className="mt-0.5 text-gray-800">{viewItem.contactPhone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Email</p>
                  <p className="mt-0.5 text-gray-800">{viewItem.contactEmail || "—"}</p>
                </div>
              </div>

              {viewItem.attributes?.secteurs?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Secteurs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewItem.attributes.secteurs.map((s, i) => (
                      <span key={s + i} className="px-2.5 py-1 bg-[#E8F5D0] text-[#2D5016] rounded-full text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewItem.attributes?.services?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewItem.attributes.services.map((s, i) => (
                      <span key={s + i} className="px-2.5 py-1 bg-[#FF8C42]/10 text-[#FF8C42] rounded-full text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {viewItem.latitude != null && viewItem.longitude != null && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
                    <MapPin size={13} /> Emplacement
                  </p>
                  <TourismDetailMap
                    listing={viewItem}
                    className="h-48 rounded-xl overflow-hidden border border-gray-200"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-gray-400">
                {viewItem.viewsCount != null && <span>{viewItem.viewsCount} vues</span>}
                {viewItem.createdAt && <span>Créé le {new Date(viewItem.createdAt).toLocaleDateString("fr-FR")}</span>}
              </div>

              <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-4 text-xs text-gray-400">
                {viewItem.viewsCount != null && <span>{viewItem.viewsCount} vues</span>}
                {viewItem.createdAt && <span>Créé le {new Date(viewItem.createdAt).toLocaleDateString("fr-FR")}</span>}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setViewItem(null)} className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition">Fermer</button>
              <button
                onClick={() => { const item = viewItem; setViewItem(null); handleOpenEdit(item); }}
                className="px-5 py-2.5 bg-[#2D5016] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a0f] transition shadow-xs"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-base font-bold text-gray-900">{editId ? "Modifier l'espace" : "Créer un espace"}</h2>
              <button onClick={handleCancelForm} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#2D5016] uppercase tracking-wide border-b pb-1 border-gray-100">Informations Générales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Nom" required error={errors.name}>
                    <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} />
                  </Field>
                  <Field label="Catégorie" required error={errors.categoryId}>
                    <Select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} error={errors.categoryId}>
                      <option value="">— Choisir —</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </Field>
                </div>
                <Field label="Description / Présentation">
                  <textarea
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 transition border-gray-200 focus:ring-[#A7D129]/20 focus:border-[#2D5016] bg-gray-50 focus:bg-white resize-none"
                  />
                </Field>
              </div>

                            <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#2D5016] uppercase tracking-wide border-b pb-1 border-gray-100">Adresse & Position</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Région" required error={errors.region}>
                    <SearchableDropdown
                      label="Région"
                      icon={MapPin}
                      value={formData.region}
                      options={REGIONS}
                      onSelect={handleRegionSelect}
                      emptyLabel="— Choisir —"
                      placeholder="Tapez pour chercher une région..."
                      width="w-full"
                    />
                  </Field>
                  <Field label="Ville" required error={errors.city}>
                    <SearchableDropdown
                      label="Ville"
                      icon={MapPin}
                      value={formData.city}
                      options={citiesInRegion}
                      onSelect={handleCitySelect}
                      emptyLabel="— Choisir —"
                      placeholder={formData.region ? "Tapez pour chercher une ville..." : "Sélectionnez d'abord une région"}
                      disabled={!formData.region}
                      width="w-full"
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
                  onChange={(lat, lng) => setFormData((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }))}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#2D5016] uppercase tracking-wide border-b pb-1 border-gray-100">Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Téléphone" error={errors.contactPhone}>
                    <Input type="text" value={formData.contactPhone} onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })} error={errors.contactPhone} />
                  </Field>
                  <Field label="Email" error={errors.contactEmail}>
                    <Input type="email" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} error={errors.contactEmail} />
                  </Field>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#2D5016] uppercase tracking-wide border-b pb-1 border-gray-100">Photos</h3>
                <div className="flex flex-wrap gap-3">
                  {formData.images.map((img, i) => (
                    <div key={img.url + i} className="relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => handleSetCover(i)} title={img.isCover ? "Photo de couverture" : "Définir comme couverture"}
                        className={`absolute left-1 top-1 rounded-full p-1 ${img.isCover ? "bg-amber-400 text-white" : "bg-white/80 text-gray-400 hover:text-amber-500"}`}>
                        <IconStar filled={img.isCover} />
                      </button>
                      <button type="button" onClick={() => handleRemoveImage(i)} className="absolute right-1 top-1 rounded-full bg-white/80 p-1 text-gray-500 hover:text-red-600" title="Supprimer">
                        <IconTrash />
                      </button>
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-[#2D5016] hover:text-[#2D5016] transition-colors">
                    {uploadingImage ? <span className="text-xs">Envoi...</span> : (<><IconUpload /><span className="text-[10px] font-medium">Ajouter</span></>)}
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
                <p className="text-xs text-gray-400">L'étoile marque la photo de couverture affichée dans les listes.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-[#2D5016] uppercase tracking-wide border-b pb-1 border-gray-100">Secteurs & Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TagInput
                    label="Secteurs d'activité"
                    hint="Entrée ou virgule pour ajouter"
                    placeholder="Ex: Automobile"
                    values={formData.attributes.secteurs}
                    onChange={(secteurs) => setFormData({ ...formData, attributes: { ...formData.attributes, secteurs } })}
                  />
                  <TagInput
                    label="Services proposés"
                    hint="Entrée ou virgule pour ajouter"
                    placeholder="Ex: Domiciliation"
                    values={formData.attributes.services}
                    onChange={(services) => setFormData({ ...formData, attributes: { ...formData.attributes, services } })}
                  />
                </div>
              </div>

              <div className="flex gap-6 border-t pt-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#2D5016] focus:ring-[#A7D129]/20" />
                  Publier l'annonce
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-[#2D5016] focus:ring-[#A7D129]/20" />
                  Recommandé / En vedette
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={handleCancelForm} className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition">Annuler</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-[#2D5016] text-white text-sm font-semibold rounded-xl hover:bg-[#1e3a0f] transition shadow-xs disabled:opacity-60">
                  {submitting ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteItemId && (
        <ConfirmModal
          title="Supprimer l'espace"
          description="Êtes-vous sûr de vouloir supprimer cet espace ? Cette action est irréversible."
          confirmLabel="Supprimer"
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteItemId(null)}
        />
      )}
    </div>
  );
}