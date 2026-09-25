const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const loadModule = require('./helpers/loadModule');

function service(prisma = {}, axios = {}, cloudinary = {}) {
  return loadModule(path.resolve(__dirname, '../services/cvService.js'), {
    '../config/db': prisma, axios, '../config/cloudinary': { cloudinary },
  });
}

test('CV assets reject arbitrary hosts, clouds, credentials, transformations and paths', () => {
  const { parseCvAsset } = service();
  for (const url of [
    'http://127.0.0.1/internal',
    'https://res.cloudinary.com.evil.test/demo/raw/upload/v1/cv/test.pdf',
    'https://user:pass@res.cloudinary.com/demo/raw/upload/v1/cv/test.pdf',
    'https://res.cloudinary.com/other/raw/upload/v1/cv/test.pdf',
    'https://res.cloudinary.com/demo/raw/upload/v1/elsewhere/test.pdf',
    'https://res.cloudinary.com/demo/raw/upload/v1/cv/test.pdf?redirect=evil',
    'https://res.cloudinary.com/demo/image/upload/w_100/v1/cv/test.pdf',
    'https://res.cloudinary.com/demo/raw/upload/v1/cv/%2e%2e%2fsecret.pdf',
  ]) assert.throws(() => parseCvAsset(url, 'demo'), /Invalid CV asset/);
  const raw = parseCvAsset('https://res.cloudinary.com/demo/raw/authenticated/v1/candidate-cv/test.pdf', 'demo');
  assert.equal(raw.publicId, 'candidate-cv/test.pdf');
  assert.equal(raw.type, 'authenticated');
  assert.equal(parseCvAsset('https://res.cloudinary.com/demo/image/upload/v1/cv/test.pdf', 'demo').publicId, 'cv/test');
});

test('application CV requires applicant, owning employer, or administrator', async () => {
  const { findAuthorizedCv } = service({ jobApplication: { findUnique: async () => ({
    userId: 'applicant', cvPath: 'asset', jobListing: { userId: 'employer' },
  }) } });
  for (const user of [{ userId: 'applicant', role: 'citizen' }, { userId: 'employer', role: 'business' }, { userId: 'admin', role: 'admin' }]) {
    assert.equal(await findAuthorizedCv({ applicationId: 'application' }, user), 'asset');
  }
  assert.equal(await findAuthorizedCv({ applicationId: 'application' }, { userId: 'stranger', role: 'business' }), null);
});

test('candidate CV requires ownership or a paid unlock and current visibility', async () => {
  let unlocked = false;
  let visible = true;
  const { findAuthorizedCv } = service({
    candidateProfile: { findUnique: async () => ({ id: 'candidate', userId: 'owner', cvUrl: 'asset', visibleToRecruiters: visible }) },
    candidateUnlock: { findUnique: async ({ where }) => {
      assert.equal(where.businessUserId_candidateProfileId.businessUserId, 'recruiter');
      return unlocked ? { id: 'unlock' } : null;
    } },
  });
  const user = { userId: 'recruiter', role: 'business' };
  assert.equal(await findAuthorizedCv({ candidateId: 'candidate' }, user), null);
  unlocked = true;
  assert.equal(await findAuthorizedCv({ candidateId: 'candidate' }, user), 'asset');
  visible = false;
  assert.equal(await findAuthorizedCv({ candidateId: 'candidate' }, user), null);
  assert.equal(await findAuthorizedCv({ mine: true }, { userId: 'owner', role: 'citizen' }), 'asset');
});

test('CV controller rejects legacy URL parameters without fetching anything', async () => {
  const controller = loadModule(path.resolve(__dirname, '../controllers/cvController.js'), {
    '../services/cvService': { findAuthorizedCv: () => assert.fail('must not query or fetch') },
  });
  const res = { status(n) { this.code = n; return this; }, json() {} };
  await controller.downloadCv({ query: { url: 'http://127.0.0.1' } }, res);
  assert.equal(res.code, 400);
});

test('JSON-LD cannot close its script element, while preserving the original text', async () => {
  const { safeJsonLd } = await import('../../frontend/lib/safeJsonLd.mjs').catch(() => import('../../../frontend/lib/safeJsonLd.mjs'));
  const value = { description: '</script><script>alert(1)</script>', title: 'A < B' };
  const json = safeJsonLd(value);
  assert.ok(!json.includes('<'));
  assert.deepEqual(JSON.parse(json), value);
});
