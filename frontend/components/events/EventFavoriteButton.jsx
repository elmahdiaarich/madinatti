"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { eventsService } from "@/services/eventsService";

export default function EventFavoriteButton({ eventId }) {
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    setError("");
    try {
      if (active) {
        await eventsService.removeFavorite(eventId);
        setActive(false);
      } else {
        await eventsService.addFavorite(eventId);
        setActive(true);
      }
    } catch {
      setError("Connexion requise.");
    }
  };

  return (
    <div className="grid gap-1">
      <button type="button" onClick={toggle} className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${active ? "border-red-200 bg-red-50 text-red-700" : "border-gray-200 text-gray-700 hover:border-[#2D5016]"}`}>
        <Heart size={16} className={active ? "fill-current" : ""} />
        {active ? "Favori ajoute" : "Ajouter aux favoris"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
