"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MapPicker from "@/components/shared/MapPicker";
import { useAuth } from "@/context/AuthContext";
import { eventsService } from "@/services/eventsService";
import { uploadService } from "@/services/uploadService";
import { EVENT_MODES, EVENT_STATUSES, RECURRENCE_TYPES } from "@/constants/eventCategories";

const emptyForm = () => ({
  title: "",
  titleAr: "",
  shortDescription: "",
  description: "",
  categoryId: "",
  customSubsubcategory: "",
  eventFieldValues: {},
  organizerName: "",
  organizerPhone: "",
  organizerEmail: "",
  websiteUrl: "",
  eventMode: "IN_PERSON",
  venueName: "",
  address: "",
  city: "Kenitra",
  province: "",
  region: "",
  latitude: "",
  longitude: "",
  onlineUrl: "",
  startsAt: "",
  endsAt: "",
  doorsOpenAt: "",
  recurrenceType: "NONE",
  recurrenceRule: "",
  recurrenceEndsAt: "",
  isFree: true,
  priceMin: "",
  priceMax: "",
  ticketUrl: "",
  reservationRequired: false,
  capacity: "",
  ageRestriction: "",
  accessibilityInformation: "",
  mainImage: "",
  galleryText: "",
  status: "PENDING_REVIEW",
  featured: false,
  verified: false,
});

function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function hydrate(event) {
  return {
    ...emptyForm(),
    ...event,
    categoryId: event.categoryId || "",
    customSubsubcategory: event.customSubsubcategory || "",
    eventFieldValues: event.eventFieldValues || {},
    latitude: event.latitude ?? "",
    longitude: event.longitude ?? "",
    priceMin: event.priceMin ?? "",
    priceMax: event.priceMax ?? "",
    capacity: event.capacity ?? "",
    startsAt: toInputDate(event.startsAt),
    endsAt: toInputDate(event.endsAt),
    doorsOpenAt: toInputDate(event.doorsOpenAt),
    recurrenceEndsAt: toInputDate(event.recurrenceEndsAt),
    galleryText: Array.isArray(event.gallery) ? event.gallery.map((item) => item.url || item).join("\n") : "",
  };
}

