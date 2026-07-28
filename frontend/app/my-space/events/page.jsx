"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit, Plus, Trash2 } from "lucide-react";
import { eventsService } from "@/services/eventsService";
import { EVENT_STATUSES } from "@/constants/eventCategories";

function eventImage(event) {
  return event.mainImage || event.gallery?.find((image) => image?.isCover)?.url || event.gallery?.[0]?.url || null;
}

export default function MyEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await eventsService.mine({ limit: 100 });
      setEvents(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, []);

  const remove = async (event) => {
    if (!confirm(`Supprimer "${event.title}" ?`)) return;
    await eventsService.remove(event.id);
    await load();
  };

  return (
    <main className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes evenements</h1>
          <p className="text-sm text-gray-500">Creez et suivez les evenements soumis a MADINATI.</p>
        </div>
        <Link href="/my-space/events/create" className="inline-flex items-center gap-2 rounded-xl bg-[#2D5016] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus size={16} /> Ajouter
        </Link>
      </div>

      {error && <div className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="overflow-hidden border border-gray-100 bg-white shadow-sm">
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
                <p className="mt-1 text-sm text-gray-500">{event.city || "Ville non renseignee"}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-600">
                  {EVENT_STATUSES.find((status) => status.value === event.status)?.label || event.status}
                </span>
                <span className="rounded-full bg-[#E8F5D0] px-3 py-1 font-semibold text-[#2D5016]">
                  {new Date(event.startsAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <Link href={`/my-space/events/edit/${event.id}`} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-[#2D5016]"><Edit size={16} /></Link>
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
              <th className="px-5 py-3">Ville</th>
              <th className="px-5 py-3">Statut</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400">Chargement...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400">Aucun evenement.</td></tr>
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
                <td className="px-5 py-3">{event.city}</td>
                <td className="px-5 py-3">{EVENT_STATUSES.find((status) => status.value === event.status)?.label || event.status}</td>
                <td className="px-5 py-3">{new Date(event.startsAt).toLocaleString("fr-FR")}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/my-space/events/edit/${event.id}`} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-[#2D5016]"><Edit size={15} /></Link>
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
