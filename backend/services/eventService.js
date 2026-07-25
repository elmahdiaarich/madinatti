const { RRule, rrulestr } = require('rrule');
const XLSX = require('xlsx');
const prisma = require('../config/db');
const { EVENT_CATEGORY_MODULE } = require('../config/eventCategories');
const { boundingBox, haversineMeters } = require('../utils/healthGeo');

const PUBLIC_STATUSES = ['PUBLISHED', 'CANCELLED', 'POSTPONED'];

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

async function uniqueSlug(title, currentId) {
  const base = slugify(title) || 'event';
  let slug = base;
  let i = 2;
  while (true) {
    const existing = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === currentId) return slug;
    slug = `${base}-${i++}`;
  }
}

function optionalString(value) {
  if (value === undefined) return undefined;
  const trimmed = String(value || '').trim();
  return trimmed || null;
}

function optionalDecimal(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  const normalized = images
    .map((image) => {
      const url = typeof image === 'string' ? image : image?.url;
      if (!url || typeof url !== 'string') return null;
      return { url: url.trim(), isCover: Boolean(image?.isCover) };
    })
    .filter((image) => image?.url)
    .slice(0, 10);

  if (normalized.length && !normalized.some((image) => image.isCover)) {
    normalized[0].isCover = true;
  }
  const coverIndex = normalized.findIndex((image) => image.isCover);
  return normalized.map((image, index) => ({ ...image, isCover: index === coverIndex }));
}

function coverFromImages(images) {
  return images.find((image) => image.isCover)?.url || images[0]?.url || null;
}

function parseDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateRangeForPeriod(period, exactDate, dateFrom, dateTo) {
  if (dateFrom || dateTo) return { from: dateFrom || null, to: dateTo || null };

  const base = exactDate || new Date();
  const startOfDay = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
  const addDays = (date, days) => new Date(date.getTime() + days * 86400000);

  if (exactDate) {
    const from = startOfDay(exactDate);
    return { from, to: addDays(from, 1) };
  }
  if (period === 'today') {
    const from = startOfDay(base);
    return { from, to: addDays(from, 1) };
  }
  if (period === 'tomorrow') {
    const from = addDays(startOfDay(base), 1);
    return { from, to: addDays(from, 1) };
  }
  if (period === 'weekend') {
    const today = startOfDay(base);
    const day = today.getUTCDay();
    const daysUntilSaturday = (6 - day + 7) % 7;
    const from = addDays(today, daysUntilSaturday);
    return { from, to: addDays(from, 2) };
  }

  return { from: new Date(), to: addDays(new Date(), 365) };
}

function buildRRule(event) {
  if (!event.recurrenceRule) return null;
  try {
    const rule = rrulestr(event.recurrenceRule);
    rule.origOptions.dtstart = event.startsAt;
    if (event.recurrenceEndsAt && !rule.origOptions.until) {
      rule.origOptions.until = event.recurrenceEndsAt;
    }
    return new RRule(rule.origOptions);
  } catch {
    return null;
  }
}

function generateOccurrences(event, from = new Date(), to = new Date(Date.now() + 365 * 86400000), limit = 20) {
  const startsAt = new Date(event.startsAt);
  const endsAt = new Date(event.endsAt);
  const duration = endsAt.getTime() - startsAt.getTime();

  if (event.recurrenceType === 'NONE' || !event.recurrenceRule) {
    if (endsAt < from || startsAt > to) return [];
    return [{ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString(), isOriginal: true }];
  }

  const rule = buildRRule(event);
  if (!rule) return [];

  const instances = rule.between(from, to, true, (date, i) => i < limit);
  return instances.slice(0, limit).map((date) => ({
    startsAt: date.toISOString(),
    endsAt: new Date(date.getTime() + duration).toISOString(),
    isOriginal: date.getTime() === startsAt.getTime(),
  }));
}

