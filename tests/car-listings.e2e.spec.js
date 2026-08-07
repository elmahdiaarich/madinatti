const { test, expect } = require('@playwright/test');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const USER_TOKEN = process.env.USER_TOKEN;

const REQUIRED_CATEGORIES = ['Voitures', 'Motos', 'Utilitaires', 'Camions', 'Bateaux', 'Jetski'];

const now = Date.now();
const TITLE_PREFIX = `E2E-CARS-${now}`;

const IMAGE_URL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"%3E%3Crect width="1200" height="800" fill="%232d5016"/%3E%3Ctext x="600" y="410" text-anchor="middle" font-size="52" fill="white"%3EMadinatti Auto%3C/text%3E%3C/svg%3E';

const listingsSeed = [
  { category: 'Voitures', title: 'Toyota Corolla', make: 'Toyota', model: 'Corolla', year: 2020, bodyType: 'SEDAN', price: 185000 },
  { category: 'Voitures', title: 'BMW X5', make: 'BMW', model: 'X5', year: 2019, bodyType: 'SUV', price: 420000 },
  { category: 'Motos', title: 'Yamaha MT-07', make: 'Yamaha', model: 'MT-07', year: 2021, bodyType: 'OTHER', price: 95000 },
  { category: 'Utilitaires', title: 'Renault Kangoo', make: 'Renault', model: 'Kangoo', year: 2018, bodyType: 'VAN', price: 130000 },
  { category: 'Camions', title: 'Mercedes Actros', make: 'Mercedes', model: 'Actros', year: 2017, bodyType: 'VAN', price: 560000 },
  { category: 'Bateaux', title: 'Bayliner Element', make: 'Bayliner', model: 'Element', year: 2020, bodyType: 'OTHER', price: 240000 },
  { category: 'Jetski', title: 'Sea-Doo Spark', make: 'Sea-Doo', model: 'Spark', year: 2022, bodyType: 'OTHER', price: 88000 },
  { category: 'Voitures', title: 'Dacia Duster', make: 'Dacia', model: 'Duster', year: 2021, bodyType: 'SUV', price: 210000 },
  { category: 'Motos', title: 'Honda CB500F', make: 'Honda', model: 'CB500F', year: 2020, bodyType: 'OTHER', price: 78000 },
  { category: 'Bateaux', title: 'Quicksilver Activ 555', make: 'Quicksilver', model: 'Activ 555', year: 2019, bodyType: 'OTHER', price: 195000 },
];

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-e2e-test': 'true',
  };
}

async function expectOk(response) {
  expect(response.ok(), `${response.status()} ${response.url()} failed: ${await response.text()}`).toBeTruthy();
}

async function getJson(response) {
  await expectOk(response);
  return response.json();
}

function listingPayload(item, categoryId) {
  return {
    categoryId,
    listingType: 'SALE',
    condition: 'USED',
    title: `${TITLE_PREFIX} ${item.title}`,
    description: `${TITLE_PREFIX} annonce automobile de test pour ${item.make} ${item.model}.`,
    make: item.make,
    model: item.model,
    year: item.year,
    mileage: 42000,
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    bodyType: item.bodyType,
    price: item.price,
    city: 'Casablanca',
    region: 'Casablanca-Settat',
    location: 'Casablanca',
    latitude: 33.5731,
    longitude: -7.5898,
    images: [{ url: IMAGE_URL, isCover: true }],
    features: { e2e: true },
  };
}

test('car create form map click writes exact latitude and longitude', async ({ page }) => {
  test.skip(!USER_TOKEN, 'USER_TOKEN is required');

  await page.route('**/api/cars/categories', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [{ id: 'cat-car', name: 'Voitures', slug: 'voitures', module: 'automobile' }] }),
    });
  });
  await page.addInitScript((token) => {
    localStorage.setItem('token', token);
    window.__leafletMarkers = [];
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
          flyTo() {},
        };
        window.__leafletMaps.push(map);
        return map;
      },
      tileLayer: () => ({ addTo() {} }),
      icon: (options) => options,
      marker: (coords, options) => {
        const marker = {
          coords,
          options,
          addTo() { window.__leafletMarkers.push(this); return this; },
          setLatLng(next) { this.coords = next; return this; },
        };
        return marker;
      },
    };
  }, USER_TOKEN);

  await page.goto(`${FRONT_URL}/dashboard/listings/cars/create`);
  await expect(page.getByLabel('Latitude')).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => window.__clickLastLeafletMap(33.573101, -7.589801));

  await expect(page.getByLabel('Latitude')).toHaveValue('33.573101');
  await expect(page.getByLabel('Longitude')).toHaveValue('-7.589801');
  await expect.poll(() => page.evaluate(() => window.__leafletMarkers.length)).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => window.__leafletMarkers.at(-1)?.options?.icon?.iconUrl || '')).toContain('marker-icon.png');
});

