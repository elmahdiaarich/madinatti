"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Edit, FileSpreadsheet, Plus, Search, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  EDUCATION_SECTORS,
  EDUCATION_TYPES,
  MOROCCO_CITIES,
  MOROCCO_REGIONS,
} from "@/constants/educationConstants";
import { categoriesService } from "@/services/categoriesService";
import { educationService } from "@/services/educationService";
import { uploadService } from "@/services/uploadService";

const emptyForm = () => ({
  name: "",
  nameAr: "",
  nameFr: "",
  nameEn: "",
  institutionType: "PRIMARY_SCHOOL",
  sector: "PUBLIC",
  categoryId: "",
  description: "",
  descriptionAr: "",
  descriptionFr: "",
  descriptionEn: "",
  region: "",
  province: "",
  city: "",
  address: "",
  postalCode: "",
  latitude: "",
  longitude: "",
  phone: "",
  secondaryPhone: "",
  email: "",
  website: "",
  facebookUrl: "",
  instagramUrl: "",
  linkedinUrl: "",
  logoUrl: "",
  coverImageUrl: "",
  openingHoursText: "",
  metadataText: "",
  isPublished: true,
  isVerified: false,
  isFeatured: false,
  source: "",
  sourceUrl: "",
  externalId: "",
});

function hydrateForm(item) {
  return {
    ...emptyForm(),
    ...item,
    categoryId: item.categoryId || "",
    latitude: item.latitude ?? "",
    longitude: item.longitude ?? "",
    openingHoursText: item.openingHours ? JSON.stringify(item.openingHours, null, 2) : "",
    metadataText: item.metadata ? JSON.stringify(item.metadata, null, 2) : "",
  };
}

function parseJsonField(value) {
  if (!value.trim()) return null;
  return JSON.parse(value);
}

