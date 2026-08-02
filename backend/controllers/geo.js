// controllers/geo.js  (or wherever you keep small utility controllers)
//
// GET /api/geo/resolve-maps-url?url=<encoded google maps url>
//
// Handles two cases:
//   1. Long URLs (already contain coordinates) — no network hop needed.
//   2. Short links (maps.app.goo.gl / goo.gl/maps) — followed server-side
//      to their final redirect target, since the browser can't do this
//      itself (CORS blocks reading the Location header cross-origin).
//
// Then attempts reverse geocoding via Nominatim to guess region/city/quartier.
// These are BEST-EFFORT — always let the frontend show them as suggestions
// the user confirms, not silent auto-fill, since OSM naming won't always
// match your fixed morocco-cities list exactly.

const axios = require("axios");

const COORD_PATTERNS = [
  // .../@33.589,-7.603,17z  (standard "you are viewing" pin)
  /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
  // ...!3d33.589!4d-7.603   (embedded place coordinates)
  /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
  // ...?q=33.589,-7.603  or  &query=33.589,-7.603
  /[?&](?:q|query)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
];

function extractCoords(url) {
  for (const pattern of COORD_PATTERNS) {
    const m = url.match(pattern);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  return null;
}

function isShortLink(url) {
  return /goo\.gl|maps\.app\.goo\.gl/.test(url);
}

async function resolveShortLink(url) {
  // HEAD first (cheaper); Google generally supports it. Fall back to GET.
  try {
    const res = await axios.head(url, {
      maxRedirects: 5,
      validateStatus: () => true,
    });
    if (res.request?.res?.responseUrl) return res.request.res.responseUrl;
  } catch {
    // fall through to GET
  }
  const res = await axios.get(url, {
    maxRedirects: 5,
    validateStatus: () => true,
  });
  return res.request?.res?.responseUrl || url;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { format: "json", lat, lon: lng, "accept-language": "fr" },
      headers: { "User-Agent": "town-app/1.0" }, // Nominatim requires a UA
    });
    const addr = res.data?.address || {};
    return {
      region: addr.state || addr.region || null,
      city: addr.city || addr.town || addr.village || addr.municipality || null,
      quartier: addr.suburb || addr.neighbourhood || addr.quarter || null,
    };
  } catch {
    return { region: null, city: null, quartier: null };
  }
}

async function resolveMapsUrl(req, res) {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL manquante" });
    }

    let finalUrl = url;
    if (isShortLink(url)) {
      finalUrl = await resolveShortLink(url);
    }

    const coords = extractCoords(finalUrl);
    if (!coords) {
      return res.status(422).json({
        success: false,
        message: "Impossible d'extraire les coordonnées de ce lien.",
      });
    }

    const guessed = await reverseGeocode(coords.lat, coords.lng);

    return res.json({
      success: true,
      latitude: coords.lat,
      longitude: coords.lng,
      // best-effort — frontend should treat these as suggestions, not facts
      suggested: guessed,
    });
  } catch (err) {
    console.error("[resolveMapsUrl]", err);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
}

module.exports = { resolveMapsUrl };