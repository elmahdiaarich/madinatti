const prisma = require('../config/db');
const XLSX = require('xlsx');
const googlePlaces = require('./googlePlacesClient');
const { HEALTH_SUBCATEGORIES, HEALTH_SUBCATEGORY_MAP } = require('../config/healthCategories');
const { normalizeGooglePlace, normalizeLocalPlace } = require('./healthPlaceNormalizer');
const { boundingBox, haversineMeters } = require('../utils/healthGeo');

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(name) {
  const base = slugify(name) || 'health-place';
  let slug = base;
  let i = 2;
  while (await prisma.healthPlace.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

function currentUserId(user) {
  return user?.userId || user?.id || null;
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

function normalizePhones(data) {
  if (Array.isArray(data.phones)) {
    return data.phones.map((phone) => String(phone).trim()).filter(Boolean);
  }
  if (data.phone !== undefined) {
    const phone = String(data.phone || '').trim();
    return phone ? [phone] : [];
  }
  return undefined;
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
  return normalized.map((image, index) => ({ ...image, isCover: index === normalized.findIndex((item) => item.isCover) }));
}

function addDistance(place, lat, lng) {
  if (lat == null || lng == null || place.latitude == null || place.longitude == null) return place;
  return {
    ...place,
    distanceMeters: haversineMeters(lat, lng, Number(place.latitude), Number(place.longitude)),
  };
}

function dedupePlaces(places) {
  const byKey = new Map();
  for (const place of places) {
    const key = place.googlePlaceId
      ? `google:${place.googlePlaceId}`
      : `local:${String(place.name).toLowerCase()}|${place.latitude}|${place.longitude}|${String(place.address).toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing || (place.source === 'MADINATI' && existing.source === 'GOOGLE')) {
      byKey.set(key, place);
    }
  }
  return [...byKey.values()];
}

async function searchLocalPlaces(filters) {
  const where = {
    status: 'APPROVED',
    ...(filters.subcategory && { subcategory: filters.subcategory }),
    ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
    ...(filters.query && {
      OR: [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { address: { contains: filters.query, mode: 'insensitive' } },
      ],
    }),
  };

  if (filters.lat != null && filters.lng != null) {
    const box = boundingBox(filters.lat, filters.lng, filters.radius);
    where.latitude = { gte: box.minLat, lte: box.maxLat };
    where.longitude = { gte: box.minLng, lte: box.maxLng };
  }
  if (filters.openNow) {
    where.OR = [...(where.OR || []), { openNow: true }, { openNow: null }];
  }

  const local = await prisma.healthPlace.findMany({
    where,
    orderBy: [{ isVerified: 'desc' }, { createdAt: 'desc' }],
    take: Math.max(filters.limit, 50),
  });

  return local
    .map((p) => normalizeLocalPlace(p))
    .map((p) => addDistance(p, filters.lat, filters.lng))
    .filter((p) => p.distanceMeters == null || p.distanceMeters <= filters.radius);
}

async function listAdminPlaces(filters = {}) {
  const page = Math.max(1, parseInt(filters.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
  const where = {
    ...(filters.subcategory && { subcategory: filters.subcategory }),
    ...(filters.city && { city: { contains: filters.city, mode: 'insensitive' } }),
    ...(filters.status && filters.status !== 'all' && { status: filters.status }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { neighborhood: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.healthPlace.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.healthPlace.count({ where }),
  ]);

  return {
    data: data.map((p) => normalizeLocalPlace(p)),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

async function searchGooglePlaces(filters) {
  if (!process.env.GOOGLE_MAPS_SERVER_API_KEY) return { places: [], warning: null };
  const subcategories = filters.subcategory
    ? [HEALTH_SUBCATEGORY_MAP[filters.subcategory]]
    : HEALTH_SUBCATEGORIES;
  const collected = [];

  try {
    for (const subcategory of subcategories) {
      if (filters.lat != null && filters.lng != null && subcategory.googleTypes.length) {
        const places = await googlePlaces.searchNearby({
          lat: filters.lat,
          lng: filters.lng,
          radius: filters.radius,
          types: subcategory.googleTypes,
          openNow: filters.openNow,
          limit: filters.limit,
        });
        collected.push(...places.map((p) => normalizeGooglePlace(p, subcategory.slug)));
      }

      const textBase = filters.query || filters.city
        ? [filters.query, subcategory.label, filters.city, 'Maroc'].filter(Boolean).join(' ')
        : subcategory.textQueries[0];
      const textPlaces = await googlePlaces.searchText({
        textQuery: textBase,
        lat: filters.lat,
        lng: filters.lng,
        radius: filters.radius,
        openNow: filters.openNow,
        limit: filters.limit,
      });
      collected.push(...textPlaces.map((p) => normalizeGooglePlace(p, subcategory.slug)));
    }
  } catch (error) {
    return {
      places: [],
      warning: error.code === 'ECONNABORTED' ? 'Google Places timeout.' : 'Google Places indisponible.',
    };
  }

  return {
    places: collected.map((p) => addDistance(p, filters.lat, filters.lng)),
    warning: null,
  };
}

async function searchPlaces(filters) {
  const [local, google] = await Promise.all([
    searchLocalPlaces(filters),
    searchGooglePlaces(filters),
  ]);
  const merged = dedupePlaces([...local, ...google.places])
    .filter((p) => p.distanceMeters == null || p.distanceMeters <= filters.radius)
    .sort((a, b) => {
      if (a.distanceMeters != null && b.distanceMeters != null) return a.distanceMeters - b.distanceMeters;
      if (a.source !== b.source) return a.source === 'MADINATI' ? -1 : 1;
      return String(a.name).localeCompare(String(b.name));
    })
    .slice(0, filters.limit);

  return { data: merged, count: merged.length, warning: google.warning };
}

async function getPlaceById(id) {
  const local = await prisma.healthPlace.findFirst({
    where: { OR: [{ id }, { googlePlaceId: id }] },
  });
  if (local) return normalizeLocalPlace(local);

  if (!process.env.GOOGLE_MAPS_SERVER_API_KEY) return null;
  try {
    const place = await googlePlaces.getDetails(id);
    return normalizeGooglePlace(place);
  } catch {
    return null;
  }
}

async function createPlace(data, user) {
  const category = await prisma.category.findUnique({ where: { slug: data.subcategory } }).catch(() => null);
  const isAdmin = user?.role === 'admin';
  const userId = currentUserId(user);
  const status = isAdmin && data.status ? data.status : isAdmin ? 'APPROVED' : 'PENDING';
  const verified = isAdmin && status === 'APPROVED';
  const created = await prisma.healthPlace.create({
    data: {
      name: data.name.trim(),
      slug: await uniqueSlug(data.name),
      subcategory: data.subcategory,
      categoryId: category?.id || null,
      source: data.source === 'IMPORT' ? 'IMPORT' : 'MADINATI',
      description: optionalString(data.description),
      address: optionalString(data.address),
      neighborhood: optionalString(data.neighborhood),
      city: optionalString(data.city),
      region: optionalString(data.region),
      postalCode: optionalString(data.postalCode),
      latitude: optionalDecimal(data.latitude),
      longitude: optionalDecimal(data.longitude),
      phones: normalizePhones(data) || [],
      contactEmail: optionalString(data.contactEmail),
      website: optionalString(data.website),
      images: normalizeImages(data.images),
      regularHours: data.regularHours || null,
      openNow: data.openNow ?? null,
      ownerId: userId,
      status,
      isVerified: verified,
      reviewedAt: verified ? new Date() : null,
      reviewedBy: verified ? userId : null,
    },
  });
  return normalizeLocalPlace(created);
}

async function updatePlace(id, data, user) {
  const existing = await prisma.healthPlace.findUnique({ where: { id } });
  if (!existing) return null;
  const isAdmin = user?.role === 'admin';
  const userId = currentUserId(user);
  if (!isAdmin && existing.ownerId !== userId) {
    const err = new Error('FORBIDDEN');
    err.status = 403;
    throw err;
  }
  const update = {
    name: data.name?.trim(),
    subcategory: data.subcategory,
    description: optionalString(data.description),
    address: optionalString(data.address),
    neighborhood: optionalString(data.neighborhood),
    city: optionalString(data.city),
    region: optionalString(data.region),
    postalCode: optionalString(data.postalCode),
    latitude: data.latitude === undefined ? undefined : optionalDecimal(data.latitude),
    longitude: data.longitude === undefined ? undefined : optionalDecimal(data.longitude),
    phones: normalizePhones(data),
    contactEmail: optionalString(data.contactEmail),
    website: optionalString(data.website),
    images: data.images === undefined ? undefined : normalizeImages(data.images),
    regularHours: data.regularHours,
    openNow: data.openNow,
    status: isAdmin ? data.status : 'PENDING',
  };
  Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
  if (update.name && update.name !== existing.name) update.slug = await uniqueSlug(update.name);
  if (update.subcategory && update.subcategory !== existing.subcategory) {
    const category = await prisma.category.findUnique({ where: { slug: update.subcategory } }).catch(() => null);
    update.categoryId = category?.id || null;
  }
  if (isAdmin && update.status !== undefined) {
    update.isVerified = update.status === 'APPROVED';
    update.reviewedAt = new Date();
    update.reviewedBy = userId;
  }
  if (!isAdmin) {
    update.isVerified = false;
    update.reviewedAt = null;
    update.reviewedBy = null;
  }

  const updated = await prisma.healthPlace.update({ where: { id }, data: update });
  return normalizeLocalPlace(updated);
}

async function deletePlace(id) {
  const existing = await prisma.healthPlace.findUnique({ where: { id } });
  if (!existing) return null;
  await prisma.healthPlace.delete({ where: { id } });
  return normalizeLocalPlace(existing);
}

function normalizeHeader(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

const SUBCATEGORY_ALIASES = {
  clinique: 'hospital-clinic',
  cliniques: 'hospital-clinic',
  hopital: 'hospital-clinic',
  hopitaux: 'hospital-clinic',
  medecine: 'doctor-office',
  medecin: 'doctor-office',
  medecins: 'doctor-office',
  cabinet: 'doctor-office',
  pharmacie: 'pharmacy',
  pharmacies: 'pharmacy',
  para: 'parapharmacy',
  parapharmacie: 'parapharmacy',
  parapharmacies: 'parapharmacy',
  laboratoire: 'medical-laboratory',
  laboratoires: 'medical-laboratory',
  dentiste: 'dentist',
  dentistes: 'dentist',
  radiologie: 'radiology-center',
};

function valueFrom(row, keys) {
  for (const key of keys) {
    const found = Object.keys(row).find((k) => normalizeHeader(k) === key);
    if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== '') {
      return String(row[found]).trim();
    }
  }
  return '';
}

function parseImages(raw) {
  if (!raw) return [];
  return String(raw)
    .split(/[;,|\n]/)
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((url, index) => ({ url, isCover: index === 0 }));
}

function buildHours(row) {
  const hourTypeRaw = valueFrom(row, ['typedhoraire', 'typehoraire', 'horairetype', 'horaires']);
  const hourType = /continu/i.test(hourTypeRaw) ? 'continuous' : 'normal';
  const open1 = valueFrom(row, ['heuredouverture', 'heureouverture', 'ouverture', 'open', 'open1']);
  const close1 = valueFrom(row, ['heuredefermeture', 'heurefermeture', 'fermeture', 'close', 'close1']);
  const open2 = valueFrom(row, ['heuredouverture2', 'heureouverture2', 'ouverture2', 'open2']);
  const close2 = valueFrom(row, ['heuredefermeture2', 'heurefermeture2', 'fermeture2', 'close2']);

  const slots = [];
  if (open1 && close1) slots.push({ open: open1, close: close1 });
  if (open2 && close2) slots.push({ open: open2, close: close2 });

  return {
    type: hourType,
    slots,
    weekdayDescriptions: slots.length
      ? [`${hourType === 'continuous' ? 'Horaire continu' : 'Horaire normal'}: ${slots.map((s) => `${s.open}-${s.close}`).join(' / ')}`]
      : [],
  };
}

function rowToPayload(row) {
  const rawType = valueFrom(row, ['sante', 'categorie', 'category', 'type', 'specialite']);
  const aliasKey = normalizeHeader(rawType);
  const subcategory = SUBCATEGORY_ALIASES[aliasKey] || rawType || '';
  const name = valueFrom(row, ['nom', 'name', 'etablissement']);
  const neighborhood = valueFrom(row, ['quartier', 'neighborhood']);
  const city = valueFrom(row, ['ville', 'city']) || (valueFrom(row, ['keni', 'kenitra']) ? 'Kenitra' : 'Kenitra');
  const contact = valueFrom(row, ['contact', 'telephone', 'tel', 'phone']);
  const website = valueFrom(row, ['siteweb', 'website', 'url']);
  const email = valueFrom(row, ['email', 'mail']);
  const address = valueFrom(row, ['adresse', 'address']) || [neighborhood, city].filter(Boolean).join(', ');
  const latitude = valueFrom(row, ['latitude', 'lat']);
  const longitude = valueFrom(row, ['longitude', 'lng', 'lon']);
  const images = parseImages(valueFrom(row, ['photos', 'photo', 'images']));
  const regularHours = buildHours(row);

  return {
    name,
    subcategory,
    neighborhood,
    city,
    address,
    phone: contact,
    contactEmail: email,
    website,
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    images,
    regularHours,
    openNow: null,
  };
}

function readRowsFromBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

async function importPlaces(fileBuffer, admin) {
  const rows = readRowsFromBuffer(fileBuffer);
  const results = { created: 0, updated: 0, failed: 0, errors: [] };
  const adminId = currentUserId(admin);

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const payload = rowToPayload(row);
    if (!payload.name || !HEALTH_SUBCATEGORY_MAP[payload.subcategory] || !payload.neighborhood || !payload.phone) {
      results.failed += 1;
      results.errors.push({ row: i + 2, message: 'Nom, categorie/type, quartier et contact sont obligatoires.' });
      continue;
    }

    try {
      const slug = slugify(`${payload.name}-${payload.city}-${payload.neighborhood}`);
      const category = await prisma.category.findUnique({ where: { slug: payload.subcategory } }).catch(() => null);
      const existing = await prisma.healthPlace.findUnique({ where: { slug } });
      const data = {
        ...payload,
        slug,
        categoryId: category?.id || null,
        source: 'MADINATI',
        status: 'APPROVED',
        isVerified: true,
        country: 'MA',
        reviewedAt: new Date(),
        reviewedBy: adminId,
        phones: [payload.phone],
        googleMapsUri: payload.latitude && payload.longitude
          ? `https://www.google.com/maps/dir/?api=1&destination=${payload.latitude},${payload.longitude}`
          : null,
      };
      delete data.phone;

      if (existing) {
        await prisma.healthPlace.update({ where: { id: existing.id }, data });
        results.updated += 1;
      } else {
        await prisma.healthPlace.create({ data });
        results.created += 1;
      }
    } catch (error) {
      results.failed += 1;
      results.errors.push({ row: i + 2, message: error.message });
    }
  }

  return results;
}

async function moderatePlace(id, data, admin) {
  const adminId = currentUserId(admin);
  return prisma.healthPlace.update({
    where: { id },
    data: {
      status: data.status,
      isVerified: data.isVerified ?? data.status === 'APPROVED',
      adminNotes: data.adminNotes,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    },
  });
}

module.exports = {
  searchPlaces,
  listAdminPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace,
  importPlaces,
  moderatePlace,
  dedupePlaces,
  searchLocalPlaces,
  searchGooglePlaces,
};
