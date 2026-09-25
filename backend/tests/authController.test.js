const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const loadModule = require("./helpers/loadModule");

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("public registration always creates a citizen account", async () => {
  let requestedRole;
  const controller = loadModule(path.resolve(__dirname, "../controllers/authController.js"), {
    "../config/db": {
      user: {
        findFirst: async () => null,
        create: async ({ data }) => ({
          ...data, id: "u1", tokenVersion: 0, isActive: true, profileCompleted: true,
        }),
      },
      role: {
        findUnique: async ({ where }) => {
          requestedRole = where.name;
          return { id: "citizen-role", name: "citizen" };
        },
      },
    },
    bcryptjs: { hash: async () => "hash" },
    jsonwebtoken: { sign: () => "jwt" },
    "../services/mailService": {},
    "google-auth-library": { OAuth2Client: class {} },
    "../config/cloudinary": { cloudinary: {} },
  });
  const res = response();
  await controller.register({
    body: {
      name: " New User ",
      email: "  USER@example.com ",
      password: "Password1",
      phone: " 0600000000 ",
      city: " Rabat ",
      role: "business",
    },
  }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(requestedRole, "citizen");
  assert.equal(res.body.user.role, "citizen");
  assert.equal(res.body.user.password, undefined);
});

test("first-time Google registration creates and links a citizen account", async () => {
  const providerCreates = [];
  const db = {
    oAuthProvider: { findFirst: async () => null },
    user: {
      findFirst: async () => null,
    },
    role: { findUnique: async () => ({ id: "citizen-role", name: "citizen" }) },
    $transaction: async (callback) => callback({
      user: {
        create: async ({ data, include }) => ({
          ...data, id: "google-user", tokenVersion: 0, isActive: true,
          role: include ? { name: "citizen" } : undefined,
        }),
      },
      oAuthProvider: {
        create: async ({ data }) => { providerCreates.push(data); return data; },
      },
    }),
  };
  const controller = loadModule(path.resolve(__dirname, "../controllers/authController.js"), {
    "../config/db": db,
    bcryptjs: {},
    jsonwebtoken: { sign: () => "google-jwt" },
    "../services/mailService": {},
    "google-auth-library": {
      OAuth2Client: class {
        async verifyIdToken() {
          return { getPayload: () => ({
            sub: "google-sub", email: "New@Example.com", email_verified: true,
            name: "Google User", picture: "https://example/avatar",
          }) };
        }
      },
    },
    "../config/cloudinary": { cloudinary: {} },
  });
  process.env.GOOGLE_CLIENT_ID = "google-client";
  process.env.JWT_SECRET = "test-secret";
  const res = response();
  await controller.googleLogin({ body: { token: "google-token" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.role, "citizen");
  assert.equal(providerCreates.length, 1);
  assert.equal(providerCreates[0].userId, "google-user");
  assert.equal(providerCreates[0].provider, "google");
  assert.equal(providerCreates[0].providerId, "google-sub");
});

test("Google links an existing citizen account without asking for its password", async () => {
  const providerCreates = [];
  const controller = loadModule(path.resolve(__dirname, "../controllers/authController.js"), {
    "../config/db": {
      oAuthProvider: {
        findFirst: async ({ where }) => where.userId ? null : null,
        create: async ({ data }) => { providerCreates.push(data); return data; },
      },
      user: {
        findFirst: async () => ({
          id: "password-user", email: "user@example.com", isActive: true,
          tokenVersion: 0, role: { name: "citizen" },
        }),
      },
    },
    bcryptjs: {},
    jsonwebtoken: { sign: () => "jwt" },
    "../services/mailService": {},
    "google-auth-library": {
      OAuth2Client: class {
        async verifyIdToken() {
          return { getPayload: () => ({
            sub: "google-sub-2", email: "user@example.com", email_verified: true,
          }) };
        }
      },
    },
    "../config/cloudinary": { cloudinary: {} },
  });
  process.env.GOOGLE_CLIENT_ID = "google-client";
  const res = response();
  await controller.googleLogin({ body: { token: "google-token" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.id, "password-user");
  assert.equal(providerCreates[0].providerId, "google-sub-2");
});

test("returning linked Google identity logs in immediately", async () => {
  const controller = loadModule(path.resolve(__dirname, "../controllers/authController.js"), {
    "../config/db": {
      oAuthProvider: { findFirst: async () => ({ user: { id: "linked", isActive: true, tokenVersion: 0, role: { name: "citizen" } } }) },
    },
    bcryptjs: {}, jsonwebtoken: { sign: () => "jwt" }, "../services/mailService": {},
    "google-auth-library": { OAuth2Client: class { async verifyIdToken() { return { getPayload: () => ({ sub: "linked-sub", email: "u@example.com", email_verified: true }) }; } } },
    "../config/cloudinary": { cloudinary: {} },
  });
  process.env.GOOGLE_CLIENT_ID = "google-client";
  const res = response();
  await controller.googleLogin({ body: { token: "google-token" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.token, "jwt");
});

test("Google rejects an inactive linked account", async () => {
  const controller = loadModule(path.resolve(__dirname, "../controllers/authController.js"), {
    "../config/db": {
      oAuthProvider: { findFirst: async () => ({ user: { id: "inactive", isActive: false, role: { name: "citizen" } } }) },
    },
    bcryptjs: {}, jsonwebtoken: { sign: () => "jwt" }, "../services/mailService": {},
    "google-auth-library": { OAuth2Client: class { async verifyIdToken() { return { getPayload: () => ({ sub: "inactive-sub", email: "u@example.com", email_verified: true }) }; } } },
    "../config/cloudinary": { cloudinary: {} },
  });
  process.env.GOOGLE_CLIENT_ID = "google-client";
  const res = response();
  await controller.googleLogin({ body: { token: "google-token" } }, res);
  assert.equal(res.statusCode, 403);
});

test("Google rejects an unverified identity", async () => {
  const controller = loadModule(path.resolve(__dirname, "../controllers/authController.js"), {
    "../config/db": {},
    bcryptjs: {}, jsonwebtoken: { sign: () => "jwt" }, "../services/mailService": {},
    "google-auth-library": { OAuth2Client: class { async verifyIdToken() { return { getPayload: () => ({ sub: "s", email: "u@example.com", email_verified: false }) }; } } },
    "../config/cloudinary": { cloudinary: {} },
  });
  process.env.GOOGLE_CLIENT_ID = "google-client";
  const res = response();
  await controller.googleLogin({ body: { token: "google-token" } }, res);
  assert.equal(res.statusCode, 401);
});

test("Google refuses a second provider for the same citizen", async () => {
  const controller = loadModule(path.resolve(__dirname, "../controllers/authController.js"), {
    "../config/db": {
      oAuthProvider: { findFirst: async ({ where }) => where.providerId ? null : ({ providerId: "old-sub" }) },
      user: { findFirst: async () => ({ id: "u", isActive: true, role: { name: "citizen" } }) },
    },
    bcryptjs: {}, jsonwebtoken: { sign: () => "jwt" }, "../services/mailService": {},
    "google-auth-library": { OAuth2Client: class { async verifyIdToken() { return { getPayload: () => ({ sub: "new-sub", email: "u@example.com", email_verified: true }) }; } } },
    "../config/cloudinary": { cloudinary: {} },
  });
  process.env.GOOGLE_CLIENT_ID = "google-client";
  const res = response();
  await controller.googleLogin({ body: { token: "google-token" } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, "GOOGLE_PROVIDER_CONFLICT");
});

test("Google does not auto-link an admin account", async () => {
  const controller = loadModule(path.resolve(__dirname, "../controllers/authController.js"), {
    "../config/db": {
      oAuthProvider: { findFirst: async () => null },
      user: { findFirst: async () => ({ id: "admin", isActive: true, role: { name: "admin" } }) },
    },
    bcryptjs: {}, jsonwebtoken: { sign: () => "jwt" }, "../services/mailService": {},
    "google-auth-library": { OAuth2Client: class { async verifyIdToken() { return { getPayload: () => ({ sub: "admin-sub", email: "admin@example.com", email_verified: true }) }; } } },
    "../config/cloudinary": { cloudinary: {} },
  });
  process.env.GOOGLE_CLIENT_ID = "google-client";
  const res = response();
  await controller.googleLogin({ body: { token: "google-token" } }, res);
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, "GOOGLE_ACCOUNT_LINK_REQUIRES_AUTH");
});
