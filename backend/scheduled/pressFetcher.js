'use strict';

const Parser = require('rss-parser');
const prisma = require('../config/db');
const { cities: moroccoCities } = require('morocco-cities');


// ── rss-parser config ──────────────────────────────────────────────────────
// customFields capture les balises non-standards :
// - media:content  -> image de l'article
// - dc:creator     -> auteur (utilisé pour extraire la ville côté AR)
// - description    -> mappée explicitement vers `descriptionRaw` pour être
//   SÛRS de lire le résumé WordPress et non `item.content`/`item.contentSnippet`,
//   qui sont dérivés de <content:encoded> (INTERDIT de lire/stocker, même
//   partiellement, selon les décisions actées).
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['dc:creator', 'creator'],
      ['description', 'descriptionRaw'],
    ],
  },
});

// ── Sources ────────────────────────────────────────────────────────────────
const FEEDS = [
  { source: 'hespress_ar', url: 'https://www.hespress.com/feed', language: 'AR' },
  { source: 'hespress_fr', url: 'https://fr.hespress.com/feed', language: 'FR' },
];

// ── Liste des villes marocaines (pour le fallback FR) ─────────────────────
// On construit une liste plate, dédupliquée, triée par longueur décroissante
// pour matcher les noms de villes les plus spécifiques en premier
// (ex: "Sidi Kacem" avant "Kacem" si jamais un tel cas existait).
const allCityNames = [...new Set(moroccoCities.map((c) => c.name).filter(Boolean))].sort(
  (a, b) => b.length - a.length,
);

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Nettoyage du texte ─────────────────────────────────────────────────────

/**
 * Étape 1 : retire le paragraphe auto-généré WordPress
 * `<p>The post <a href="...">Titre</a> appeared first on <a href="...">Hespress...</a>.</p>`
 * AVANT tout autre nettoyage HTML, comme spécifié.
 */
function stripWordPressFooter(html) {
  if (!html) return '';
  return html.replace(/<p>\s*The post[\s\S]*?appeared first on[\s\S]*?<\/p>\s*$/i, '').trim();
}

/** Étape 2 : retire les balises HTML restantes */
function stripHtmlTags(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ');
}

/** Étape 3 : décode les entités HTML courantes (&#8230;, &rsquo;, &#039;, etc.) */
function decodeHtmlEntities(str) {
  if (!str) return '';
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    rsquo: '\u2019', lsquo: '\u2018', rdquo: '\u201D', ldquo: '\u201C', hellip: '\u2026',
  };
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (named[name] !== undefined ? named[name] : m));
}

/** Pipeline complet de nettoyage de la description (résumé WP, jamais content:encoded) */
function cleanDescription(rawDescriptionHtml) {
  let cleaned = stripWordPressFooter(rawDescriptionHtml);
  cleaned = stripHtmlTags(cleaned);
  cleaned = decodeHtmlEntities(cleaned);
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}

function cleanTitle(rawTitle) {
  return decodeHtmlEntities(stripHtmlTags(rawTitle || '')).trim();
}

// ── Extraction de l'image ──────────────────────────────────────────────────

/**
 * item.mediaContent peut être un objet unique { $: { url, type } } ou un
 * tableau si plusieurs balises media:content existent. On gère les deux cas.
 */
function extractImageUrl(item) {
  let media = item.mediaContent;
  if (!media) return null;
  if (Array.isArray(media)) media = media[0];
  if (!media) return null;
  if (media.$ && media.$.url) return media.$.url;
  if (typeof media.url === 'string') return media.url;
  return null;
}

// ── Extraction de la ville (logique dépendante de la langue) ──────────────

/**
 * AR : dc:creator suit le motif "هسبريس من <ville>".
 * Si le motif n'est pas présent (ex: "هسبريس - و.م.ع"), city reste null.
 */
function extractCityAR(item) {
  const creator = item.creator || '';
  const match = creator.match(/هسبريس\s+من\s+(.+)/);
  return match ? match[1].trim() : null;
}

/**
 * FR : pas de ville dans dc:creator (juste un nom de journaliste).
 * Fallback : on scanne category + titre + description contre la liste
 * morocco-cities. Si aucun match, city reste null (limitation MVP acceptée).
 */
