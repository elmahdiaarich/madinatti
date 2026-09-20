const test = require('node:test');
const assert = require('node:assert/strict');

function loadEventServiceWithMock(prisma) {
  const dbPath = require.resolve('../config/db');
  const servicePath = require.resolve('../services/eventService');
  delete require.cache[servicePath];
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: prisma,
  };
  return require('../services/eventService');
}

function makeEvent(overrides = {}) {
  return {
    id: 'event-1',
    title: 'Concert Test',
    titleAr: null,
    slug: 'concert-test',
    shortDescription: null,
    description: 'Description evenement test',
    categoryId: 'cat-1',
    customSubsubcategory: 'Exposition de peinture',
    organizerName: 'Org Test',
    organizerId: null,
    organizerPhone: null,
    organizerEmail: null,
    websiteUrl: null,
    eventMode: 'IN_PERSON',
    venueName: 'Place Test',
    address: 'Kenitra',
    city: 'Kenitra',
    province: 'Kenitra',
    region: 'Rabat-Sale-Kenitra',
    latitude: 34.261,
    longitude: -6.5802,
    onlineUrl: null,
    timezone: 'Africa/Casablanca',
    startsAt: new Date('2026-08-01T09:00:00Z'),
    endsAt: new Date('2026-08-01T11:00:00Z'),
    doorsOpenAt: null,
    recurrenceType: 'NONE',
    recurrenceRule: null,
    recurrenceEndsAt: null,
    isFree: true,
    priceMin: null,
    priceMax: null,
    currency: 'MAD',
    ticketUrl: null,
    reservationRequired: false,
    capacity: null,
    ageRestriction: null,
    accessibilityInformation: null,
    mainImage: null,
    gallery: [],
    status: 'PUBLISHED',
    featured: false,
    verified: true,
    publishedAt: new Date('2026-07-24T00:00:00Z'),
    source: null,
    sourceUrl: null,
    sourceVerifiedAt: null,
    createdById: 'owner-1',
    createdAt: new Date('2026-07-24T00:00:00Z'),
    updatedAt: new Date('2026-07-24T00:00:00Z'),
    category: {
      id: 'cat-1',
      slug: 'concert-musique',
      name: 'Concert et musique',
      formTemplate: {
        id: 'tmpl-1',
        name: 'Musique',
        fields: [
          { id: 'field-style', fieldName: 'musicStyle', label: 'Style musical', fieldType: 'text', required: true },
        ],
      },
    },
    fieldValues: [],
    ...overrides,
  };
}

test('event payload validation rejects inconsistent dates and negative prices', async () => {
  const { validateEventPayload } = require('../utils/eventValidator');
  const prisma = {
    category: {
      findFirst: async () => ({
        id: 'cat-1',
        formTemplate: {
          fields: [{ fieldName: 'musicStyle', label: 'Style musical', fieldType: 'text', required: true }],
        },
      }),
    },
  };

  const parsed = await validateEventPayload({
    title: 'Test',
    description: 'Description evenement test',
    categoryId: 'cat-1',
    customSubsubcategory: 'Concert rock',
    eventFieldValues: { musicStyle: 'Rock' },
    organizerName: 'Org',
    city: 'Kenitra',
    startsAt: '2026-08-02T12:00:00Z',
    endsAt: '2026-08-02T11:00:00Z',
    priceMin: -1,
  }, prisma);

  assert.equal(parsed.valid, false);
  assert.ok(parsed.errors.endsAt);
  assert.ok(parsed.errors.priceMin);
});

test('event payload validation requires form template and dynamic required fields', async () => {
  const { validateEventPayload } = require('../utils/eventValidator');
  const prisma = {
    category: {
      findFirst: async () => ({
        id: 'cat-1',
        formTemplate: {
          fields: [
            { fieldName: 'sportType', label: 'Discipline sportive', fieldType: 'text', required: true },
            { fieldName: 'competitionLevel', label: 'Niveau', fieldType: 'select', required: false, options: ['Loisir'] },
          ],
        },
      }),
    },
  };

  const parsed = await validateEventPayload({
    title: 'Tournoi Test',
    description: 'Description evenement test',
    categoryId: 'cat-1',
    customSubsubcategory: 'Tournoi quartier',
    organizerName: 'Org',
    city: 'Kenitra',
    startsAt: '2026-08-02T12:00:00Z',
    endsAt: '2026-08-02T14:00:00Z',
    eventFieldValues: { competitionLevel: 'Expert' },
  }, prisma);

  assert.equal(parsed.valid, false);
  assert.ok(parsed.errors['eventFieldValues.sportType']);
  assert.ok(parsed.errors['eventFieldValues.competitionLevel']);
});

