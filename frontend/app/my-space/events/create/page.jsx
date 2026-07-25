import EventForm from "@/components/events/EventForm";

export default function CreateEventPage() {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Creer un evenement</h1>
        <p className="text-sm text-gray-500">Les evenements soumis sont verifies avant publication.</p>
      </div>
      <section className="bg-white p-5 shadow-sm">
        <EventForm />
      </section>
    </main>
  );
}