function serializeEvent(event, extras = {}) {
  if (!event) return null;
  return {
    ...event,
    latitude: event.latitude == null ? null : Number(event.latitude),
    longitude: event.longitude == null ? null : Number(event.longitude),
    priceMin: event.priceMin == null ? null : Number(event.priceMin),
    priceMax: event.priceMax == null ? null : Number(event.priceMax),
    categorySlug: event.category?.slug,
    categoryLabel: event.category?.name,
    gallery: event.gallery || [],
    ...extras,
  };
}

async function withFavoriteCounts(events) {
  if (!events.length) return new Map();
  const grouped = await prisma.favorite.groupBy({
    by: ['itemId'],
    where: { itemType: 'EVENT', itemId: { in: events.map((event) => event.id) } },
    _count: { itemId: true },
  });
  return new Map(grouped.map((item) => [item.itemId, item._count.itemId]));
}

async function listEvents(filters, user) {
  const isAdmin = user?.role === 'admin';
  const isMine = Boolean(filters.mine && user?.userId);
  const statusFilter = isAdmin || isMine
    ? (filters.status ? { status: filters.status } : {})
    : { status: { in: PUBLIC_STATUSES } };
  const { from, to } = dateRangeForPeriod(filters.period, filters.exactDate, filters.dateFrom, filters.dateTo);
  const where = {
    category: { module: EVENT_CATEGORY_MODULE },
    ...statusFilter,
    ...(isMine ? { createdById: user.userId } : {}),
    ...(filters.categorySlug && { category: { module: EVENT_CATEGORY_MODULE, slug: filters.categorySlug } }),
    ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
    ...(filters.province && { province: { contains: filters.province, mode: 'insensitive' } }),
    ...(filters.region && { region: { contains: filters.region, mode: 'insensitive' } }),
    ...(filters.eventMode && { eventMode: filters.eventMode }),
    ...(filters.isFree !== undefined && { isFree: filters.isFree }),
    ...(filters.verified !== undefined && { verified: filters.verified }),
    ...(filters.query && {
      OR: [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { titleAr: { contains: filters.query, mode: 'insensitive' } },
        { shortDescription: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { organizerName: { contains: filters.query, mode: 'insensitive' } },
        { venueName: { contains: filters.query, mode: 'insensitive' } },
        { address: { contains: filters.query, mode: 'insensitive' } },
      ],
    }),
  };

  if (filters.lat != null && filters.lng != null) {
    const box = boundingBox(filters.lat, filters.lng, filters.radius);
    where.latitude = { gte: box.minLat, lte: box.maxLat };
    where.longitude = { gte: box.minLng, lte: box.maxLng };
  }

  if (from || to) {
    where.AND = [
      ...(where.AND || []),
      {
        OR: [
          {
            startsAt: { lte: to || new Date('2999-12-31T00:00:00Z') },
            endsAt: { gte: from || new Date('1970-01-01T00:00:00Z') },
          },
          {
            recurrenceType: { not: 'NONE' },
            startsAt: { lte: to || new Date('2999-12-31T00:00:00Z') },
            OR: [{ recurrenceEndsAt: null }, { recurrenceEndsAt: { gte: from || new Date() } }],
          },
        ],
      },
    ];
  }

  const rawEvents = await prisma.event.findMany({
    where,
    include: { category: true },
    orderBy: [{ featured: 'desc' }, { startsAt: 'asc' }],
  });
  const favoriteCounts = await withFavoriteCounts(rawEvents);

  let data = rawEvents.map((event) => {
    const occurrences = generateOccurrences(event, from || new Date(), to || new Date(Date.now() + 365 * 86400000), 3);
    const nextOccurrence = occurrences[0] || null;
    const distanceMeters = filters.lat != null && filters.lng != null && event.latitude != null && event.longitude != null
      ? haversineMeters(filters.lat, filters.lng, Number(event.latitude), Number(event.longitude))
      : null;
    return serializeEvent(event, {
      nextOccurrence,
      occurrenceCount: occurrences.length,
      favoriteCount: favoriteCounts.get(event.id) || 0,
      distanceMeters,
    });
  }).filter((event) => event.nextOccurrence || isAdmin);

  if (filters.lat != null && filters.lng != null) {
    data = data.filter((event) => event.distanceMeters == null || event.distanceMeters <= filters.radius);
  }

  data.sort((a, b) => {
    if (filters.sort === 'proximity' && a.distanceMeters != null && b.distanceMeters != null) {
      return a.distanceMeters - b.distanceMeters;
    }
    if (filters.sort === 'popularite') return (b.favoriteCount || 0) - (a.favoriteCount || 0);
    if (filters.sort === 'nouveaute') return new Date(b.createdAt) - new Date(a.createdAt);
    const aDate = new Date(a.nextOccurrence?.startsAt || a.startsAt);
    const bDate = new Date(b.nextOccurrence?.startsAt || b.startsAt);
    return aDate - bDate;
  });

  const total = data.length;
  const start = (filters.page - 1) * filters.limit;
  data = data.slice(start, start + filters.limit);

  return {
    data,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) || 1 },
  };
}

