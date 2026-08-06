const { test, expect } = require('@playwright/test');

const FRONT_URL = process.env.FRONT_URL || 'http://localhost:3000';

const plans = [
  { id: 'plan-basic', name: 'Basique', displayedPrice: '99 MAD/mois', listingLimit: 20, features: ['Page boutique publique', '20 annonces actives'] },
  { id: 'plan-pro', name: 'Professionnelle', displayedPrice: '199 MAD/mois', listingLimit: 100, features: ['Badge pro', 'Statistiques avancees'] },
];

const shop = {
  id: 'shop-1',
  name: 'Auto Pro Kenitra',
  slug: 'auto-pro-kenitra',
  description: 'Boutique professionnelle specialisee dans les voitures et services auto.',
  category: { id: 'cat-auto', name: 'Automobile', slug: 'automobile' },
  city: 'Kenitra',
  address: 'Centre ville',
  professionalPhone: '0611111111',
  professionalEmail: 'pro@example.com',
  logo: '',
  coverImage: '',
  website: 'https://example.com',
  openingHours: { summary: 'Lun-Sam 09:00-18:00' },
  status: 'ACTIVE',
  isVerified: true,
  activeListingsCount: 2,
  createdAt: '2026-08-03T08:00:00.000Z',
  owner: { email: 'owner@example.com' },
  subscription: { status: 'ACTIVE', planId: 'plan-basic', plan: plans[0] },
  stats: { activeListings: 2, expiredListings: 0, views: 120, contacts: 8, favorites: 12, shopVisits: 30, demo: true },
  listings: [
    { id: 'car-1', module: 'cars', title: 'Toyota Corolla', price: 145000, city: 'Kenitra', createdAt: '2026-08-03T08:00:00.000Z' },
    { id: 'job-1', module: 'jobs', title: 'Commercial automobile', city: 'Kenitra', createdAt: '2026-08-02T08:00:00.000Z' },
  ],
};

async function mockAuth(page, role = 'business') {
  await page.addInitScript(() => localStorage.setItem('token', 'mock-token'));
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ user: { id: 'user-1', name: 'User', email: 'user@example.com', role } }),
    });
  });
}

test('shop creation wizard selects a plan and submits the selected data', async ({ page }) => {
  await mockAuth(page, 'business');
  let postedPayload = null;

  await page.route('**/api/shops/plans', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: plans }) });
  });
  await page.route('**/api/categories**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: [{ id: 'cat-auto', name: 'Automobile' }] }) });
  });
  await page.route('**/api/shops', async (route) => {
    if (route.request().method() === 'POST') {
      postedPayload = route.request().postDataJSON();
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: { ...shop, ...postedPayload } }) });
      return;
    }
    await route.fallback();
  });

  await page.goto(`${FRONT_URL}/dashboard/shop/create`);
  await page.getByRole('button', { name: 'Continuer' }).click();
  await expect(page.getByText('Nom requis.')).toBeVisible();

  await page.getByLabel('Nom de la boutique').fill('Auto Pro Kenitra');
  await page.getByLabel('Categorie principale').selectOption('cat-auto');
  await page.getByLabel('Ville').fill('Kenitra');
  await page.getByLabel('Telephone professionnel').fill('0611111111');
  await page.getByLabel('Description').fill('Boutique professionnelle specialisee dans les voitures et services auto.');
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByRole('button', { name: /Professionnelle/ }).click();
  await page.getByRole('button', { name: 'Continuer' }).click();
  await page.getByLabel('J accepte les conditions de creation de boutique.').check();
  await page.getByRole('button', { name: 'Envoyer la demande' }).click();

  await expect(page).toHaveURL(/\/dashboard\/shop/);
  expect(postedPayload.name).toBe('Auto Pro Kenitra');
  expect(postedPayload.categoryId).toBe('cat-auto');
  expect(postedPayload.planId).toBe('plan-pro');
});

test('public shop page renders profile details, listings and module filter', async ({ page }) => {
  await page.route('**/api/shops/public/auto-pro-kenitra', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: shop }) });
  });

  await page.goto(`${FRONT_URL}/boutiques/auto-pro-kenitra`);
  await expect(page.getByRole('heading', { name: 'Auto Pro Kenitra', exact: true })).toBeVisible();
  await expect(page.getByText('Boutique', { exact: true })).toBeVisible();
  await expect(page.getByText('Toyota Corolla')).toBeVisible();
  await page.getByRole('combobox').first().selectOption('jobs');
  await expect(page.getByText('Commercial automobile')).toBeVisible();
  await expect(page.getByText('Toyota Corolla')).toHaveCount(0);
});

test('admin shops page approves and updates simulated subscription status', async ({ page }) => {
  await mockAuth(page, 'admin');
  let patchPayload = null;

  await page.route('**/api/shops/admin/list**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: [shop], pagination: { total: 1 } }) });
  });
  await page.route('**/api/shops/admin/shop-1', async (route) => {
    patchPayload = route.request().postDataJSON();
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: { ...shop, ...patchPayload } }) });
  });

  await page.goto(`${FRONT_URL}/admin/shops`);
  await expect(page.getByRole('heading', { name: 'Boutiques professionnelles' })).toBeVisible();
  await page.getByRole('button', { name: 'Approuver' }).click();
  expect(patchPayload.status).toBe('ACTIVE');
  await expect(page.getByText('Boutique mise a jour.')).toBeVisible();
});
