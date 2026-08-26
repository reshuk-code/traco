/**
 * Amounts live in the database as integer minor units (cents/paisa) so that
 * sums and comparisons never hit floating point rounding.
 */

export function parseAmountToCents(input) {
  if (typeof input !== 'string') return null;
  const cleaned = input.trim().replace(/,/g, '');
  if (!/^\d*(\.\d{0,2})?$/.test(cleaned) || cleaned === '' || cleaned === '.') {
    return null;
  }
  const cents = Math.round(Number(cleaned) * 100);
  if (!Number.isFinite(cents) || cents < 0) return null;
  return cents;
}

export function formatMoney(cents, currency = 'NPR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format((cents ?? 0) / 100);
}

/** Compact form for chart labels and tight spaces. */
export function formatAmount(cents) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format((cents ?? 0) / 100);
}

export const CURRENCIES = ['NPR', 'USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY'];

export const CATEGORIES = [
  'food',
  'transport',
  'groceries',
  'shopping',
  'bills',
  'health',
  'fun',
  'other',
];

const SYMBOLS = {
  NPR: 'Rs',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
};

/** Short prefix for input fields, where the full ISO code is too heavy. */
export function currencySymbol(code) {
  return SYMBOLS[code] ?? code;
}
