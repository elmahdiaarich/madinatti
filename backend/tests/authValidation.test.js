const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeEmail,
  isValidEmail,
  isStrongPassword,
  PASSWORD_MESSAGE,
} = require("../utils/authValidation");

test("auth validation normalizes email and enforces the shared password policy", () => {
  assert.equal(normalizeEmail("  User@Example.COM "), "user@example.com");
  assert.equal(isValidEmail("user@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isStrongPassword("abc12345"), true);
  assert.equal(isStrongPassword("abcdefgh"), false);
  assert.equal(isStrongPassword("12345678"), false);
  assert.match(PASSWORD_MESSAGE, /8/);
});
