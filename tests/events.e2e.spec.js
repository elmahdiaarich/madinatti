const { test, expect } = require('@playwright/test');

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const categories = [
  { id: 'cat-concert', name: 'Concert et musique', slug: 'concert-musique', formTemplate: { id: 'tmpl-music', name: 'Musique', fields: [] } },
  { id: 'cat-market', name: 'Marche et souk', slug: 'marche-souk', formTemplate: { id: 'tmpl-market', name: 'Gastronomie', fields: [] } },
];

const event = {
  id: 'event-1',
  slug: 'concert-test',
  title: 'Concert Test',
  description: 'Description evenement test',
  categoryId: 'cat-concert',
  categorySlug: 'concert-musique',
  categoryLabel: 'Concert et musique',
  organizerName: 'Org Test',
  eventMode: 'IN_PERSON',
  venueName: 'Place Test',
  city: 'Kenitra',
  latitude: 34.261,
  longitude: -6.5802,
  startsAt: '2026-08-15T19:00:00.000Z',
  endsAt: '2026-08-15T23:00:00.000Z',
  nextOccurrence: { startsAt: '2026-08-15T19:00:00.000Z', endsAt: '2026-08-15T23:00:00.000Z' },
  isFree: true,
  currency: 'MAD',
  status: 'PUBLISHED',
  verified: true,
  mainImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600"%3E%3Crect width="900" height="600" fill="%23a7d129"/%3E%3Ctext x="450" y="315" text-anchor="middle" font-size="44" fill="%2317250d"%3EConcert Test%3C/text%3E%3C/svg%3E',
};

test('events catalog filters, GPS search and create form use mocked API', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 34.261, longitude: -6.5802 });

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: 'user-1', name: 'User Test', email: 'user@example.com', role: 'business' } }),
    });
  });
  await page.route('**/api/events/categories', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: categories }) });
  });
  await page.route('**/api/events?**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [event], pagination: { page: 1, limit: 40, total: 1, totalPages: 1 } }),
    });
  });
  await page.route('**/api/events', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: event }) });
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [event], pagination: { page: 1, limit: 40, total: 1, totalPages: 1 } }),
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-token');
    window.__eventMarkerIcons = [];
    window.__leafletMaps = [];
    window.__clickLastLeafletMap = (lat, lng) => {
      const map = window.__leafletMaps[window.__leafletMaps.length - 1];
      map?.listeners?.click?.({ latlng: { lat, lng } });
    };
    window.L = {
      map: () => {
        const map = {
          listeners: {},
        setView() { return this; },
          on(name, cb) { this.listeners[name] = cb; return this; },
        remove() {},
        getCenter: () => ({ lat: 34.261, lng: -6.5802 }),
        getBounds: () => ({ getNorth: () => 34.3, getEast: () => -6.5, getSouth: () => 34.2, getWest: () => -6.7 }),
        fitBounds() {},
        };
        window.__leafletMaps.push(map);
        return map;
      },
      tileLayer: () => ({ addTo() {} }),
      icon: (options) => options,
      marker: (coords, options) => ({
        coords,
        options,
        addTo() { return this; },
        bindPopup() { return this; },
        on() {},
        remove() {},
        setLatLng(next) { this.coords = next; return this; },
      }),
      divIcon: (options) => {
        window.__eventMarkerIcons.push(options.html || '');
        return options;
      },
    };
  });

  const initialEventsResponse = page.waitForResponse((response) =>
    response.url().includes('/api/events') && response.request().method() === 'GET' && response.ok(),
  );
  await page.goto(`${FRONT_URL}/evenements`);
  await initialEventsResponse;
  await expect(page.getByText('Concert Test')).toBeVisible();
  await page.waitForFunction(() => window.__eventMarkerIcons?.some((html) => html.includes('<svg')));
  await page.getByRole('button', { name: /Autour de moi/i }).click();
  await expect(page.getByText('Place Test')).toBeVisible();

  await page.goto(`${FRONT_URL}/my-space/events/create`);
  await page.getByLabel('Titre', { exact: true }).fill('Concert Test');
  await page.getByLabel('Sous-sous-categorie').fill('Concert rock');
  await page.getByLabel('Organisateur').fill('Org Test');
  await page.getByLabel('Ville').fill('Kenitra');
  await page.getByLabel('Debut').fill('2026-08-15T19:00');
  await page.getByLabel('Fin').fill('2026-08-15T23:00');
  await page.getByLabel('Description', { exact: true }).fill('Description evenement test complete.');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page).toHaveURL(/\/my-space\/events/);
});