function galleryUrlsFromText(value) {
  return String(value || "")
    .split(/\n+/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function imagesFromForm(form) {
  const main = form.mainImage?.trim();
  const gallery = galleryUrlsFromText(form.galleryText);
  return [
    ...(main ? [{ url: main, isCover: true }] : []),
    ...gallery
      .filter((url) => url !== main)
      .map((url) => ({ url, isCover: false })),
  ].slice(0, 10);
}

function formWithImages(form, images) {
  const normalized = images
    .map((image) => ({ url: image.url?.trim(), isCover: Boolean(image.isCover) }))
    .filter((image) => image.url)
    .slice(0, 10);

  if (normalized.length && !normalized.some((image) => image.isCover)) normalized[0].isCover = true;
  const cover = normalized.find((image) => image.isCover) || normalized[0];
  const others = normalized.filter((image) => image.url !== cover?.url);

  return {
    ...form,
    mainImage: cover?.url || "",
    galleryText: others.map((image) => image.url).join("\n"),
  };
}

function Field({ label, error, children }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-semibold text-gray-700">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

function recurrenceRuleFor(form) {
  if (form.recurrenceType === "NONE") return "";
  if (form.recurrenceType === "CUSTOM") return form.recurrenceRule;
  return `FREQ=${form.recurrenceType}`;
}

function DynamicField({ field, value, error, onChange }) {
  const commonClass = "h-11 rounded-xl border border-gray-200 px-3 text-sm";
  if (field.fieldType === "textarea") {
    return (
      <Field label={`${field.label}${field.required ? " *" : ""}`} error={error}>
        <textarea rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      </Field>
    );
  }
  if (field.fieldType === "select") {
    const options = Array.isArray(field.options) ? field.options : [];
    return (
      <Field label={`${field.label}${field.required ? " *" : ""}`} error={error}>
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={commonClass}>
          <option value="">Choisir</option>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </Field>
    );
  }
  if (field.fieldType === "checkbox") {
    return (
      <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        {field.label}
      </label>
    );
  }
  if (field.fieldType === "number") {
    return (
      <Field label={`${field.label}${field.required ? " *" : ""}`} error={error}>
        <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={commonClass} />
      </Field>
    );
  }
  if (field.fieldType === "date") {
    return (
      <Field label={`${field.label}${field.required ? " *" : ""}`} error={error}>
        <input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} className={commonClass} />
      </Field>
    );
  }
  return (
    <Field label={`${field.label}${field.required ? " *" : ""}`} error={error}>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} className={commonClass} />
    </Field>
  );
}

export default function EventForm({ event, admin = false }) {
  const router = useRouter();
  const { token } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(event ? hydrate(event) : emptyForm());
  const [categories, setCategories] = useState([]);
  const [categoryStep, setCategoryStep] = useState(admin && !event ? "select" : "form");
  const [categorySearch, setCategorySearch] = useState("");
  const [pendingCategoryId, setPendingCategoryId] = useState(event?.categoryId || "");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const images = imagesFromForm(form);
  const selectedCategory = categories.find((category) => category.id === form.categoryId) || null;
  const pendingCategory = categories.find((category) => category.id === pendingCategoryId) || null;
  const specificFields = selectedCategory?.formTemplate?.fields || [];
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(categorySearch.trim().toLowerCase()),
  );

  useEffect(() => {
    eventsService.categories().then((res) => {
      setCategories(res.data || []);
      if (!form.categoryId && !admin && res.data?.[0]?.id) {
        setForm((prev) => ({ ...prev, categoryId: res.data[0].id }));
        setPendingCategoryId(res.data[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateSpecific = (fieldName, value) => {
    setForm((prev) => ({
      ...prev,
      eventFieldValues: {
        ...(prev.eventFieldValues || {}),
        [fieldName]: value,
      },
    }));
  };

  const hasSpecificData = () => Object.values(form.eventFieldValues || {}).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== "" && value !== false;
  });

  const applyCategory = (categoryId) => {
    if (!categoryId || categoryId === form.categoryId) {
      setCategoryStep("form");
      return;
    }
    if (form.categoryId && hasSpecificData() && !confirm("Changer de sous-categorie supprimera les donnees specifiques deja saisies. Continuer ?")) {
      setPendingCategoryId(form.categoryId);
      return;
    }
    setForm((prev) => ({
      ...prev,
      categoryId,
      eventFieldValues: {},
    }));
    setPendingCategoryId(categoryId);
    setCategoryStep("form");
    setErrors((prev) => ({ ...prev, categoryId: undefined }));
  };

  const modifyCategory = () => {
    setPendingCategoryId(form.categoryId);
    setCategoryStep("select");
  };

  const setCover = (index) => {
    setForm((prev) => formWithImages(prev, imagesFromForm(prev).map((image, i) => ({ ...image, isCover: i === index }))));
  };

  const removeImage = (index) => {
    setForm((prev) => formWithImages(prev, imagesFromForm(prev).filter((_, i) => i !== index)));
  };

  const uploadImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (!token) {
      setErrors((prev) => ({ ...prev, images: "Connexion requise pour envoyer des photos." }));
      return;
    }
    if (images.length + files.length > 10) {
      setErrors((prev) => ({ ...prev, images: "Maximum 10 photos par evenement." }));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploadingImages(true);
    setErrors((prev) => ({ ...prev, images: undefined }));
    try {
      const uploaded = await Promise.all(files.map((file) => uploadService.uploadImage(file, token)));
      setForm((prev) => formWithImages(prev, [
        ...imagesFromForm(prev),
        ...uploaded.map(({ url }) => ({ url, isCover: false })),
      ]));
    } catch (error) {
      console.error(error);
      setErrors((prev) => ({ ...prev, images: "Upload photo impossible." }));
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = "Titre requis.";
    if (!form.description.trim()) next.description = "Description requise.";
    if (!form.categoryId) next.categoryId = "Categorie requise.";
    if (!form.customSubsubcategory.trim()) next.customSubsubcategory = "Sous-sous-categorie requise.";
    if (!form.organizerName.trim()) next.organizerName = "Organisateur requis.";
    if (!form.city.trim()) next.city = "Ville requise.";
    if (!form.startsAt) next.startsAt = "Date de debut requise.";
    if (!form.endsAt) next.endsAt = "Date de fin requise.";
    if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) next.endsAt = "La fin doit etre apres le debut.";
    for (const field of specificFields) {
      const value = form.eventFieldValues?.[field.fieldName];
      if (field.required && (value === undefined || value === null || value === "")) {
        next[`eventFieldValues.${field.fieldName}`] = `${field.label} requis.`;
      }
      if (field.fieldType === "number" && value !== undefined && value !== "" && Number.isNaN(Number(value))) {
        next[`eventFieldValues.${field.fieldName}`] = `${field.label} doit etre un nombre.`;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    const intent = e.nativeEvent?.submitter?.value;
    if (!validate()) return;
    setSaving(true);
    const gallery = galleryUrlsFromText(form.galleryText).map((url) => ({ url, isCover: false }));
    const payload = {
      ...form,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      doorsOpenAt: form.doorsOpenAt ? new Date(form.doorsOpenAt).toISOString() : null,
      recurrenceEndsAt: form.recurrenceEndsAt ? new Date(form.recurrenceEndsAt).toISOString() : null,
      recurrenceRule: recurrenceRuleFor(form),
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
      priceMin: form.isFree || form.priceMin === "" ? null : Number(form.priceMin),
      priceMax: form.isFree || form.priceMax === "" ? null : Number(form.priceMax),
      capacity: form.capacity === "" ? null : Number(form.capacity),
      gallery,
      eventFieldValues: form.eventFieldValues || {},
      status: admin
        ? intent === "draft"
          ? "DRAFT"
          : intent === "publish"
          ? "PUBLISHED"
          : form.status
        : intent === "draft" ? "DRAFT" : "PENDING_REVIEW",
    };
    delete payload.galleryText;

    try {
      if (event?.id) await eventsService.update(event.id, payload);
      else await eventsService.create(payload);
      router.push(admin ? "/admin/events" : "/my-space/events");
    } catch (error) {
      setErrors(error.response?.data?.errors || { form: error.response?.data?.message || "Sauvegarde impossible." });
    } finally {
      setSaving(false);
    }
  };

  if (admin && categoryStep === "select") {
    return (
      <div className="grid gap-5">
        {errors.categoryId && <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.categoryId}</div>}
        <div className="grid gap-2">
          <h2 className="text-lg font-bold text-gray-900">Choisir la sous-categorie</h2>
          <p className="text-sm text-gray-500">Selectionnez une sous-categorie d evenement avant de charger le formulaire adapte.</p>
        </div>
        <input
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          placeholder="Rechercher une sous-categorie..."
          className="h-11 rounded-xl border border-gray-200 px-3 text-sm"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setPendingCategoryId(category.id)}
              className={`min-h-24 rounded-xl border p-4 text-left transition ${
                pendingCategoryId === category.id
                  ? "border-[#2D5016] bg-[#E8F5D0] text-[#2D5016]"
                  : "border-gray-200 bg-white hover:border-[#2D5016]"
              }`}
            >
              <span className="block text-sm font-bold">{category.name}</span>
              <span className="mt-1 block text-xs text-gray-500">{category.formTemplate?.name || "Aucun modele"}</span>
            </button>
          ))}
        </div>
        {filteredCategories.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
            Aucune sous-categorie trouvee.
          </div>
        )}
        <div className="flex justify-end gap-3">
          {form.categoryId && (
            <button type="button" onClick={() => setCategoryStep("form")} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700">
              Annuler
            </button>
          )}
          <button
            type="button"
            disabled={!pendingCategory?.formTemplate}
            onClick={() => applyCategory(pendingCategoryId)}
            className="rounded-xl bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      {errors.form && <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.form}</div>}
      {selectedCategory && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#2D5016]/20 bg-[#E8F5D0]/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-[#2D5016]/70">Sous-categorie choisie</p>
            <p className="text-base font-bold text-[#2D5016]">{selectedCategory.name}</p>
            <p className="text-xs text-gray-500">{selectedCategory.formTemplate?.name || "Modele non configure"}</p>
          </div>
          {admin && (
            <button type="button" onClick={modifyCategory} className="rounded-xl border border-[#2D5016]/30 bg-white px-4 py-2 text-sm font-semibold text-[#2D5016]">
              Modifier
            </button>
          )}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {!admin && (
          <Field label="Categorie" error={errors.categoryId}>
            <select value={form.categoryId} onChange={(e) => applyCategory(e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">
              <option value="">Choisir</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Sous-sous-categorie" error={errors.customSubsubcategory}>
          <input
            value={form.customSubsubcategory}
            onChange={(e) => update("customSubsubcategory", e.target.value)}
            placeholder="Ex: Exposition de peinture"
            className="h-11 rounded-xl border border-gray-200 px-3 text-sm"
          />
        </Field>
        {admin && (
          <Field label="Statut">
            <select value={form.status} onChange={(e) => update("status", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">
              {EVENT_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </Field>
        )}
        <Field label="Titre" error={errors.title}>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Titre arabe">
          <input dir="rtl" value={form.titleAr || ""} onChange={(e) => update("titleAr", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Organisateur" error={errors.organizerName}>
          <input value={form.organizerName} onChange={(e) => update("organizerName", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Telephone">
          <input value={form.organizerPhone || ""} onChange={(e) => update("organizerPhone", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Email">
          <input type="email" value={form.organizerEmail || ""} onChange={(e) => update("organizerEmail", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Site web">
          <input value={form.websiteUrl || ""} onChange={(e) => update("websiteUrl", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Mode">
          <select value={form.eventMode} onChange={(e) => update("eventMode", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">
            {EVENT_MODES.filter((mode) => mode.value).map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
          </select>
        </Field>
        <Field label="Lieu">
          <input value={form.venueName || ""} onChange={(e) => update("venueName", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Ville" error={errors.city}>
          <input value={form.city} onChange={(e) => update("city", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Region">
          <input value={form.region || ""} onChange={(e) => update("region", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Adresse">
          <input value={form.address || ""} onChange={(e) => update("address", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Lien en ligne">
          <input value={form.onlineUrl || ""} onChange={(e) => update("onlineUrl", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Debut" error={errors.startsAt}>
          <input type="datetime-local" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Fin" error={errors.endsAt}>
          <input type="datetime-local" value={form.endsAt} onChange={(e) => update("endsAt", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Ouverture des portes">
          <input type="datetime-local" value={form.doorsOpenAt || ""} onChange={(e) => update("doorsOpenAt", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Recurrence">
          <select value={form.recurrenceType} onChange={(e) => update("recurrenceType", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm">
            {RECURRENCE_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </Field>
        {form.recurrenceType === "CUSTOM" && (
          <Field label="RRULE">
            <input value={form.recurrenceRule || ""} onChange={(e) => update("recurrenceRule", e.target.value)} placeholder="FREQ=WEEKLY;BYDAY=SA" className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
          </Field>
        )}
        {form.recurrenceType !== "NONE" && (
          <Field label="Fin recurrence">
            <input type="datetime-local" value={form.recurrenceEndsAt || ""} onChange={(e) => update("recurrenceEndsAt", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
          </Field>
        )}
        <Field label="Image principale">
          <input value={form.mainImage || ""} onChange={(e) => update("mainImage", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Billetterie">
          <input value={form.ticketUrl || ""} onChange={(e) => update("ticketUrl", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <div className="grid gap-3 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-700">Photos</p>
            <label className="inline-flex cursor-pointer items-center rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:border-[#2D5016] hover:text-[#2D5016]">
              {uploadingImages ? "Envoi..." : "Ajouter des photos"}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={uploadImages} disabled={uploadingImages} />
            </label>
          </div>
          {errors.images && <span className="text-xs text-red-600">{errors.images}</span>}
          <div className="flex flex-wrap gap-3">
            {images.map((image, index) => (
              <div key={`${image.url}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200">
                <img src={image.url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setCover(index)} className={`absolute left-1 top-1 rounded-full px-2 py-1 text-[10px] font-bold ${image.isCover ? "bg-amber-400 text-white" : "bg-white/85 text-gray-600"}`}>
                  Cover
                </button>
                <button type="button" onClick={() => removeImage(index)} className="absolute right-1 top-1 rounded-full bg-white/85 px-2 text-sm text-red-600">
                  x
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">La photo de couverture est affichee dans les listes et en haut du detail.</p>
        </div>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm">
          <input type="checkbox" checked={form.isFree} onChange={(e) => update("isFree", e.target.checked)} />
          Gratuit
        </label>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm">
          <input type="checkbox" checked={form.reservationRequired} onChange={(e) => update("reservationRequired", e.target.checked)} />
          Reservation requise
        </label>
        {!form.isFree && (
          <>
            <Field label="Prix min">
              <input type="number" min="0" value={form.priceMin} onChange={(e) => update("priceMin", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
            </Field>
            <Field label="Prix max">
              <input type="number" min="0" value={form.priceMax} onChange={(e) => update("priceMax", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
            </Field>
          </>
        )}
        <Field label="Capacite">
          <input type="number" min="0" value={form.capacity} onChange={(e) => update("capacity", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Restriction age">
          <input value={form.ageRestriction || ""} onChange={(e) => update("ageRestriction", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        {admin && (
          <>
            <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
              Mis en avant
            </label>
            <label className="flex h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm">
              <input type="checkbox" checked={form.verified} onChange={(e) => update("verified", e.target.checked)} />
              Verifie
            </label>
          </>
        )}
      </div>

      {specificFields.length > 0 && (
        <section className="grid gap-4 rounded-xl border border-gray-200 p-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Champs specifiques</h2>
            <p className="text-xs text-gray-500">Ces champs dependent de la sous-categorie selectionnee.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {specificFields.map((field) => (
              <DynamicField
                key={field.id}
                field={field}
                value={form.eventFieldValues?.[field.fieldName]}
                error={errors[`eventFieldValues.${field.fieldName}`]}
                onChange={(value) => updateSpecific(field.fieldName, value)}
              />
            ))}
          </div>
        </section>
      )}

      <Field label="Description courte">
        <input value={form.shortDescription || ""} onChange={(e) => update("shortDescription", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
      </Field>
      <Field label="Description" error={errors.description}>
        <textarea rows={5} value={form.description} onChange={(e) => update("description", e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      </Field>
      <Field label="Accessibilite">
        <textarea rows={2} value={form.accessibilityInformation || ""} onChange={(e) => update("accessibilityInformation", e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      </Field>
      <Field label="Galerie (une URL par ligne)">
        <textarea rows={3} value={form.galleryText} onChange={(e) => update("galleryText", e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Latitude">
          <input value={form.latitude} onChange={(e) => update("latitude", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
        <Field label="Longitude">
          <input value={form.longitude} onChange={(e) => update("longitude", e.target.value)} className="h-11 rounded-xl border border-gray-200 px-3 text-sm" />
        </Field>
      </div>
      <MapPicker latitude={form.latitude} longitude={form.longitude} onChange={(lat, lng) => setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))} />

      <div className="flex justify-end gap-3">
        <button type="submit" value="draft" disabled={saving} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 disabled:opacity-60">
          Enregistrer comme brouillon
        </button>
        <button type="submit" value={admin ? "publish" : "submit"} disabled={saving} className="rounded-xl bg-[#2D5016] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
          {saving ? "Enregistrement..." : admin ? "Publier" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
