const axios = require("axios");
const { URL } = require("url");

/**
 * Ensures the target hostname strictly belongs to the Google Maps ecosystem.
 */
function isValidGoogleMapsHost(hostname) {
  if (!hostname) return false;
  return (
    hostname === "goo.gl" ||
    hostname === "maps.app.goo.gl" ||
    hostname === "google.com" ||
    hostname.endsWith(".google.com")
  );
}

/**
 * Validates protocol, blocks direct IPs, and filters hosts to prevent SSRF.
 */
function validateUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    
    // Enforce protocol boundaries (no file://, gopher://, etc.)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    
    // Block direct IP hostnames (e.g. 127.0.0.1, 169.254.169.254, private ranges)
    const isIp = /^[0-9.]+$/.test(parsed.hostname);
    if (isIp) {
      return false;
    }
    
    return isValidGoogleMapsHost(parsed.hostname);
  } catch {
    return false;
  }
}

const COORD_PATTERNS = [
  /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
  /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
  /[?&](?:q|query)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
];

function extractCoords(url) {
  for (const pattern of COORD_PATTERNS) {
    const m = url.match(pattern);
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  return null;
}

/**
 * Securely resolves short links by intercepting and validating every single redirect hop.
 */
async function resolveShortLink(url) {
  let currentUrl = url;
  const maxRedirects = 5;

  for (let i = 0; i < maxRedirects; i++) {
    // Validate target domain at each hop
    if (!validateUrl(currentUrl)) {
      throw new Error("URL non autorisée dans la chaîne de redirection.");
    }

    // Use HEAD first (standard axios redirect bypass prevention)
    const res = await axios.head(currentUrl, {
      maxRedirects: 0, // Stop Axios from auto-following redirects
      validateStatus: (status) => status >= 200 && status < 400,
    });

    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      // Resolve relative redirect locations securely
      currentUrl = new URL(res.headers.location, currentUrl).toString();
    } else {
      return currentUrl;
    }
  }
  throw new Error("Trop de redirections.");
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: { format: "json", lat, lon: lng, "accept-language": "fr" },
      headers: { "User-Agent": "town-app/1.0" },
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

    // Validate the initial input URL
    if (!validateUrl(url)) {
      return res.status(400).json({ success: false, message: "URL non autorisée." });
    }

    // Resolve short links securely
    const finalUrl = await resolveShortLink(url);

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
      suggested: guessed,
    });
  } catch (err) {
    console.error("[resolveMapsUrl]", err.message);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
}

module.exports = { resolveMapsUrl };