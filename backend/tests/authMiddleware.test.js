const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const loadModule = require("./helpers/loadModule");

test("auth middleware uses the current database role and token version", async () => {
  const middleware = loadModule(path.resolve(__dirname, "../middlewares/authMiddleware.js"), {
    jsonwebtoken: { verify: () => ({ userId: "u1", role: "admin", tokenVersion: 2 }) },
    "../config/db": {
      user: {
        findUnique: async () => ({
          isActive: true,
          tokenVersion: 2,
          role: { name: "citizen" },
        }),
      },
    },
  });
  const req = { headers: { authorization: "Bearer token" } };
  let nextCalled = false;
  await middleware(req, { status: () => ({ json: () => {} }) }, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(req.user.role, "citizen");
});
