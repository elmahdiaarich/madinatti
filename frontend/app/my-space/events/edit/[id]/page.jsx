"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EventForm from "@/components/events/EventForm";
import { eventsService } from "@/services/eventsService";

export default function EditEventPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    eventsService.get(id)
      .then((res) => setEvent(res.data))
      .catch((err) => setError(err.response?.data?.message || "Evenement introuvable."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <main className="p-6 text-sm text-gray-500">Chargement...</main>;
  if (error) return <main className="p-6 text-sm text-red-600">{error}</main>;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Modifier un evenement</h1>
        <p className="text-sm text-gray-500">Une modification repasse en validation avant publication.</p>
      </div>
      <section className="bg-white p-5 shadow-sm">
        <EventForm event={event} />
      </section>
    </main>
  );
}
