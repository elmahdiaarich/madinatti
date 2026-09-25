const PASSWORD_MIN_LENGTH = 8;

const PASSWORD_MESSAGE =
  "Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre";

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStrongPassword(value) {
  return (
    typeof value === "string" &&
    value.length >= PASSWORD_MIN_LENGTH &&
    /[A-Za-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

module.exports = {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MESSAGE,
  normalizeEmail,
  isValidEmail,
  isStrongPassword,
};
