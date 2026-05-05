// Simple validation functions for form fields.
// Each function returns an error message string, or null if the value is valid.

// Checks that an email address has the correct format (e.g. name@domain.com)
export function validateEmailAddress(email: string): string | null {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidFormat = emailPattern.test(email.trim());
  if (!isValidFormat) return 'Adresse e-mail invalide.';
  return null;
}

// Checks that a password meets minimum security requirements
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
  const hasUppercaseLetter = /[A-Z]/.test(password);
  if (!hasUppercaseLetter) return 'Le mot de passe doit contenir au moins une majuscule.';
  const hasNumber = /[0-9]/.test(password);
  if (!hasNumber) return 'Le mot de passe doit contenir au moins un chiffre.';
  return null;
}

// Checks that two passwords are identical (for the confirm password field)
export function validateThatPasswordsMatch(
  password: string,
  confirmPassword: string,
): string | null {
  if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas.';
  return null;
}

// Checks that a field is not empty
export function validateThatFieldIsNotEmpty(value: string, fieldLabel: string): string | null {
  if (value.trim().length === 0) return `${fieldLabel} est obligatoire.`;
  return null;
}

// Checks that a number is positive and greater than zero
export function validateThatAmountIsPositive(amount: number): string | null {
  if (amount <= 0) return 'Le montant doit être supérieur à 0.';
  return null;
}
