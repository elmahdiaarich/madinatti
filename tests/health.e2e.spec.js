const { test, expect } = require('@playwright/test');

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

test('health search uses mocked API, geolocation, markers, detail and directions', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 33.5731, longitude: -7.5898 });

  await page.route('**/api/health/places**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [
          {
            id: 'mock-pharmacy',
            source: 'MADINATI',
            name: 'Pharmacie Centre',
            subcategory: 'pharmacy',
            address: 'Boulevard Mohammed V, Casablanca',
            latitude: 33.5731,
            longitude: -7.5898,
            phones: ['0522000000'],
            openNow: true,
            regularHours: { weekdayDescriptions: ['lundi: Ouvert 24h/24'] },
            googleMapsUri: 'https://www.google.com/maps/dir/?api=1&destination=33.5731,-7.5898',
            isVerified: true,
          },
        ],
      }),
    });
  });

  await page.route('**/api/health/places/mock-pharmacy', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          id: 'mock-pharmacy',
          source: 'MADINATI',
          name: 'Pharmacie Centre',
          subcategory: 'pharmacy',
          address: 'Boulevard Mohammed V, Casablanca',
          latitude: 33.5731,
          longitude: -7.5898,
          phones: ['0522000000'],
          openNow: true,
          regularHours: { weekdayDescriptions: ['lundi: Ouvert 24h/24'] },
          googleMapsUri: 'https://www.google.com/maps/dir/?api=1&destination=33.5731,-7.5898',
          isVerified: true,
        },
      }),
    });
  });

  await page.addInitScript(() => {
    window.google = {
      maps: {
        Map: class {
          constructor() { this.listeners = {}; }
          addListener(name, cb) { this.listeners[name] = cb; if (name === 'idle') setTimeout(cb, 0); }
          getBounds() {
            return {
              getNorthEast: () => ({ lat: () => 33.6, lng: () => -7.5 }),
              getSouthWest: () => ({ lat: () => 33.5, lng: () => -7.7 }),
            };
          }
          getCenter() { return { lat: () => 33.5731, lng: () => -7.5898 }; }
          fitBounds() {}
          setCenter() {}
        },
        Marker: class {
          constructor(options) { this.options = options; }
          setMap() {}
          addListener() {}
          getPosition() { return this.options.position; }
        },
        LatLngBounds: class {
          extend() {}
          getCenter() { return { lat: 33.5731, lng: -7.5898 }; }
        },
        Point: class {},
      },
    };
  });

  await page.goto(`${FRONT_URL}/sante`);
  await page.getByRole('button', { name: 'Pharmacies', exact: true }).click();
  await page.getByRole('button', { name: /Autour de moi/i }).click();
  await expect(page.getByText('Pharmacie Centre')).toBeVisible();
  await expect(page.getByText('Boulevard Mohammed V')).toBeVisible();
  await page.getByRole('link', { name: /Details/i }).click();
  await expect(page.getByRole('heading', { name: 'Pharmacie Centre' })).toBeVisible();
  await expect(page.getByText('lundi: Ouvert 24h/24')).toBeVisible();
  await expect(page.getByRole('link', { name: /Itineraire/i })).toHaveAttribute('href', /google\.com\/maps\/dir/);
});
