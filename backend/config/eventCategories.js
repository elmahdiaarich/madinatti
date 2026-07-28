const EVENT_CATEGORY_MODULE = 'events';

const EVENT_CATEGORY_DEFINITIONS = [
  ['THEATRE_SPECTACLE', 'theatre-spectacle', 'Theatre et spectacle'],
  ['CONCERT_MUSIQUE', 'concert-musique', 'Concert et musique'],
  ['FESTIVAL', 'festival', 'Festival'],
  ['MARCHE_SOUK', 'marche-souk', 'Marche et souk'],
  ['SALON_FOIRE', 'salon-foire', 'Salon et foire'],
  ['EXPOSITION', 'exposition', 'Exposition'],
  ['CINEMA_PROJECTION', 'cinema-projection', 'Cinema et projection'],
  ['CONFERENCE_SEMINAIRE', 'conference-seminaire', 'Conference et seminaire'],
  ['FORMATION_ATELIER', 'formation-atelier', 'Formation et atelier'],
  ['SPORT', 'sport', 'Sport'],
  ['CULTURE', 'culture', 'Culture'],
  ['RELIGIEUX', 'religieux', 'Religieux'],
  ['ASSOCIATIF', 'associatif', 'Associatif'],
  ['FAMILLE_ENFANTS', 'famille-enfants', 'Famille et enfants'],
  ['GASTRONOMIE', 'gastronomie', 'Gastronomie'],
  ['MODE_BEAUTE', 'mode-beaute', 'Mode et beaute'],
  ['TECHNOLOGIE_INNOVATION', 'technologie-innovation', 'Technologie et innovation'],
  ['ENTREPRENEURIAT_EMPLOI', 'entrepreneuriat-emploi', 'Entrepreneuriat et emploi'],
  ['TOURISME_PATRIMOINE', 'tourisme-patrimoine', 'Tourisme et patrimoine'],
  ['JEUX_ESPORT', 'jeux-esport', 'Jeux et esport'],
  ['VIE_NOCTURNE', 'vie-nocturne', 'Vie nocturne'],
  ['PORTES_OUVERTES', 'portes-ouvertes', 'Portes ouvertes'],
  ['BROCANTE_VIDE_GRENIER', 'brocante-vide-grenier', 'Brocante et vide-grenier'],
  ['AUTRE', 'autre', 'Autre'],
].map(([code, slug, label]) => ({ code, slug, label }));

const EVENT_CATEGORY_SLUGS = EVENT_CATEGORY_DEFINITIONS.map((item) => item.slug);
const EVENT_CATEGORY_MAP = Object.fromEntries(EVENT_CATEGORY_DEFINITIONS.map((item) => [item.slug, item]));

module.exports = {
  EVENT_CATEGORY_MODULE,
  EVENT_CATEGORY_DEFINITIONS,
  EVENT_CATEGORY_SLUGS,
  EVENT_CATEGORY_MAP,
};
