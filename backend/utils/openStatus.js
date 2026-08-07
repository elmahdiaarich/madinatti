// Mirrors frontend/lib/openStatus.js — kept as a separate copy since
// backend and frontend don't share a module boundary. If the `hours`
// format ever changes, update both.
function isCurrentlyOpen(hours) {
  if (!hours) return null;
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

module.exports = { isCurrentlyOpen };