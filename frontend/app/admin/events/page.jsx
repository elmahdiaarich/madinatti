"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle, Edit, FileSpreadsheet, Search, Trash2, Upload, XCircle } from "lucide-react";
import { eventsService } from "@/services/eventsService";
import { EVENT_STATUSES } from "@/constants/eventCategories";

function eventImage(event) {
  return event.mainImage || event.gallery?.find((image) => image?.isCover)?.url || event.gallery?.[0]?.url || null;
}

export default function AdminEventsPage() {
  const importRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await eventsService.adminList({ query: search, status, category, limit: 100 });
      setEvents(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    eventsService.categories().then((res) => setCategories(res.data || [])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, category]);

  const moderate = async (event, nextStatus) => {
    await eventsService.updateStatus(event.id, { status: nextStatus, verified: nextStatus === "PUBLISHED" });
    await load();
  };

  const remove = async (event) => {
    if (!confirm(`Supprimer "${event.title}" ?`)) return;
    await eventsService.remove(event.id);
    await load();
  };

  const importFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      if (file.name.toLowerCase().endsWith(".ics")) await eventsService.importIcs(file);
      else await eventsService.importCsv(file);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Import impossible.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  return (
    <main className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion evenements</h1>
          <p className="text-sm text-gray-400">Validation, publication, imports CSV/ICS et moderation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#2D5016]">
            <FileSpreadsheet size={16} /> Import CSV/ICS
            <input ref={importRef} type="file" accept=".csv,.xls,.xlsx,.ics" className="hidden" onChange={importFile} />
          </label>
          <Link href="/admin/events/create" className="inline-flex items-center gap-2 rounded-xl bg-[#2D5016] px-4 py-2.5 text-sm font-semibold text-white">
            <Upload size={16} /> Creer
          </Link>
        </div>
      </div>

      {error && <div className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher titre, lieu, organisateur..." className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-[#2D5016]" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-[#2D5016]">
          <option value="">Tous statuts</option>
          {EVENT_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-[#2D5016]">
          <option value="">Toutes categories</option>
          {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="divide-y divide-gray-100 md:hidden">
          {loading ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Chargement...</div>
          ) : events.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-gray-400">Aucun evenement.</div>
          ) : events.map((event) => (
            <article key={event.id} className="space-y-3 p-4">
              {eventImage(event) && (
                <img src={eventImage(event)} alt="" className="h-40 w-full rounded-xl object-cover" />
              )}
              <div>
                <h2 className="text-base font-bold leading-snug text-gray-900">{event.title}</h2>
                <p className="mt-1 text-sm text-gray-500">{event.categoryLabel || "Sans categorie"} - {event.city || "Ville non renseignee"}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600">
                  {EVENT_STATUSES.find((item) => item.value === event.status)?.label || event.status}
                </span>
                <span className="rounded-full bg-[#E8F5D0] px-3 py-1 font-semibold text-[#2D5016]">
                  {new Date(event.startsAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={() => moderate(event, "PUBLISHED")} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-[#2D5016]" title="Publier"><CheckCircle size={16} /></button>
                <button onClick={() => moderate(event, "REJECTED")} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-red-600" title="Refuser"><XCircle size={16} /></button>
                <Link href={`/admin/events/edit/${event.id}`} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-[#2D5016]"><Edit size={16} /></Link>
                <button onClick={() => remove(event)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>

        <table className="hidden w-full text-left text-sm md:table">
          <thead className="border-b border-gray-100 bg-gray-50 text-gray-500">
            <tr>
              <th className="px-5 py-3">Affiche</th>
              <th className="px-5 py-3">Titre</th>
              <th className="px-5 py-3">Categorie</th>
              <th className="px-5 py-3">Ville</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan="7" className="px-5 py-8 text-center text-gray-400">Aucun evenement.</td></tr>
            ) : events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  {eventImage(event) ? (
                    <img src={eventImage(event)} alt="" className="h-14 w-20 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-14 w-20 items-center justify-center rounded-lg bg-gray-100 text-xs font-semibold text-gray-400">Photo</div>
                  )}
                </td>
                <td className="px-5 py-3 font-semibold text-gray-900">{event.title}</td>
                <td className="px-5 py-3">{event.categoryLabel}</td>
                <td className="px-5 py-3">{event.city}</td>
                <td className="px-5 py-3">{EVENT_STATUSES.find((item) => item.value === event.status)?.label || event.status}</td>
                <td className="px-5 py-3">{new Date(event.startsAt).toLocaleString("fr-FR")}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => moderate(event, "PUBLISHED")} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-[#2D5016]" title="Publier"><CheckCircle size={15} /></button>
                    <button onClick={() => moderate(event, "REJECTED")} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-red-600" title="Refuser"><XCircle size={15} /></button>
                    <Link href={`/admin/events/edit/${event.id}`} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-[#2D5016]"><Edit size={15} /></Link>
                    <button onClick={() => remove(event)} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-red-600"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
