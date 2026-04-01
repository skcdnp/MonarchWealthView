// sheets.js — all Google Sheets API read/write logic.
//
// Data model (columns match the Google Sheet header rows exactly):
//   Accounts:       id, name, accountType, classification, liquidity, balance,
//                   currency, institution, notes, isArchived, createdAt, updatedAt, updatedBy
//   BalanceHistory: id, accountId, balance, currency, snapshotAt, updatedBy
//   UserProfiles:   email, displayName, baseCurrency, dateFormat, createdAt

import { store } from './store.js';
import { showToast } from './components/toast.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function rowsToObjects(values) {
  if (!values || values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))   // skip blank rows
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
      return obj;
    });
}

function accountToRow(a) {
  return [
    a.id, a.name, a.accountType, a.classification,
    a.liquidity || '', parseFloat(a.balance) || 0,
    a.currency || 'USD', a.institution || '', a.notes || '',
    a.isArchived ? 'TRUE' : 'FALSE',
    a.createdAt, a.updatedAt, a.updatedBy,
  ];
}

function historyToRow(h) {
  return [h.id, h.accountId, parseFloat(h.balance) || 0, h.currency, h.snapshotAt, h.updatedBy];
}

// Find the 1-based row number for a given id in a sheet tab.
// Makes a targeted API call for the id column only — reliable even when
// other family members have added rows since last full load.
async function findRowNumber(tab, id) {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: CONFIG.SHEET_ID,
    range: `${tab}!A:A`,
  });
  const rows = res.result.values || [];
  const idx = rows.findIndex(r => r[0] === id);
  if (idx === -1) throw new Error(`Row "${id}" not found in ${tab}`);
  return idx + 1; // 1-based (row 1 is the header)
}

// Retry a Sheets API call once on 401 (expired token).
// The token client will silently refresh if the session is still valid.
async function callWithRetry(fn) {
  try {
    return await fn();
  } catch (err) {
    const status = err?.result?.error?.code || err?.status;
    if (status === 401) {
      // Token expired — request a fresh one silently then retry
      const { requestAccessToken } = await import('./auth.js');
      await requestAccessToken();
      return await fn();
    }
    throw err;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Load all data from the three Sheet tabs in a single batchGet call.
 * Populates store.accounts, store.history, store.profile.
 */
export async function loadAllData() {
  const res = await callWithRetry(() =>
    gapi.client.sheets.spreadsheets.values.batchGet({
      spreadsheetId: CONFIG.SHEET_ID,
      ranges: ['Accounts!A:M', 'BalanceHistory!A:F', 'UserProfiles!A:E'],
    })
  );

  const [accountsRange, historyRange, profilesRange] = res.result.valueRanges;

  store.accounts = rowsToObjects(accountsRange.values);
  store.history  = rowsToObjects(historyRange.values);

  const profiles = rowsToObjects(profilesRange.values);
  store.profile  = profiles.find(p => p.email === store.user?.email) || null;
}

/**
 * Append a new account row and a first BalanceHistory snapshot.
 */
export async function saveAccount(account) {
  await callWithRetry(async () => {
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: CONFIG.SHEET_ID,
      range: 'Accounts!A:M',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [accountToRow(account)] },
    });
  });

  await _appendHistorySnapshot(account);

  // Update in-memory store
  store.accounts.push(account);
}

/**
 * Update an existing account row in place and append a BalanceHistory snapshot.
 */
export async function updateAccount(account) {
  const rowNum = await callWithRetry(() => findRowNumber('Accounts', account.id));

  await callWithRetry(() =>
    gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: CONFIG.SHEET_ID,
      range: `Accounts!A${rowNum}:M${rowNum}`,
      valueInputOption: 'RAW',
      resource: { values: [accountToRow(account)] },
    })
  );

  await _appendHistorySnapshot(account);

  // Update in-memory store
  const idx = store.accounts.findIndex(a => a.id === account.id);
  if (idx !== -1) store.accounts[idx] = account;
}

/**
 * Mark an account as archived (sets isArchived = TRUE, preserves history).
 */
export async function archiveAccount(id) {
  const account = store.accounts.find(a => a.id === id);
  if (!account) throw new Error('Account not found');

  const updated = {
    ...account,
    isArchived: 'TRUE',
    updatedAt: new Date().toISOString(),
    updatedBy: store.user.email,
  };

  await updateAccount(updated);
}

/**
 * Upsert the current user's profile row.
 * Appends a new row if the user has no profile yet; updates in place if they do.
 */
export async function saveProfile(profile) {
  const row = [
    profile.email,
    profile.displayName,
    profile.baseCurrency,
    profile.dateFormat,
    profile.createdAt,
  ];

  const existing = store.profile;

  if (!existing) {
    // New profile — append
    await callWithRetry(() =>
      gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: CONFIG.SHEET_ID,
        range: 'UserProfiles!A:E',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: [row] },
      })
    );
  } else {
    // Existing profile — find and update
    const rowNum = await callWithRetry(() => findRowNumber('UserProfiles', profile.email));
    await callWithRetry(() =>
      gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: CONFIG.SHEET_ID,
        range: `UserProfiles!A${rowNum}:E${rowNum}`,
        valueInputOption: 'RAW',
        resource: { values: [row] },
      })
    );
  }

  store.profile = profile;
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function _appendHistorySnapshot(account) {
  const snapshot = {
    id: crypto.randomUUID(),
    accountId: account.id,
    balance: account.balance,
    currency: account.currency,
    snapshotAt: account.updatedAt,
    updatedBy: account.updatedBy,
  };

  await callWithRetry(() =>
    gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: CONFIG.SHEET_ID,
      range: 'BalanceHistory!A:F',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [historyToRow(snapshot)] },
    })
  );

  store.history.push(snapshot);
}
