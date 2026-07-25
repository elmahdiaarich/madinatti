"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Edit, FileSpreadsheet, Plus, Search, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { HEALTH_SUBCATEGORIES, MOROCCO_CITIES } from "@/constants/healthCategories";
import { healthService } from "@/services/healthService";
import { uploadService } from "@/services/uploadService";

const HEALTH_TYPES = [
  { value: "hospital-clinic", label: "Clinique" },
  { value: "doctor-office", label: "Médecine" },
  { value: "pharmacy", label: "Pharmacie" },
  { value: "parapharmacy", label: "Para" },
  { value: "medical-laboratory", label: "Laboratoires" },
  { value: "dentist", label: "Dentistes" },
  { value: "radiology-center", label: "Radiologie" },
];

const HEALTH_STATUSES = [
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Publiee" },
  { value: "REJECTED", label: "Rejetee" },
  { value: "SUSPENDED", label: "Suspendue" },
  { value: "ARCHIVED", label: "Archivee" },
];

const emptyForm = () => ({
  name: "",
  subcategory: "hospital-clinic",
  status: "APPROVED",
  city: "Kenitra",
  neighborhood: "",
  address: "",
  phone: "",
  contactEmail: "",
  website: "",
  description: "",
  hourType: "continuous",
  open1: "",
  close1: "",
  open2: "",
  close2: "",
  latitude: "",
  longitude: "",
  images: [],
});

function buildRegularHours(form) {
  const slots = [];
  if (form.open1 && form.close1) slots.push({ open: form.open1, close: form.close1 });
  if (form.open2 && form.close2) slots.push({ open: form.open2, close: form.close2 });
  return {
    type: form.hourType,
    slots,
    weekdayDescriptions: slots.length
      ? [`${form.hourType === "continuous" ? "Horaire continu" : "Horaire normal"}: ${slots.map((s) => `${s.open}-${s.close}`).join(" / ")}`]
      : [],
  };
}

function hydrateForm(place) {
  const slots = place.regularHours?.slots || [];
  return {
    ...emptyForm(),
    name: place.name || "",
    subcategory: place.subcategory || "hospital-clinic",
    status: place.status || "APPROVED",
    city: place.city || "Kenitra",
    neighborhood: place.neighborhood || "",
    address: place.address || "",
    phone: place.phones?.[0] || "",
    contactEmail: place.contactEmail || "",
    website: place.website || "",
    description: place.description || "",
    hourType: place.regularHours?.type || "continuous",
    open1: slots[0]?.open || "",
    close1: slots[0]?.close || "",
    open2: slots[1]?.open || "",
    close2: slots[1]?.close || "",
    latitude: place.latitude || "",
    longitude: place.longitude || "",
    images: place.images || [],
  };
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Nom requis.";
  if (!form.subcategory) errors.subcategory = "Type requis.";
  if (!form.neighborhood.trim()) errors.neighborhood = "Quartier requis.";
  if (!form.phone.trim()) errors.phone = "Contact requis.";
  if (!form.open1 || !form.close1) errors.hours = "Premier créneau requis.";
  return errors;
}

