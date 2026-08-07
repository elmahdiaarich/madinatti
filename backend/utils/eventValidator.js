const { EVENT_CATEGORY_MODULE } = require('../config/eventCategories');
const { isMoroccoCoordinate, toNumber } = require('./healthGeo');

const EVENT_MODES = ['IN_PERSON', 'ONLINE', 'HYBRID'];
const EVENT_RECURRENCE_TYPES = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'];
const EVENT_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'CANCELLED', 'POSTPONED', 'FINISHED'];
const SORTS = ['date', 'proximity', 'popularite', 'nouveaute'];

function parseBool(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isSafeUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function isEmptyDynamicValue(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function validateDynamicValue(field, value) {
  if (isEmptyDynamicValue(value)) return null;
  const type = field.fieldType;
  const rules = field.validationRules || {};

  if (['text', 'textarea'].includes(type)) {
    const text = String(value).trim();
    if (rules.minLength && text.length < rules.minLength) return `${field.label} trop court.`;
    if (rules.maxLength && text.length > rules.maxLength) return `${field.label} trop long.`;
    return null;
  }

  if (type === 'number') {
    const number = Number(value);
    if (!Number.isFinite(number)) return `${field.label} doit etre un nombre.`;
    if (rules.min !== undefined && number < Number(rules.min)) return `${field.label} invalide.`;
    if (rules.max !== undefined && number > Number(rules.max)) return `${field.label} invalide.`;
    return null;
  }

  if (type === 'checkbox') {
    if (typeof value !== 'boolean') return `${field.label} doit etre oui/non.`;
    return null;
  }

  if (type === 'select') {
    const options = Array.isArray(field.options) ? field.options : [];
    if (options.length && !options.includes(value)) return `${field.label} invalide.`;
    return null;
  }

  if (type === 'date') {
    if (!parseDate(value)) return `${field.label} invalide.`;
    return null;
  }

  return null;
}

function validateEventListQuery(query) {
  const errors = {};
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const lat = toNumber(query.lat);
  const lng = toNumber(query.lng);
  const radius = toNumber(query.radius) || 10000;
  const hasLat = query.lat !== undefined && query.lat !== '';
  const hasLng = query.lng !== undefined && query.lng !== '';
  const dateFrom = parseDate(query.dateFrom);
  const dateTo = parseDate(query.dateTo);
  const exactDate = parseDate(query.date);

  if (hasLat !== hasLng) errors.location = 'lat et lng doivent etre fournis ensemble.';
  if (hasLat && (lat === null || lat < -90 || lat > 90)) errors.lat = 'Latitude invalide.';
  if (hasLng && (lng === null || lng < -180 || lng > 180)) errors.lng = 'Longitude invalide.';
  if (lat !== null && lng !== null && !isMoroccoCoordinate(lat, lng)) {
    errors.location = 'Les coordonnees doivent etre situees au Maroc.';
  }
  if (radius <= 0 || radius > 100000) errors.radius = 'Le rayon doit etre compris entre 1 et 100000 metres.';
  if (query.eventMode && !EVENT_MODES.includes(query.eventMode)) errors.eventMode = 'Mode invalide.';
  if (query.sort && !SORTS.includes(query.sort)) errors.sort = 'Tri invalide.';
  if (query.status && !EVENT_STATUSES.includes(query.status)) errors.status = 'Statut invalide.';
  if (query.dateFrom && !dateFrom) errors.dateFrom = 'Date de debut invalide.';
  if (query.dateTo && !dateTo) errors.dateTo = 'Date de fin invalide.';
  if (query.date && !exactDate) errors.date = 'Date invalide.';
  if (dateFrom && dateTo && dateTo < dateFrom) errors.period = 'La date de fin doit etre apres la date de debut.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: {
      page,
      limit,
      query: typeof query.query === 'string' ? query.query.trim() : '',
      categorySlug: typeof query.category === 'string' ? query.category.trim() : '',
      city: typeof query.city === 'string' ? query.city.trim() : '',
      province: typeof query.province === 'string' ? query.province.trim() : '',
      region: typeof query.region === 'string' ? query.region.trim() : '',
      period: typeof query.period === 'string' ? query.period.trim() : '',
      dateFrom,
      dateTo,
      exactDate,
      isFree: parseBool(query.isFree),
      eventMode: query.eventMode || '',
      verified: parseBool(query.verified),
      lat,
      lng,
      radius,
      sort: query.sort || 'date',
      status: query.status || '',
      mine: parseBool(query.mine),
    },
  };
}

