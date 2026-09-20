export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MESSAGE =
  "Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre";

export function isStrongPassword(value) {
  return (
    typeof value === "string" &&
    value.length >= PASSWORD_MIN_LENGTH &&
    /[A-Za-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}