function Field({ label, required, error, children }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

export default function AdminHealthPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const [places, setPlaces] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await healthService.adminList({
        search,
        subcategory,
        page,
        limit: 20,
        status: "all",
      });
      setPlaces(response.data || []);
      setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement Santé.");
    } finally {
      setLoading(false);
    }
  }, [page, search, subcategory, token, toast]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (place) => {
    setEditId(place.id);
    setForm(hydrateForm(place));
    setErrors({});
    setFormOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      name: form.name,
      subcategory: form.subcategory,
      city: form.city,
      neighborhood: form.neighborhood,
      address: form.address || [form.neighborhood, form.city].filter(Boolean).join(", "),
      phone: form.phone,
      contactEmail: form.contactEmail || null,
      website: form.website || null,
      description: form.description || null,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      images: form.images,
      regularHours: buildRegularHours(form),
      status: form.status,
    };

    setSaving(true);
    try {
      if (editId) await healthService.updatePlace(editId, payload);
      else await healthService.createPlace(payload);
      toast.success(editId ? "Fiche Santé modifiée." : "Fiche Santé créée.");
      setFormOpen(false);
      await load();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (place) => {
    if (!confirm(`Supprimer "${place.name}" ?`)) return;
    try {
      await healthService.deletePlace(place.id);
      toast.success("Fiche supprimée.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Suppression impossible.");
    }
  };

  const uploadPhotos = async (event) => {
    const files = [...(event.target.files || [])].slice(0, 10 - form.images.length);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const result = await uploadService.uploadImage(file, token);
        uploaded.push({ url: result.url, isCover: form.images.length === 0 && uploaded.length === 0 });
      }
      setForm((prev) => ({ ...prev, images: [...prev.images, ...uploaded].slice(0, 10) }));
    } catch (error) {
      console.error(error);
      toast.error("Upload photo impossible.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const response = await healthService.importFile(file);
      const stats = response.data;
      toast.success(`Import terminé: ${stats.created} créé(s), ${stats.updated} modifié(s), ${stats.failed} erreur(s).`);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Import impossible.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const downloadTemplate = async () => {
    const response = await fetch(healthService.templateUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-import-sante.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion Santé</h1>
          <p className="text-sm text-gray-400">CRUD, photos et import CSV / Excel des fiches Santé.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#2D5016]">
            <Download size={16} /> Modèle CSV
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#2D5016]">
            <FileSpreadsheet size={16} /> {importing ? "Import..." : "Importer"}
            <input ref={importInputRef} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={importFile} />
          </label>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#2D5016] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3a0f]">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher nom, quartier, ville..." className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-[#2D5016]" />
        </div>
        <select value={subcategory} onChange={(e) => { setSubcategory(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-[#2D5016]">
          <option value="">Tous types</option>
          {HEALTH_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-5 py-3">Nom</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Quartier / Ville</th>
              <th className="px-5 py-3">Contact</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : places.length === 0 ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400">Aucune fiche Sante.</td></tr>
            ) : places.map((place) => (
              <tr key={place.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-semibold text-gray-900">{place.name}</td>
                <td className="px-5 py-3">{HEALTH_SUBCATEGORIES.find((c) => c.slug === place.subcategory)?.label || place.subcategory}</td>
                <td className="px-5 py-3">{HEALTH_STATUSES.find((status) => status.value === place.status)?.label || place.status || "-"}</td>
                <td className="px-5 py-3">{place.neighborhood || "-"} / {place.city || "-"}</td>
                <td className="px-5 py-3">{place.phones?.[0] || "-"}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(place)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-[#2D5016]"><Edit size={15} /></button>
                    <button onClick={() => remove(place)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Précédent</button>
            <span className="text-sm text-gray-500">{page} / {pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Suivant</button>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-bold text-gray-900">{editId ? "Modifier la fiche Santé" : "Créer une fiche Santé"}</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="text-xl text-gray-400 hover:text-gray-700">×</button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <Field label="Santé" required error={errors.subcategory}>
                <select value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">
                  {HEALTH_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </Field>
              <Field label="Statut" required>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">
                  {HEALTH_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
              </Field>
              <Field label="Nom" required error={errors.name}>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Ville" required>
                <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">
                  {MOROCCO_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </Field>
              <Field label="Quartier" required error={errors.neighborhood}>
                <input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Contact" required error={errors.phone}>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Site web">
                <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Adresse">
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Email">
                <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Quel type d’horaire avez-vous ?" required>
                <div className="flex h-11 items-center gap-4 rounded-xl border border-gray-200 px-3 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" checked={form.hourType === "continuous"} onChange={() => setForm({ ...form, hourType: "continuous" })} /> Horaire continu</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={form.hourType === "normal"} onChange={() => setForm({ ...form, hourType: "normal" })} /> Horaire normal</label>
                </div>
              </Field>
              <div />
              <Field label="Heure d'ouverture" required error={errors.hours}>
                <input type="time" value={form.open1} onChange={(e) => setForm({ ...form, open1: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Heure de fermeture" required>
                <input type="time" value={form.close1} onChange={(e) => setForm({ ...form, close1: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Heure d'ouverture">
                <input type="time" value={form.open2} onChange={(e) => setForm({ ...form, open2: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Heure de fermeture">
                <input type="time" value={form.close2} onChange={(e) => setForm({ ...form, close2: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Latitude">
                <input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <Field label="Longitude">
                <input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                </Field>
              </div>
              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-700">Photo(s)</p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:border-[#2D5016]">
                    <Upload size={15} /> {uploading ? "Upload..." : "Ajouter"}
                    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={uploadPhotos} disabled={uploading || form.images.length >= 10} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {form.images.map((img, index) => (
                    <div key={img.url + index} className="relative aspect-square overflow-hidden rounded-xl border border-gray-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))} className="absolute right-1 top-1 rounded-full bg-white/90 px-2 text-sm text-red-600">×</button>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-400">Upload jusqu’à 10 fichiers. Max 100 MB par fichier.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700">Annuler</button>
              <button disabled={saving} className="rounded-xl bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
