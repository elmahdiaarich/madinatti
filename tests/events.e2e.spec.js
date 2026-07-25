const { test, expect } = require('@playwright/test');

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const categories = [
  { id: 'cat-concert', name: 'Concert et musique', slug: 'concert-musique' },
  { id: 'cat-market', name: 'Marche et souk', slug: 'marche-souk' },
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
    window.L = {
      map: () => ({
        setView() { return this; },
        on() {},
        remove() {},
        getCenter: () => ({ lat: 34.261, lng: -6.5802 }),
        getBounds: () => ({ getNorth: () => 34.3, getEast: () => -6.5, getSouth: () => 34.2, getWest: () => -6.7 }),
        fitBounds() {},
      }),
      tileLayer: () => ({ addTo() {} }),
      icon: (options) => options,
      marker: () => ({ addTo() { return this; }, bindPopup() { return this; }, on() {}, remove() {} }),
      divIcon: (options) => options,
    };
  });

  const initialEventsResponse = page.waitForResponse((response) =>
    response.url().includes('/api/events') && response.request().method() === 'GET' && response.ok(),
  );
  await page.goto(`${FRONT_URL}/evenements`);
  await initialEventsResponse;
  await expect(page.getByText('Concert Test')).toBeVisible();
  await page.getByRole('button', { name: /Autour de moi/i }).click();
  await expect(page.getByText('Place Test')).toBeVisible();

  await page.goto(`${FRONT_URL}/my-space/events/create`);
  await page.getByLabel('Titre', { exact: true }).fill('Concert Test');
  await page.getByLabel('Organisateur').fill('Org Test');
  await page.getByLabel('Ville').fill('Kenitra');
  await page.getByLabel('Debut').fill('2026-08-15T19:00');
  await page.getByLabel('Fin').fill('2026-08-15T23:00');
  await page.getByLabel('Description', { exact: true }).fill('Description evenement test complete.');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(page).toHaveURL(/\/my-space\/events/);
});