async function validateEventPayload(body, prisma, { partial = false } = {}) {
  const errors = {};
  const startsAt = parseDate(body.startsAt);
  const endsAt = parseDate(body.endsAt);
  const doorsOpenAt = parseDate(body.doorsOpenAt);
  const recurrenceEndsAt = parseDate(body.recurrenceEndsAt);
  const lat = toNumber(body.latitude);
  const lng = toNumber(body.longitude);
  const priceMin = toNumber(body.priceMin);
  const priceMax = toNumber(body.priceMax);
  const capacity = body.capacity === undefined || body.capacity === null || body.capacity === '' ? null : parseInt(body.capacity, 10);
  const categoryId = body.categoryId;
  let category = null;

  if (!partial || body.title !== undefined) {
    if (!body.title || String(body.title).trim().length < 3) errors.title = 'Titre requis.';
  }
  if (!partial || body.description !== undefined) {
    if (!body.description || String(body.description).trim().length < 10) errors.description = 'Description requise.';
  }
  if (!partial || body.organizerName !== undefined) {
    if (!body.organizerName || String(body.organizerName).trim().length < 2) errors.organizerName = 'Organisateur requis.';
  }
  if (!partial || body.city !== undefined) {
    if (!body.city || String(body.city).trim().length < 2) errors.city = 'Ville requise.';
  }
  if (!partial || body.categoryId !== undefined) {
    category = categoryId
      ? await prisma.category.findFirst({
          where: { id: categoryId, module: EVENT_CATEGORY_MODULE, isActive: true },
          include: {
            formTemplate: {
              include: {
                fields: {
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
          },
        })
      : null;
    if (!category) errors.categoryId = 'Categorie Evenements invalide.';
    else if (!category.formTemplate) errors.categoryId = 'Modele de formulaire introuvable pour cette sous-categorie.';
  }
  if (!partial || body.customSubsubcategory !== undefined) {
    if (!body.customSubsubcategory || String(body.customSubsubcategory).trim().length < 2) {
      errors.customSubsubcategory = 'Sous-sous-categorie requise.';
    }
  }
  if (!partial || body.startsAt !== undefined) {
    if (!startsAt) errors.startsAt = 'Date de debut invalide.';
  }
  if (!partial || body.endsAt !== undefined) {
    if (!endsAt) errors.endsAt = 'Date de fin invalide.';
  }
  if (startsAt && endsAt && endsAt <= startsAt) errors.endsAt = 'La fin doit etre apres le debut.';
  if (doorsOpenAt && startsAt && doorsOpenAt > startsAt) errors.doorsOpenAt = 'Ouverture des portes apres le debut.';
  if (body.recurrenceType !== undefined && !EVENT_RECURRENCE_TYPES.includes(body.recurrenceType)) {
    errors.recurrenceType = 'Type de recurrence invalide.';
  }
  if (recurrenceEndsAt && startsAt && recurrenceEndsAt < startsAt) {
    errors.recurrenceEndsAt = 'Fin de recurrence avant le debut.';
  }
  if (body.eventMode !== undefined && !EVENT_MODES.includes(body.eventMode)) errors.eventMode = 'Mode invalide.';
  if (body.status !== undefined && !EVENT_STATUSES.includes(body.status)) errors.status = 'Statut invalide.';
  if ((body.latitude !== undefined || body.longitude !== undefined) && !(body.latitude === null && body.longitude === null)) {
    if (lat === null || lng === null) errors.location = 'Latitude et longitude valides requises.';
    else if (!isMoroccoCoordinate(lat, lng)) errors.location = 'Coordonnees hors Maroc.';
  }
  if (priceMin !== null && priceMin < 0) errors.priceMin = 'Prix minimum negatif.';
  if (priceMax !== null && priceMax < 0) errors.priceMax = 'Prix maximum negatif.';
  if (priceMin !== null && priceMax !== null && priceMax < priceMin) errors.priceMax = 'Prix maximum inferieur au minimum.';
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < 0)) errors.capacity = 'Capacite invalide.';
  ['websiteUrl', 'onlineUrl', 'ticketUrl', 'mainImage', 'sourceUrl'].forEach((field) => {
    if (body[field] && !isSafeUrl(body[field])) errors[field] = 'Lien invalide.';
  });

  if (category?.formTemplate && (!partial || body.eventFieldValues !== undefined)) {
    const values = body.eventFieldValues && typeof body.eventFieldValues === 'object' && !Array.isArray(body.eventFieldValues)
      ? body.eventFieldValues
      : {};
    const fields = category.formTemplate.fields || [];
    const allowed = new Set(fields.map((field) => field.fieldName));
    for (const key of Object.keys(values)) {
      if (!allowed.has(key)) errors[`eventFieldValues.${key}`] = 'Champ non autorise pour cette sous-categorie.';
    }
    for (const field of fields) {
      const value = values[field.fieldName];
      if (field.required && body.status !== 'DRAFT' && isEmptyDynamicValue(value)) {
        errors[`eventFieldValues.${field.fieldName}`] = `${field.label} requis.`;
        continue;
      }
      const error = validateDynamicValue(field, value);
      if (error) errors[`eventFieldValues.${field.fieldName}`] = error;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

module.exports = {
  EVENT_MODES,
  EVENT_RECURRENCE_TYPES,
  EVENT_STATUSES,
  validateEventListQuery,
  validateEventPayload,
  parseDate,
  isSafeUrl,
};