async function getCategories() {
  const data = await prisma.category.findMany({
    where: { module: EVENT_CATEGORY_MODULE, isActive: true },
    orderBy: { name: 'asc' },
  });
  return data;
}

async function getEventByIdOrSlug(idOrSlug, user) {
  const visibility = user?.role === 'admin'
    ? {}
    : {
        OR: [
          { status: { in: PUBLIC_STATUSES } },
          ...(user?.userId ? [{ createdById: user.userId }] : []),
        ],
      };
  const event = await prisma.event.findFirst({
    where: {
      AND: [
        { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        visibility,
      ],
    },
    include: { category: true },
  });
  if (!event) return null;
  const favoriteCount = await prisma.favorite.count({ where: { itemType: 'EVENT', itemId: event.id } });
  return serializeEvent(event, {
    favoriteCount,
    occurrences: generateOccurrences(event, new Date(), new Date(Date.now() + 180 * 86400000), 8),
  });
}

function payloadToData(payload, user, existing) {
  const isAdmin = user?.role === 'admin';
  const status = payload.status || (isAdmin ? 'PUBLISHED' : 'PENDING_REVIEW');
  const publishedAt = status === 'PUBLISHED' ? (existing?.publishedAt || new Date()) : existing?.publishedAt;
  const gallery = normalizeImages(payload.gallery);
  return {
    title: payload.title?.trim(),
    titleAr: optionalString(payload.titleAr),
    shortDescription: optionalString(payload.shortDescription),
    description: payload.description?.trim(),
    categoryId: payload.categoryId,
    organizerName: payload.organizerName?.trim(),
    organizerId: payload.organizerId || null,
    organizerPhone: optionalString(payload.organizerPhone),
    organizerEmail: optionalString(payload.organizerEmail),
    websiteUrl: optionalString(payload.websiteUrl),
    eventMode: payload.eventMode || 'IN_PERSON',
    venueName: optionalString(payload.venueName),
    address: optionalString(payload.address),
    city: payload.city?.trim(),
    province: optionalString(payload.province),
    region: optionalString(payload.region),
    latitude: optionalDecimal(payload.latitude),
    longitude: optionalDecimal(payload.longitude),
    onlineUrl: optionalString(payload.onlineUrl),
    timezone: payload.timezone || 'Africa/Casablanca',
    startsAt: parseDate(payload.startsAt),
    endsAt: parseDate(payload.endsAt),
    doorsOpenAt: parseDate(payload.doorsOpenAt),
    recurrenceType: payload.recurrenceType || 'NONE',
    recurrenceRule: optionalString(payload.recurrenceRule),
    recurrenceEndsAt: parseDate(payload.recurrenceEndsAt),
    isFree: payload.isFree !== undefined ? Boolean(payload.isFree) : true,
    priceMin: optionalDecimal(payload.priceMin),
    priceMax: optionalDecimal(payload.priceMax),
    currency: payload.currency || 'MAD',
    ticketUrl: optionalString(payload.ticketUrl),
    reservationRequired: Boolean(payload.reservationRequired),
    capacity: optionalInt(payload.capacity),
    ageRestriction: optionalString(payload.ageRestriction),
    accessibilityInformation: optionalString(payload.accessibilityInformation),
    mainImage: optionalString(payload.mainImage) || coverFromImages(gallery),
    gallery,
    status,
    featured: isAdmin ? Boolean(payload.featured) : false,
    verified: isAdmin ? Boolean(payload.verified || status === 'PUBLISHED') : false,
    publishedAt,
    source: optionalString(payload.source),
    sourceUrl: optionalString(payload.sourceUrl),
    sourceVerifiedAt: parseDate(payload.sourceVerifiedAt),
  };
}

async function createEvent(payload, user) {
  const data = payloadToData(payload, user);
  data.slug = await uniqueSlug(payload.slug || payload.title);
  data.createdById = user.userId;
  const created = await prisma.event.create({ data, include: { category: true } });
  return serializeEvent(created);
}

async function updateEvent(id, payload, user) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return null;
  if (user?.role !== 'admin' && existing.createdById !== user?.userId) {
    const err = new Error('FORBIDDEN');
    err.status = 403;
    throw err;
  }

  const data = payloadToData({ ...existing, ...payload }, user, existing);
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
  if (payload.title && payload.title !== existing.title) data.slug = await uniqueSlug(payload.slug || payload.title, id);
  if (user?.role !== 'admin') {
    data.status = 'PENDING_REVIEW';
    data.verified = false;
    data.featured = false;
  }
  const updated = await prisma.event.update({ where: { id }, data, include: { category: true } });
  return serializeEvent(updated);
}