test('event recurrence generates weekly occurrences without extra rows', () => {
  const { generateOccurrences } = require('../services/eventService');
  const event = makeEvent({
    recurrenceType: 'WEEKLY',
    recurrenceRule: 'FREQ=WEEKLY;BYDAY=SA',
    recurrenceEndsAt: new Date('2026-08-31T00:00:00Z'),
  });

  const occurrences = generateOccurrences(
    event,
    new Date('2026-08-01T00:00:00Z'),
    new Date('2026-08-31T00:00:00Z'),
    10,
  );

  assert.equal(occurrences.length, 5);
  assert.equal(occurrences[0].startsAt, '2026-08-01T09:00:00.000Z');
});

test('non-owner cannot update an event', async () => {
  const prisma = {
    event: {
      findUnique: async () => makeEvent({ createdById: 'owner-1' }),
    },
  };
  const eventService = loadEventServiceWithMock(prisma);

  await assert.rejects(
    () => eventService.updateEvent('event-1', { title: 'Nope' }, { userId: 'other', role: 'business' }),
    /FORBIDDEN/,
  );
});

test('event create derives mainImage from gallery cover and stores a single cover', async () => {
  let createdData;
  let createdEvent = null;
  let dynamicRows = [];
  const prisma = {
    event: {
      findUnique: async ({ where }) => (where.id ? createdEvent : null),
      create: async ({ data }) => {
        createdData = data;
        createdEvent = makeEvent({ ...data, id: 'event-images-1' });
        return createdEvent;
      },
    },
    category: {
      findFirst: async () => makeEvent().category,
    },
    eventFieldValue: {
      deleteMany: async () => ({}),
      createMany: async ({ data }) => {
        dynamicRows = data;
        return { count: data.length };
      },
    },
  };
  const eventService = loadEventServiceWithMock(prisma);

  const created = await eventService.createEvent({
    status: 'PUBLISHED',
    verified: true,
    featured: true,
    organizerId: 'other-user',
    title: 'Concert Images Test',
    description: 'Description evenement images test',
    categoryId: 'cat-1',
    customSubsubcategory: 'Concert rock',
    eventFieldValues: { musicStyle: 'Rock' },
    organizerName: 'Org Test',
    city: 'Kenitra',
    startsAt: '2026-08-15T19:00:00.000Z',
    endsAt: '2026-08-15T23:00:00.000Z',
    gallery: [
      { url: 'https://example.com/a.jpg' },
      { url: 'https://example.com/b.jpg', isCover: true },
      { url: 'https://example.com/c.jpg', isCover: true },
    ],
  }, { userId: 'owner-1', role: 'business' });

  assert.equal(created.mainImage, 'https://example.com/b.jpg');
  assert.equal(createdData.status, 'PENDING_REVIEW');
  assert.equal(createdData.verified, false);
  assert.equal(createdData.featured, false);
  assert.equal(createdData.organizerId, 'owner-1');
  assert.equal(createdData.mainImage, 'https://example.com/b.jpg');
  assert.deepEqual(createdData.gallery.map((image) => image.isCover), [false, true, false]);
  assert.equal(dynamicRows.length, 1);
  assert.equal(dynamicRows[0].value, 'Rock');
});

test('event list supports city, date and proximity filtering', async () => {
  const prisma = {
    event: {
      findMany: async ({ where }) => {
        assert.deepEqual(where.status, { in: ['PUBLISHED', 'CANCELLED', 'POSTPONED'] });
        assert.ok(where.city);
        assert.ok(where.latitude);
        return [
          makeEvent(),
          makeEvent({ id: 'event-2', latitude: 35.7, longitude: -5.8, city: 'Tanger' }),
        ];
      },
    },
    favorite: {
      groupBy: async () => [],
    },
  };
  const eventService = loadEventServiceWithMock(prisma);

  const result = await eventService.listEvents({
    page: 1,
    limit: 10,
    city: 'Kenitra',
    lat: 34.261,
    lng: -6.5802,
    radius: 5000,
    sort: 'proximity',
    dateFrom: new Date('2026-08-01T00:00:00Z'),
    dateTo: new Date('2026-08-02T00:00:00Z'),
  });

  assert.equal(result.data.length, 1);
  assert.equal(result.data[0].id, 'event-1');
});
