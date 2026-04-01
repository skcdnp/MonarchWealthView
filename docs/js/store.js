// store.js — in-memory application state for the current session.
// All data originates from Google Sheets and is kept here after the initial load.
// Nothing here persists across page refreshes; loadAllData() re-populates it each time.

export const store = {
  // Authenticated user (from Google Identity Services JWT)
  user: null,           // { email, name, picture }

  // Data from Google Sheets
  accounts: [],         // Array of account objects (all rows, including archived)
  history: [],          // Array of BalanceHistory objects
  profile: null,        // UserProfile object for the current user

  // FX rates fetched from open.er-api.com
  fxRates: null,        // { USD: 1, EUR: 0.92, GBP: 0.79, ... }
  fxRatesTimestamp: 0,  // Unix ms timestamp of last fetch
};

// Convenience: active (non-archived) accounts only
export function activeAccounts() {
  return store.accounts.filter(a => a.isArchived !== 'TRUE' && a.isArchived !== true);
}

// Convenience: accounts by classification
export function assets() {
  return activeAccounts().filter(a => a.classification === 'Asset');
}
export function liabilities() {
  return activeAccounts().filter(a => a.classification === 'Liability');
}
