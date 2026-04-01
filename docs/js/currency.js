// currency.js — FX rate fetching and conversion.
// Rates are fetched from open.er-api.com (free, no API key, ~1500 req/month).
// Results are cached in sessionStorage so a page refresh within the same session
// does not trigger a new fetch (rates are stale after 24h).

import { store } from './store.js';

const RATES_CACHE_KEY = 'mwv_fx_rates';
const RATES_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function loadRates() {
  // Check sessionStorage cache first
  try {
    const cached = sessionStorage.getItem(RATES_CACHE_KEY);
    if (cached) {
      const { rates, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < RATES_TTL_MS) {
        store.fxRates = rates;
        store.fxRatesTimestamp = timestamp;
        return;
      }
    }
  } catch (_) { /* ignore parse errors */ }

  // Fetch fresh rates with USD as base
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.result !== 'success') throw new Error('API error');

    store.fxRates = data.rates;
    store.fxRatesTimestamp = Date.now();

    sessionStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
      rates: data.rates,
      timestamp: store.fxRatesTimestamp,
    }));
  } catch (err) {
    console.warn('FX rate fetch failed, using 1:1 fallback:', err.message);
    // Fallback: treat all currencies as equal to USD (no conversion)
    store.fxRates = { USD: 1 };
    store.fxRatesTimestamp = Date.now();
  }
}

/**
 * Convert an amount from one currency to another via USD as the intermediate.
 * @param {number} amount
 * @param {string} from  ISO 4217 currency code, e.g. 'GBP'
 * @param {string} to    ISO 4217 currency code, e.g. 'USD'
 * @returns {number}
 */
export function convert(amount, from, to) {
  if (!store.fxRates || from === to) return amount;
  const fromRate = store.fxRates[from] ?? 1;
  const toRate   = store.fxRates[to]   ?? 1;
  // amount → USD → target
  return (amount / fromRate) * toRate;
}

/**
 * Format a number as a currency string using the user's locale.
 * @param {number} amount
 * @param {string} currency  ISO 4217 code
 * @param {boolean} compact  Use compact notation (e.g. $1.2M) for large numbers
 */
export function formatCurrency(amount, currency = 'USD', compact = false) {
  const opts = {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  if (compact && Math.abs(amount) >= 1_000_000) {
    opts.notation = 'compact';
    opts.compactDisplay = 'short';
  }
  try {
    return new Intl.NumberFormat('en-US', opts).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/**
 * Format a date string according to the user's preferred date format.
 * @param {string} isoString  ISO 8601 date string
 * @param {string} fmt        One of 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'
 */
export function formatDate(isoString, fmt = 'MM/DD/YYYY') {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d)) return isoString;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  if (fmt === 'DD/MM/YYYY') return `${dd}/${mm}/${yyyy}`;
  if (fmt === 'YYYY-MM-DD') return `${yyyy}-${mm}-${dd}`;
  return `${mm}/${dd}/${yyyy}`;
}
