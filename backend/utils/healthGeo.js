const MOROCCO_BOUNDS = {
  minLat: 21,
  maxLat: 36.2,
  minLng: -17.2,
  maxLng: -0.8,
};

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isMoroccoCoordinate(lat, lng) {
  return (
    lat >= MOROCCO_BOUNDS.minLat &&
    lat <= MOROCCO_BOUNDS.maxLat &&
    lng >= MOROCCO_BOUNDS.minLng &&
    lng <= MOROCCO_BOUNDS.maxLng
  );
}

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function boundingBox(lat, lng, radiusMeters) {
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}

module.exports = {
  MOROCCO_BOUNDS,
  toNumber,
  isMoroccoCoordinate,
  haversineMeters,
  boundingBox,
};
