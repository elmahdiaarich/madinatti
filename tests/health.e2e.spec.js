const { test, expect } = require('@playwright/test');

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';
const HEALTH_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"%3E%3Crect width="1200" height="800" fill="%23e8f5d0"/%3E%3Ctext x="600" y="410" text-anchor="middle" font-size="52" fill="%232d5016"%3EPharmacie Centre%3C/text%3E%3C/svg%3E';

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
            images: [{ url: HEALTH_IMAGE, isCover: true }],
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
          images: [{ url: HEALTH_IMAGE, isCover: true }],
        },
      }),
    });
  });

  await page.addInitScript(() => {
    window.__healthMarkers = [];
    window.__healthLeafletIcons = [];
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
          constructor(options) {
            this.options = options;
            window.__healthMarkers.push(options);
          }
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
    window.L = {
      map: () => ({
        setView() { return this; },
        on() {},
        remove() {},
        getCenter: () => ({ lat: 33.5731, lng: -7.5898 }),
        getBounds: () => ({ getNorth: () => 33.6, getEast: () => -7.5, getSouth: () => 33.5, getWest: () => -7.7 }),
        fitBounds() {},
      }),
      tileLayer: () => ({ addTo() {} }),
      divIcon: (options) => {
        window.__healthLeafletIcons.push(options.html || '');
        return options;
      },
      marker: (coords, options) => ({
        coords,
        options,
        addTo() { return this; },
        bindPopup() { return this; },
        on() {},
        remove() {},
      }),
    };
  });

  await page.goto(`${FRONT_URL}/sante`);
  await page.getByRole('button', { name: 'Pharmacies', exact: true }).click();
  await page.getByRole('button', { name: /Autour de moi/i }).click();
  await expect(page.getByText('Pharmacie Centre')).toBeVisible();
  await expect(page.getByText('Boulevard Mohammed V')).toBeVisible();
  await page.waitForFunction(() =>
    window.__healthMarkers?.length > 0 || window.__healthLeafletIcons?.length > 0,
  );
  const markerResult = await page.evaluate(() => ({
    googleColor: window.__healthMarkers?.[0]?.icon?.fillColor || null,
    leafletHasIcon: window.__healthLeafletIcons?.some((html) => html.includes('<svg')) || false,
  }));
  expect(markerResult.googleColor === '#2D5016' || markerResult.leafletHasIcon).toBeTruthy();
  await page.getByRole('link', { name: /Details/i }).click();
  await expect(page.getByRole('heading', { name: 'Pharmacie Centre' })).toBeVisible();
  await expect(page.getByText('lundi: Ouvert 24h/24')).toBeVisible();
  await expect(page.getByRole('link', { name: /Itineraire/i })).toHaveAttribute('href', /google\.com\/maps\/dir/);

  await page.locator('main img').first().click();
  await expect(page.locator('[data-image-viewer="open"]')).toBeVisible();
  await expect(page.getByText('1200 x 800px')).toBeVisible();
  await page.getByRole('button', { name: 'Zoom plus' }).click();
  await expect(page.getByText('125%')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-image-viewer="open"]')).toHaveCount(0);
});