async function deleteEvent(id, user) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return null;
  if (user?.role !== 'admin' && existing.createdById !== user?.userId) {
    const err = new Error('FORBIDDEN');
    err.status = 403;
    throw err;
  }
  await prisma.favorite.deleteMany({ where: { itemId: id, itemType: 'EVENT' } });
  await prisma.event.delete({ where: { id } });
  return serializeEvent(existing);
}

async function updateStatus(id, payload, admin) {
  const data = {
    status: payload.status,
    verified: payload.verified ?? payload.status === 'PUBLISHED',
    featured: payload.featured,
    publishedAt: payload.status === 'PUBLISHED' ? new Date() : undefined,
  };
  Object.keys(data).forEach((key) => data[key] === undefined && delete data[key]);
  const updated = await prisma.event.update({ where: { id }, data, include: { category: true } });
  return serializeEvent(updated);
}

async function toggleFavorite(eventId, userId, favorite) {
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) return null;
  const where = { userId_itemId_itemType: { userId, itemId: eventId, itemType: 'EVENT' } };
  const existing = await prisma.favorite.findUnique({ where });
  if (favorite && !existing) await prisma.favorite.create({ data: { userId, itemId: eventId, itemType: 'EVENT' } });
  if (!favorite && existing) await prisma.favorite.delete({ where: { id: existing.id } });
  return { favorited: favorite };
}

async function getUserFavorites(userId) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, itemType: 'EVENT' },
    orderBy: { createdAt: 'desc' },
    select: { itemId: true },
  });
  if (!favorites.length) return [];
  const events = await prisma.event.findMany({
    where: { id: { in: favorites.map((item) => item.itemId) }, status: { in: PUBLIC_STATUSES } },
    include: { category: true },
  });
  return events.map((event) => serializeEvent(event));
}

async function getOccurrences(idOrSlug, filters = {}) {
  const event = await prisma.event.findFirst({ where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } });
  if (!event) return null;
  const from = filters.from ? new Date(filters.from) : new Date();
  const to = filters.to ? new Date(filters.to) : new Date(Date.now() + 365 * 86400000);
  return generateOccurrences(event, from, to, Math.min(100, Number(filters.limit) || 20));
}