test.describe.serial('automobile categories and car listings E2E', () => {
  let categoriesByName = new Map();
  const createdListings = [];

  test.beforeAll(async ({ request }) => {
    expect(ADMIN_TOKEN, 'ADMIN_TOKEN is required').toBeTruthy();
    expect(USER_TOKEN, 'USER_TOKEN is required').toBeTruthy();

    const adminProbe = await request.get(`${API_URL}/admin/overview`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
    });
    await expectOk(adminProbe);

    const userProbe = await request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${USER_TOKEN}` },
    });
    await expectOk(userProbe);
  });

  test('creates missing automobile categories and verifies category APIs', async ({ request }) => {
    const initial = await getJson(await request.get(`${API_URL}/categories?module=automobile`));
    categoriesByName = new Map((initial.data || []).map((cat) => [cat.name, cat]));

    for (const name of REQUIRED_CATEGORIES) {
      if (!categoriesByName.has(name)) {
        const created = await getJson(await request.post(`${API_URL}/admin/categories`, {
          headers: authHeaders(ADMIN_TOKEN),
          data: { name, module: 'automobile', isActive: true },
        }));
        categoriesByName.set(created.data.name, created.data);
      }
    }

    const generalCategories = await getJson(await request.get(`${API_URL}/categories?module=automobile`));
    const carCategories = await getJson(await request.get(`${API_URL}/cars/categories`));

    for (const name of REQUIRED_CATEGORIES) {
      const general = (generalCategories.data || []).find((cat) => cat.name === name);
      const car = (carCategories.data || []).find((cat) => cat.name === name);

      expect(general, `${name} must exist in /api/categories`).toBeTruthy();
      expect(general.module).toBe('automobile');
      expect(car, `${name} must exist in /api/cars/categories`).toBeTruthy();
    }

    categoriesByName = new Map((carCategories.data || []).map((cat) => [cat.name, cat]));
  });

  test('creates 10 automobile listings as PENDING with the right category', async ({ request }) => {
    for (const item of listingsSeed) {
      const category = categoriesByName.get(item.category);
      expect(category, `Missing category ${item.category}`).toBeTruthy();

      const result = await getJson(await request.post(`${API_URL}/cars`, {
        headers: authHeaders(USER_TOKEN),
        data: listingPayload(item, category.id),
      }));

      expect(result.data.status).toBe('PENDING');
      expect(result.data.categoryId).toBe(category.id);
      createdListings.push({ ...item, id: result.data.id, fullTitle: `${TITLE_PREFIX} ${item.title}`, categoryId: category.id });
    }

    expect(createdListings).toHaveLength(10);

    const pendingCategory = categoriesByName.get('Voitures');
    const publicBeforeApproval = await getJson(await request.get(`${API_URL}/cars`, {
      params: { categoryId: pendingCategory.id, search: TITLE_PREFIX, limit: 50 },
    }));
    expect(publicBeforeApproval.listings).toHaveLength(0);
  });

  test('approves created automobile listings through admin status route', async ({ request }) => {
    for (const listing of createdListings) {
      const result = await getJson(await request.patch(`${API_URL}/admin/listings/${listing.id}/status`, {
        headers: authHeaders(ADMIN_TOKEN),
        data: {
          module: 'automobile',
          status: 'APPROVED',
          adminNotes: 'Approved by cars E2E test',
        },
      }));

      expect(result.data.status).toBe('APPROVED');
      expect(result.data.id).toBe(listing.id);
    }
  });

  test('filters approved active automobile listings by category through backend', async ({ request }) => {
    for (const categoryName of REQUIRED_CATEGORIES) {
      const category = categoriesByName.get(categoryName);
      const expectedTitles = createdListings
        .filter((listing) => listing.category === categoryName)
        .map((listing) => listing.fullTitle);

      const result = await getJson(await request.get(`${API_URL}/cars`, {
        params: { categoryId: category.id, search: TITLE_PREFIX, limit: 50 },
      }));

      expect(result.listings.length).toBe(expectedTitles.length);
      for (const listing of result.listings) {
        expect(listing.category.id).toBe(category.id);
        expect(listing.title.startsWith(TITLE_PREFIX)).toBeTruthy();
      }
      for (const title of expectedTitles) {
        expect(result.listings.some((listing) => listing.title === title)).toBeTruthy();
      }
    }
  });

  test('renders approved automobile listings and category filters on /cars', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${FRONT_URL}/cars?search=${encodeURIComponent(TITLE_PREFIX)}`, { waitUntil: 'networkidle' });

    await expect(page.getByText(`${TITLE_PREFIX} Bayliner Element`)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`${TITLE_PREFIX} Sea-Doo Spark`)).toBeVisible();

    const sidebar = page.locator('aside');
    await sidebar.getByRole('button', { name: /Cat.gorie|Catégorie/ }).click();

    const filterCases = [
      ['Voitures', `${TITLE_PREFIX} Toyota Corolla`, `${TITLE_PREFIX} Yamaha MT-07`],
      ['Motos', `${TITLE_PREFIX} Yamaha MT-07`, `${TITLE_PREFIX} Toyota Corolla`],
      ['Bateaux', `${TITLE_PREFIX} Bayliner Element`, `${TITLE_PREFIX} Sea-Doo Spark`],
      ['Jetski', `${TITLE_PREFIX} Sea-Doo Spark`, `${TITLE_PREFIX} Bayliner Element`],
    ];

    for (const [categoryName, visibleTitle, hiddenTitle] of filterCases) {
      const responsePromise = page.waitForResponse((response) =>
        response.url().includes('/api/cars?') && response.url().includes('categoryId=') && response.ok(),
      );
      await sidebar.locator('label', { hasText: categoryName }).click();
      await responsePromise;

      await expect(page.getByText(visibleTitle)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(hiddenTitle)).toHaveCount(0);
    }
  });

  test('opens car detail with image viewer and saved map coordinates', async ({ page }) => {
    const listing = createdListings[0];
    await page.goto(`${FRONT_URL}/cars/${listing.id}`, { waitUntil: 'networkidle' });

    await expect(page.getByRole('heading', { name: /Toyota Corolla 2020/ })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Casablanca, Casablanca')).toBeVisible();
    await expect(page.locator('img[alt="Photo 1"]')).toBeVisible();

    await page.locator('img[alt="Photo 1"]').click();
    await expect(page.locator('[data-image-viewer="open"]')).toBeVisible();
    await expect(page.getByText('1200 x 800px')).toBeVisible();
    await page.getByRole('button', { name: 'Zoom plus' }).click();
    await expect(page.getByText('125%')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-image-viewer="open"]')).toHaveCount(0);
  });
});
