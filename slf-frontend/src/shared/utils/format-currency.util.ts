// Formats a number as a currency string.
// Example: formatAmountInEuros(1500) → "1 500,00 €"

export function formatAmountInEuros(amountInEuros: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amountInEuros);
}

// Formats a number as a compact currency string.
// Example: formatCompactAmountInEuros(1500) → "1 500 €"
export function formatCompactAmountInEuros(amountInEuros: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInEuros);
}

// Converts a Stripe amount (in cents) to euros
// Stripe always stores amounts in the smallest currency unit (cents)
export function convertCentsToEuros(amountInCents: number): number {
  return amountInCents / 100;
}

// Converts euros to cents (for sending to Stripe)
export function convertEurosToCents(amountInEuros: number): number {
  return Math.round(amountInEuros * 100);
}