test('admin event creation selects a subcategory, loads its form, preserves common data when changing category and publishes', async ({ page }) => {
  const adminCategories = [
    {
      id: 'cat-culture',
      name: 'Culture',
      slug: 'culture',
      formTemplate: {
        id: 'tmpl-culture',
        name: 'Arts et scene',
        fields: [
          { id: 'field-program', fieldName: 'program', label: 'Programme', fieldType: 'textarea', required: true },
        ],
      },
    },
    {
      id: 'cat-sport',
      name: 'Sport',
      slug: 'sport',
      formTemplate: {
        id: 'tmpl-sport',
        name: 'Sport',
        fields: [
          { id: 'field-sport-type', fieldName: 'sportType', label: 'Discipline sportive', fieldType: 'text', required: true },
        ],
      },
    },
    {
      id: 'cat-family',
      name: 'Famille et enfants',
      slug: 'famille-enfants',
      formTemplate: {
        id: 'tmpl-family',
        name: 'Famille',
        fields: [
          { id: 'field-age', fieldName: 'targetAge', label: 'Age cible', fieldType: 'text', required: true },
        ],
      },
    },
  ];
  let postedPayload = null;

  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: 'admin-1', name: 'Admin', email: 'admin@example.com', role: 'admin' } }),
    });
  });
  await page.route('**/api/events/categories', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: adminCategories }) });
  });
  await page.route('**/api/events', async (route) => {
    if (route.request().method() === 'POST') {
      postedPayload = route.request().postDataJSON();
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { ...event, id: 'event-admin', ...postedPayload } }),
      });
      return;
    }
    await route.fallback();
  });
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-admin-token');
    window.__eventMarkerIcons = [];
    window.__leafletMaps = [];
    window.__clickLastLeafletMap = (lat, lng) => {
      const map = window.__leafletMaps[window.__leafletMaps.length - 1];
      map?.listeners?.click?.({ latlng: { lat, lng } });
    };
    window.L = {
      map: () => {
        const map = {
          listeners: {},
        setView() { return this; },
          on(name, cb) { this.listeners[name] = cb; return this; },
        remove() {},
        getCenter: () => ({ lat: 34.261, lng: -6.5802 }),
        getBounds: () => ({ getNorth: () => 34.3, getEast: () => -6.5, getSouth: () => 34.2, getWest: () => -6.7 }),
          flyTo() {},
        fitBounds() {},
        };
        window.__leafletMaps.push(map);
        return map;
      },
      tileLayer: () => ({ addTo() {} }),
      icon: (options) => options,
      marker: (coords, options) => ({
        coords,
        options,
        addTo() { return this; },
        bindPopup() { return this; },
        on() {},
        remove() {},
        setLatLng(next) { this.coords = next; return this; },
      }),
      divIcon: (options) => {
        window.__eventMarkerIcons.push(options.html || '');
        return options;
      },
    };
  });

  await page.goto(`${FRONT_URL}/admin/events/create`);
  await expect(page.getByRole('heading', { name: 'Choisir la sous-categorie' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuer' })).toBeDisabled();
  await page.getByPlaceholder('Rechercher une sous-categorie...').fill('cult');
  await page.getByRole('button', { name: /Culture/ }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByText('Culture')).toBeVisible();
  await expect(page.getByLabel(/Programme/)).toBeVisible();
  await page.getByLabel('Titre', { exact: true }).fill('Exposition Test');
  await page.getByLabel(/Programme/).fill('Vernissage et rencontre artistes');

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Changer de sous-categorie');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Modifier' }).click();
  await page.getByPlaceholder('Rechercher une sous-categorie...').fill('sport');
  await page.getByRole('button', { name: /^Sport/ }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByLabel('Titre', { exact: true })).toHaveValue('Exposition Test');
  await expect(page.getByLabel(/Discipline sportive/)).toBeVisible();
  await page.getByLabel('Sous-sous-categorie').fill('Tournoi quartier');
  await page.getByLabel(/Discipline sportive/).fill('Football');
  await page.getByLabel('Organisateur').fill('Service events');
  await page.getByLabel('Ville').fill('Kenitra');
  await page.evaluate(() => window.__clickLastLeafletMap(34.250001, -6.590001));
  await expect(page.getByLabel('Latitude')).toHaveValue('34.250001');
  await expect(page.getByLabel('Longitude')).toHaveValue('-6.590001');
  await page.getByLabel('Debut').fill('2026-08-15T19:00');
  await page.getByLabel('Fin').fill('2026-08-15T23:00');
  await page.getByLabel('Description', { exact: true }).fill('Description evenement admin complete.');
  await page.getByRole('button', { name: 'Publier' }).click();
  await expect(page).toHaveURL(/\/admin\/events/);

  expect(postedPayload.categoryId).toBe('cat-sport');
  expect(postedPayload.customSubsubcategory).toBe('Tournoi quartier');
  expect(postedPayload.eventFieldValues).toEqual({ sportType: 'Football' });
  expect(postedPayload.status).toBe('PUBLISHED');
  expect(postedPayload.latitude).toBe(34.250001);
  expect(postedPayload.longitude).toBe(-6.590001);
});
