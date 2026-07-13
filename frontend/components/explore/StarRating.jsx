// frontend/components/explore/StarRating.jsx
import { Star } from "lucide-react";

// Static display for now — no click handling, no submit.
// Once a real rating system exists, just pass the live average in.
export default function StarRating({ value = 4.5, size = 14, showValue = true }) {
  const rating = Number(value) || 0;
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            className={
              i <= rounded
                ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
                : "fill-transparent text-black/20"
            }
          />
        ))}
      </div>
      {showValue && <span className="text-xs text-black/50">{rating.toFixed(1)}</span>}
    </div>
  );
}