function first(row, keys) {
  const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ''), value]));
  for (const key of keys) {
    const value = normalized[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

async function categoryIdFromSlug(slug) {
  const normalized = slugify(slug || 'autre');
  const categories = await prisma.category.findMany({
    where: { module: EVENT_CATEGORY_MODULE, isActive: true },
    select: { id: true, slug: true, name: true },
  });
  const exact = categories.find((category) => category.slug === normalized);
  if (exact) return exact.id;
  const byName = categories.find((category) => slugify(category.name) === normalized);
  if (byName) return byName.id;
  return categories.find((category) => category.slug === 'autre')?.id || null;
}

async function importCsv(buffer, admin) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const results = { created: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < rows.length; i += 1) {
    try {
      const row = rows[i];
      const categorySlug = first(row, ['category', 'categorie', 'subcategory', 'type']) || 'autre';
      const payload = {
        title: first(row, ['title', 'titre', 'nom']),
        description: first(row, ['description']) || first(row, ['title', 'titre', 'nom']),
        categoryId: await categoryIdFromSlug(slugify(categorySlug)),
        organizerName: first(row, ['organizer', 'organisateur']) || 'Organisateur',
        organizerPhone: first(row, ['phone', 'telephone', 'contact']),
        city: first(row, ['city', 'ville']) || 'Kenitra',
        venueName: first(row, ['venue', 'lieu']),
        address: first(row, ['address', 'adresse']),
        startsAt: first(row, ['startsat', 'datedebut', 'debut']),
        endsAt: first(row, ['endsat', 'datefin', 'fin']),
        latitude: first(row, ['latitude', 'lat']),
        longitude: first(row, ['longitude', 'lng', 'lon']),
        status: 'PUBLISHED',
        source: 'CSV',
        sourceVerifiedAt: new Date().toISOString(),
      };
      const duplicate = await prisma.event.findFirst({
        where: {
          title: payload.title,
          organizerName: payload.organizerName,
          venueName: payload.venueName || null,
          startsAt: new Date(payload.startsAt),
        },
      });
      if (duplicate) {
        await updateEvent(duplicate.id, payload, admin);
        results.updated += 1;
      } else {
        await createEvent(payload, admin);
        results.created += 1;
      }
    } catch (error) {
      results.failed += 1;
      results.errors.push({ row: i + 2, message: error.message });
    }
  }
  return results;
}

function parseIcsDate(value) {
  if (!value) return '';
  const clean = value.replace(/Z$/, '');
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/);
  if (!match) return '';
  const [, y, m, d, h = '00', min = '00'] = match;
  return `${y}-${m}-${d}T${h}:${min}:00Z`;
}

async function importIcs(buffer, admin) {
  const text = buffer.toString('utf8');
  const blocks = text.split('BEGIN:VEVENT').slice(1).map((block) => block.split('END:VEVENT')[0]);
  const categoryId = await categoryIdFromSlug('autre');
  const results = { created: 0, updated: 0, failed: 0, errors: [] };

  for (let i = 0; i < blocks.length; i += 1) {
    const lines = Object.fromEntries(blocks[i].split(/\r?\n/).map((line) => {
      const index = line.indexOf(':');
      const key = line.slice(0, index).split(';')[0];
      return [key, line.slice(index + 1)];
    }));
    try {
      await createEvent({
        title: lines.SUMMARY || 'Evenement importe',
        description: lines.DESCRIPTION || lines.SUMMARY || 'Evenement importe',
        categoryId,
        organizerName: lines.ORGANIZER || 'Organisateur',
        city: 'Kenitra',
        venueName: lines.LOCATION || null,
        address: lines.LOCATION || null,
        startsAt: parseIcsDate(lines.DTSTART),
        endsAt: parseIcsDate(lines.DTEND),
        recurrenceRule: lines.RRULE ? `DTSTART:${lines.DTSTART}\nRRULE:${lines.RRULE}` : null,
        recurrenceType: lines.RRULE ? 'CUSTOM' : 'NONE',
        status: 'PUBLISHED',
        source: 'ICS',
        sourceUrl: lines.URL || null,
        sourceVerifiedAt: new Date().toISOString(),
      }, admin);
      results.created += 1;
    } catch (error) {
      results.failed += 1;
      results.errors.push({ row: i + 1, message: error.message });
    }
  }
  return results;
}

module.exports = {
  listEvents,
  getCategories,
  getEventByIdOrSlug,
  createEvent,
  updateEvent,
  deleteEvent,
  updateStatus,
  toggleFavorite,
  getUserFavorites,
  getOccurrences,
  importCsv,
  importIcs,
  generateOccurrences,
  slugify,
};