function extractCityFR(item, cleanedTitle, cleanedDescription) {
  const haystack = [...(item.categories || []), cleanedTitle, cleanedDescription].join(' ');
  for (const cityName of allCityNames) {
    const re = new RegExp(`\\b${escapeRegExp(cityName)}\\b`, 'i');
    if (re.test(haystack)) return cityName;
  }
  return null;
}

// ── Utilitaire Slugify ────────────────────────────────────────────────────────
function slugify(text) {
  const str = text.toString().trim();
  // Pour les textes en arabe (Unicode 0600–06FF), les caractères non-ASCII
  // sont tous supprimés par le replace /[^\w\-]+/g, ce qui produit un slug
  // vide — et donc une collision de la contrainte UNIQUE sur slug.
  // → On génère un slug déterministe préfixé "ar-" + hex des 16 premiers octets.
  if (/[\u0600-\u06FF]/.test(str)) {
    const hex = Buffer.from(str.slice(0, 16), 'utf8').toString('hex').slice(0, 28);
    return `ar-${hex}`;
  }
  return str.toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// ── Fetch + parse + upsert d'un flux ────────────────────────────────────────

async function fetchAndParseFeed(url, language) {
  const feed = await parser.parseURL(url);
  let itemsFetched = 0;

  for (const item of feed.items) {
    if (!item.link) continue; // pas de sourceUrl -> impossible de faire l'upsert

    const sourceUrl = item.link;
    const title = cleanTitle(item.title);
    // On utilise UNIQUEMENT item.descriptionRaw (notre customField dédié),
    // jamais item.content / item.contentSnippet (dérivés de content:encoded).
    const description = cleanDescription(item.descriptionRaw);
    const imageUrl = extractImageUrl(item);
    const city = language === 'AR'
      ? extractCityAR(item)
      : extractCityFR(item, title, description);
    const publishedAt = item.pubDate
      ? new Date(item.pubDate)
      : (item.isoDate ? new Date(item.isoDate) : new Date());

    // Gestion de la catégorie
    let categoryId = null;
    if (item.categories && item.categories.length > 0) {
      const mainCategoryName = item.categories[0].trim();
      const slug = slugify(mainCategoryName);
      
      if (mainCategoryName && slug) {
        const category = await prisma.category.upsert({
          where: { slug },
          update: { name: mainCategoryName },
          create: { name: mainCategoryName, slug, module: 'PRESS' },
        });
        categoryId = category.id;
      }
    }

    await prisma.newsArticle.upsert({
      where: { sourceUrl },
      update: { title, description, imageUrl, city, publishedAt, language, categoryId },
      create: { title, description, imageUrl, sourceUrl, language, city, publishedAt, categoryId },
    });

    itemsFetched++;
  }

  return itemsFetched;
}

// ── Orchestration des 2 flux + FetchLog ─────────────────────────────────────

/**
 * Lance le fetch pour AR et FR. Chaque flux est isolé dans son propre
 * try/catch : si FR échoue, AR peut quand même réussir (et vice versa).
 * Un FetchLog est écrit par flux (plus simple à débugger dans Prisma Studio).
 */
async function runFetch() {
  for (const feedConfig of FEEDS) {
    try {
      const itemsFetched = await fetchAndParseFeed(feedConfig.url, feedConfig.language);
      await prisma.fetchLog.create({
        data: { source: feedConfig.source, status: 'SUCCESS', itemsFetched },
      });
      console.log(`[pressFetcher] ${feedConfig.source}: ${itemsFetched} article(s) traité(s)`);
    } catch (error) {
      console.error(`[pressFetcher] ${feedConfig.source} a échoué:`, error.message);
      try {
        await prisma.fetchLog.create({
          data: {
            source: feedConfig.source,
            status: 'FAILED',
            itemsFetched: 0,
            errorMessage: (error.message || 'Erreur inconnue').slice(0, 2000),
          },
        });
      } catch (logError) {
        console.error('[pressFetcher] Échec de l\'écriture du FetchLog:', logError.message);
      }
    }
  }
}

module.exports = {
  runFetch,
  fetchAndParseFeed,
};