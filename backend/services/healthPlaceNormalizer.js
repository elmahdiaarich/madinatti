const { HEALTH_SUBCATEGORY_MAP } = require('../config/healthCategories');

function firstText(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.text || null;
}

function normalizeOpeningHours(hours) {
  if (!hours) return null;
  return {
    openNow: hours.openNow ?? null,
    weekdayDescriptions: hours.weekdayDescriptions || [],
    periods: hours.periods || [],
    nextOpenTime: hours.nextOpenTime || null,
    nextCloseTime: hours.nextCloseTime || null,
  };
}

function inferSubcategory(types = []) {
  if (types.includes('pharmacy') || types.includes('drugstore')) return 'pharmacy';
  if (types.includes('dentist') || types.includes('dental_clinic')) return 'dentist';
  if (types.includes('doctor')) return 'doctor-office';
  if (types.includes('hospital') || types.includes('general_hospital')) return 'hospital-clinic';
  return null;
}

function cityFromAddressComponents(components = []) {
  const locality = components.find((c) => c.types?.includes('locality'));
  const admin2 = components.find((c) => c.types?.includes('administrative_area_level_2'));
  return firstText(locality?.longText) || firstText(admin2?.longText) || null;
}

function postalCodeFromAddressComponents(components = []) {
  const item = components.find((c) => c.types?.includes('postal_code'));
  return firstText(item?.longText) || null;
}

function normalizeGooglePlace(place, fallbackSubcategory) {
  const types = place.types || [];
  const subcategory = fallbackSubcategory || inferSubcategory(types) || 'doctor-office';
  const currentHours = normalizeOpeningHours(place.currentOpeningHours);
  const regularHours = normalizeOpeningHours(place.regularOpeningHours);

  return {
    id: place.id,
    googlePlaceId: place.id,
    source: 'GOOGLE',
    name: firstText(place.displayName) || 'Etablissement de sante',
    subcategory,
    subcategoryLabel: HEALTH_SUBCATEGORY_MAP[subcategory]?.label || subcategory,
    googleTypes: types,
    address: place.formattedAddress || null,
    city: cityFromAddressComponents(place.addressComponents),
    postalCode: postalCodeFromAddressComponents(place.addressComponents),
    country: 'MA',
    latitude: place.location?.latitude ?? null,
    longitude: place.location?.longitude ?? null,
    phones: [place.nationalPhoneNumber, place.internationalPhoneNumber].filter(Boolean),
    website: place.websiteUri || null,
    googleMapsUri: place.googleMapsUri || null,
    businessStatus: place.businessStatus || null,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    regularHours,
    currentHours,
    openNow: currentHours?.openNow ?? regularHours?.openNow ?? null,
    isVerified: false,
    lastGoogleRefreshAt: new Date().toISOString(),
    attribution: 'Google',
  };
}

function normalizeLocalPlace(place, distanceMeters = null) {
  return {
    id: place.id,
    googlePlaceId: place.googlePlaceId,
    source: place.source,
    name: place.name,
    subcategory: place.subcategory,
    subcategoryLabel: HEALTH_SUBCATEGORY_MAP[place.subcategory]?.label || place.subcategory,
    googleTypes: place.googleTypes || [],
    description: place.description,
    address: place.address,
    neighborhood: place.neighborhood,
    city: place.city,
    region: place.region,
    postalCode: place.postalCode,
    country: place.country,
    latitude: place.latitude == null ? null : Number(place.latitude),
    longitude: place.longitude == null ? null : Number(place.longitude),
    phones: place.phones || [],
    contactEmail: place.contactEmail,
    website: place.website,
    images: place.images || [],
    googleMapsUri: place.googleMapsUri,
    businessStatus: place.businessStatus,
    rating: place.rating == null ? null : Number(place.rating),
    userRatingCount: place.userRatingCount,
    regularHours: place.regularHours,
    currentHours: place.currentHours,
    openNow: place.openNow,
    isVerified: place.isVerified,
    lastGoogleRefreshAt: place.lastGoogleRefreshAt,
    createdAt: place.createdAt,
    updatedAt: place.updatedAt,
    distanceMeters,
    attribution: place.source === 'GOOGLE' ? 'Google' : 'MADINATI',
  };
}

module.exports = {
  normalizeGooglePlace,
  normalizeLocalPlace,
  normalizeOpeningHours,
  inferSubcategory,
};
