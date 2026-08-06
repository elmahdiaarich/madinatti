// Parses the `hours` field format used across the app:
// "09:00 - 18:00", "24h/24", or "09:00 - 12:00, 14:00 - 19:00"
// Returns true if the current time in Morocco falls within any listed range.
//
// Deliberately anchored to Africa/Casablanca rather than the visitor's
// device clock/timezone — all listings are Moroccan businesses, so a
// traveler or misconfigured device shouldn't see a wrong open/closed
// status just because their phone's local time differs.
export function isCurrentlyOpen(hours) {
  if (!hours) return null; // no hours info — don't claim open or closed
  if (hours.trim() === "24h/24") return true;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Casablanca",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hourPart = Number(parts.find((p) => p.type === "hour").value);
  const minutePart = Number(parts.find((p) => p.type === "minute").value);
  const nowMinutes = hourPart * 60 + minutePart;

  const ranges = hours.split(",").map((r) => r.trim());

  return ranges.some((range) => {
    const match = range.match(
      /^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$/,
    );
    if (!match) return false;

    const [, sh, sm, eh, em] = match.map(Number);
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    if (endMinutes <= startMinutes) {
      return nowMinutes >= startMinutes || nowMinutes < endMinutes;
    }
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  });
}