function parseMetadataText(value) {
  try {
    const parsed = parseJsonField(value || "");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function metadataTextValue(value, key) {
  const metadata = parseMetadataText(value);
  const item = metadata[key];
  if (item === null || item === undefined || typeof item === "object") return "";
  return String(item);
}

function setMetadataTextValue(value, key, nextValue) {
  const metadata = parseMetadataText(value);
  const trimmed = String(nextValue || "").trim();
  if (trimmed) metadata[key] = trimmed;
  else delete metadata[key];
  return JSON.stringify(metadata, null, 2);
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Nom requis.";
  if (!form.institutionType) errors.institutionType = "Type requis.";
  if (!form.sector) errors.sector = "Secteur requis.";
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email invalide.";
  if (form.latitude !== "" && (Number(form.latitude) < -90 || Number(form.latitude) > 90)) errors.latitude = "Latitude invalide.";
  if (form.longitude !== "" && (Number(form.longitude) < -180 || Number(form.longitude) > 180)) errors.longitude = "Longitude invalide.";
  try {
    parseJsonField(form.openingHoursText);
  } catch {
    errors.openingHoursText = "JSON invalide.";
  }
  try {
    parseJsonField(form.metadataText);
  } catch {
    errors.metadataText = "JSON invalide.";
  }
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

function sectionTitle(label) {
  return <h3 className="md:col-span-2 border-t border-gray-100 pt-4 text-sm font-bold uppercase text-gray-400">{label}</h3>;
}

export default function AdminEducationPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const importInputRef = useRef(null);

  const [institutions, setInstitutions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [sector, setSector] = useState("");
  const [published, setPublished] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [importing, setImporting] = useState(false);

  const provinces = useMemo(
    () => MOROCCO_REGIONS.find((region) => region.name === form.region)?.provinces || [],
    [form.region],
  );
  const cities = useMemo(
    () => provinces.find((province) => province.name === form.province)?.cities || MOROCCO_CITIES,
    [form.province, provinces],
  );

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [listResponse, categoriesResponse] = await Promise.all([
        educationService.adminList({
          search,
          type,
          sector,
          published,
          page,
          limit: 20,
          sort: "updatedAt",
          order: "desc",
        }),
        categoriesService.getByModule("education"),
      ]);
      setInstitutions(listResponse.data || []);
      setPagination(listResponse.pagination || { page: 1, totalPages: 1, total: 0 });
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du chargement Education.");
    } finally {
      setLoading(false);
    }
  }, [page, published, search, sector, token, toast, type]);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm((prev) => ({ ...emptyForm(), categoryId: categories[0]?.id || prev.categoryId || "" }));
    setErrors({});
    setFormOpen(true);
  };

  const openEdit = (institution) => {
    setEditId(institution.id);
    setForm(hydrateForm(institution));
    setErrors({});
    setFormOpen(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      ...form,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      openingHours: parseJsonField(form.openingHoursText),
      metadata: parseJsonField(form.metadataText),
    };
    delete payload.openingHoursText;
    delete payload.metadataText;

    setSaving(true);
    try {
      if (editId) await educationService.updateInstitution(editId, payload);
      else await educationService.createInstitution(payload);
      toast.success(editId ? "Etablissement modifie." : "Etablissement cree.");
      setFormOpen(false);
      await load();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (institution) => {
    if (!confirm(`Supprimer "${institution.name}" ?`)) return;
    try {
      await educationService.deleteInstitution(institution.id);
      toast.success("Etablissement supprime.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Suppression impossible.");
    }
  };

  const duplicate = (institution) => {
    const next = hydrateForm(institution);
    next.name = `${next.name} - copie`;
    next.externalId = "";
    setEditId(null);
    setForm(next);
    setErrors({});
    setFormOpen(true);
  };

  const togglePublish = async (institution) => {
    try {
      await educationService.publishInstitution(institution.id, !institution.isPublished);
      toast.success(institution.isPublished ? "Etablissement depublie." : "Etablissement publie.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Publication impossible.");
    }
  };

  const uploadImage = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(field);
    try {
      const result = await uploadService.uploadImage(file, token);
      setForm((prev) => ({ ...prev, [field]: result.url }));
    } catch (error) {
      console.error(error);
      toast.error("Upload image impossible.");
    } finally {
      setUploading("");
      if (field === "logoUrl" && logoInputRef.current) logoInputRef.current.value = "";
      if (field === "coverImageUrl" && coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const response = await educationService.importFile(file);
      const stats = response.data;
      toast.success(`Import termine: ${stats.created} cree(s), ${stats.updated} modifie(s), ${stats.ignored} ignore(s), ${stats.failed} erreur(s).`);
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
    const response = await fetch(educationService.templateUrl(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-import-education.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion Education</h1>
          <p className="text-sm text-gray-400">Etablissements, publication, medias et import CSV / Excel / JSON.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#2D5016]">
            <Download size={16} /> Modele CSV
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#2D5016]">
            <FileSpreadsheet size={16} /> {importing ? "Import..." : "Importer"}
            <input ref={importInputRef} type="file" accept=".csv,.xls,.xlsx,.json" className="hidden" onChange={importFile} />
          </label>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#2D5016] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e3a0f]">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm lg:grid-cols-[1fr_180px_150px_140px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Rechercher nom, ville, region..." className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-[#2D5016]" />
        </div>
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-[#2D5016]">
          <option value="">Tous types</option>
          {EDUCATION_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select value={sector} onChange={(e) => { setSector(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-[#2D5016]">
          <option value="">Tous secteurs</option>
          {EDUCATION_SECTORS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select value={published} onChange={(e) => { setPublished(e.target.value); setPage(1); }} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-[#2D5016]">
          <option value="">Tous statuts</option>
          <option value="true">Publie</option>
          <option value="false">Brouillon</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-5 py-3">Nom</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Secteur</th>
              <th className="px-5 py-3">Ville / Region</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Source</th>
              <th className="px-5 py-3">Maj</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="8" className="px-5 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : institutions.length === 0 ? (
              <tr><td colSpan="8" className="px-5 py-8 text-center text-gray-400">Aucun etablissement.</td></tr>
            ) : institutions.map((institution) => (
              <tr key={institution.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-semibold text-gray-900">{institution.name}</td>
                <td className="px-5 py-3">{EDUCATION_TYPES.find((item) => item.value === institution.institutionType)?.label || institution.institutionType}</td>
                <td className="px-5 py-3">{EDUCATION_SECTORS.find((item) => item.value === institution.sector)?.label || institution.sector}</td>
                <td className="px-5 py-3">{institution.city || "-"} / {institution.region || "-"}</td>
                <td className="px-5 py-3">
                  <button onClick={() => togglePublish(institution)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${institution.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {institution.isPublished ? "Publie" : "Brouillon"}
                  </button>
                  {institution.isVerified && <span className="ml-2 rounded-full bg-[#E8F5D0] px-2 py-1 text-xs font-semibold text-[#2D5016]">Verifie</span>}
                </td>
                <td className="px-5 py-3">{institution.source || "-"}</td>
                <td className="px-5 py-3">{institution.updatedAt ? new Date(institution.updatedAt).toLocaleDateString("fr-FR") : "-"}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(institution)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-[#2D5016]" title="Modifier"><Edit size={15} /></button>
                    <button onClick={() => duplicate(institution)} className="rounded-lg border border-gray-200 px-2 text-xs font-semibold text-gray-500 hover:text-[#2D5016]" title="Dupliquer">Copie</button>
                    <button onClick={() => remove(institution)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-red-600" title="Supprimer"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Precedent</button>
            <span className="text-sm text-gray-500">{page} / {pagination.totalPages}</span>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Suivant</button>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submit} className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-bold text-gray-900">{editId ? "Modifier l'etablissement" : "Creer un etablissement"}</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="text-xl text-gray-400 hover:text-gray-700">x</button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              {sectionTitle("Informations generales")}
              <Field label="Nom" required error={errors.name}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="Categorie"><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm"><option value="">Education</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}</select></Field>
              <Field label="Nom arabe"><input value={form.nameAr || ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="Nom francais"><input value={form.nameFr || ""} onChange={(e) => setForm({ ...form, nameFr: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="Type" required error={errors.institutionType}><select value={form.institutionType} onChange={(e) => setForm({ ...form, institutionType: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">{EDUCATION_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
              <Field label="Secteur" required error={errors.sector}><select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">{EDUCATION_SECTORS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field>
              <div className="md:col-span-2"><Field label="Description"><textarea rows={3} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" /></Field></div>

              {sectionTitle("Localisation")}
              <Field label="Region"><select value={form.region || ""} onChange={(e) => setForm({ ...form, region: e.target.value, province: "", city: "" })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm"><option value="">Region</option>{MOROCCO_REGIONS.map((region) => <option key={region.name} value={region.name}>{region.name}</option>)}</select></Field>
              <Field label="Province / Prefecture"><select value={form.province || ""} onChange={(e) => setForm({ ...form, province: e.target.value, city: "" })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm"><option value="">Province</option>{provinces.map((province) => <option key={province.name} value={province.name}>{province.name}</option>)}</select></Field>
              <Field label="Ville"><select value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm"><option value="">Ville</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select></Field>
              <Field label="Code postal"><input value={form.postalCode || ""} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <div className="md:col-span-2"><Field label="Adresse"><input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm" /></Field></div>
              <Field label="Latitude" error={errors.latitude}><input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="Longitude" error={errors.longitude}><input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>

              {sectionTitle("Contact")}
              <Field label="Telephone"><input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="Telephone secondaire"><input value={form.secondaryPhone || ""} onChange={(e) => setForm({ ...form, secondaryPhone: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="Email" error={errors.email}><input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="Site web"><input value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="Facebook"><input value={form.facebookUrl || ""} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="Instagram"><input value={form.instagramUrl || ""} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="LinkedIn"><input value={form.linkedinUrl || ""} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>

              {sectionTitle("Details publics")}
              <Field label="Niveau affiche">
                <input
                  value={metadataTextValue(form.metadataText, "level")}
                  onChange={(e) => setForm((prev) => ({ ...prev, metadataText: setMetadataTextValue(prev.metadataText, "level", e.target.value) }))}
                  className="h-11 rounded-xl border border-gray-200 px-3 text-sm"
                />
              </Field>
              <Field label="Source contact">
                <input
                  value={metadataTextValue(form.metadataText, "contactSource")}
                  onChange={(e) => setForm((prev) => ({ ...prev, metadataText: setMetadataTextValue(prev.metadataText, "contactSource", e.target.value) }))}
                  className="h-11 rounded-xl border border-gray-200 px-3 text-sm"
                />
              </Field>
              <Field label="Commune originale">
                <input
                  value={metadataTextValue(form.metadataText, "originalCommune")}
                  onChange={(e) => setForm((prev) => ({ ...prev, metadataText: setMetadataTextValue(prev.metadataText, "originalCommune", e.target.value) }))}
                  className="h-11 rounded-xl border border-gray-200 px-3 text-sm"
                />
              </Field>

              {sectionTitle("Medias")}
              <Field label="Logo">
                <div className="flex gap-2">
                  <input value={form.logoUrl || ""} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 px-3 text-sm" />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600"><Upload size={15} /> {uploading === "logoUrl" ? "..." : "Upload"}<input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, "logoUrl")} /></label>
                </div>
              </Field>
              <Field label="Photo principale">
                <div className="flex gap-2">
                  <input value={form.coverImageUrl || ""} onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })} className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 px-3 text-sm" />
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600"><Upload size={15} /> {uploading === "coverImageUrl" ? "..." : "Upload"}<input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => uploadImage(e, "coverImageUrl")} /></label>
                </div>
              </Field>

              {sectionTitle("Publication et source")}
              <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Publie</label>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm"><input type="checkbox" checked={form.isVerified} onChange={(e) => setForm({ ...form, isVerified: e.target.checked })} /> Verifie</label>
              <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Mis en avant</label>
              <Field label="Source"><input value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="URL source"><input value={form.sourceUrl || ""} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <Field label="Identifiant externe"><input value={form.externalId || ""} onChange={(e) => setForm({ ...form, externalId: e.target.value })} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" /></Field>
              <div className="md:col-span-2"><Field label="Horaires JSON" error={errors.openingHoursText}><textarea rows={3} value={form.openingHoursText} onChange={(e) => setForm({ ...form, openingHoursText: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs" /></Field></div>
              <div className="md:col-span-2"><Field label="Metadata JSON" error={errors.metadataText}><textarea rows={4} value={form.metadataText} onChange={(e) => setForm({ ...form, metadataText: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3 py-2 font-mono text-xs" placeholder='{"niveaux":["Primaire"],"transport":true}' /></Field></div>
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
