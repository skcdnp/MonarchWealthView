// sheets.js — Google Sheets API via direct fetch (REST v4).
//
// Uses the access token from gapi.client.getToken() directly instead of
// the generated gapi.client.sheets client. This bypasses the discovery doc
// loading step, which can fail silently and leave gapi.client.sheets undefined.

import { store } from './store.js';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function token() {
  return gapi.client.getToken()?.access_token;
}

async function sheetsGet(path) {
  const res = await fetchWithRetry(`${BASE}/${CONFIG.SHEET_ID}${path}`);
  return res;
}

async function sheetsPost(path, body) {
  return fetchWithRetry(`${BASE}/${CONFIG.SHEET_ID}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function sheetsPut(path, body) {
  return fetchWithRetry(`${BASE}/${CONFIG.SHEET_ID}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function fetchWithRetry(url, opts = {}) {
  const doFetch = () => fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token()}`,
      ...(opts.headers || {}),
    },
  });

  let res = await doFetch();

  // On 401 (expired token), request a fresh one and retry once
  if (res.status === 401) {
    const { requestAccessToken } = await import('./auth.js');
    await requestAccessToken();
    res = await doFetch();
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Sheets API error ${res.status}`);
  }
  return res.json();
}

// ── Row parsing ───────────────────────────────────────────────────────────────

function rowsToObjects(values) {
  if (!values || values.length < 2) return [];
  const headers = values[0];
  return values.slice(1)
    .filter(row => row.some(cell => cell !== ''))
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
    a.isArchived === true || a.isArchived === 'TRUE' ? 'TRUE' : 'FALSE',
    a.createdAt, a.updatedAt, a.updatedBy,
  ];
}

function historyToRow(h) {
  return [h.id, h.accountId, parseFloat(h.balance) || 0, h.currency, h.snapshotAt, h.updatedBy];
}

async function findRowNumber(tab, id) {
  const data = await sheetsGet(`/values/${encodeURIComponent(tab + '!A:A')}`);
  const rows = data.values || [];
  const idx = rows.findIndex(r => r[0] === id);
  if (idx === -1) throw new Error(`Row "${id}" not found in ${tab}`);
  return idx + 1;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function loadAllData() {
  // Fetch each tab separately — more reliable than batchGet for debugging
  const [accountsData, historyData, profilesData] = await Promise.all([
    sheetsGet(`/values/${encodeURIComponent('Accounts!A:M')}`),
    sheetsGet(`/values/${encodeURIComponent('BalanceHistory!A:F')}`),
    sheetsGet(`/values/${encodeURIComponent('UserProfiles!A:E')}`),
  ]);

  console.log('[MWV] Raw Accounts rows:', accountsData?.values?.length ?? 0);
  console.log('[MWV] Raw History rows:', historyData?.values?.length ?? 0);
  console.log('[MWV] Accounts header:', accountsData?.values?.[0]);
  console.log('[MWV] First account row:', accountsData?.values?.[1]);

  store.accounts = rowsToObjects(accountsData?.values);
  store.history  = rowsToObjects(historyData?.values);

  const profiles = rowsToObjects(profilesData?.values);
  store.profile  = profiles.find(p => p.email === store.user?.email) || null;

  console.log(`[MWV] Parsed: ${store.accounts.length} accounts, ${store.history.length} history rows`);
  if (store.accounts.length > 0) {
    console.log('[MWV] First parsed account:', store.accounts[0]);
  }
}

export async function saveAccount(account) {
  await sheetsPost(
    `/values/${encodeURIComponent('Accounts!A:M')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { values: [accountToRow(account)] }
  );
  await _appendHistorySnapshot(account);
  store.accounts.push(account);
}

export async function updateAccount(account) {
  const rowNum = await findRowNumber('Accounts', account.id);
  await sheetsPut(
    `/values/${encodeURIComponent(`Accounts!A${rowNum}:M${rowNum}`)}?valueInputOption=RAW`,
    { values: [accountToRow(account)] }
  );
  await _appendHistorySnapshot(account);
  const idx = store.accounts.findIndex(a => a.id === account.id);
  if (idx !== -1) store.accounts[idx] = account;
}

export async function archiveAccount(id) {
  const account = store.accounts.find(a => a.id === id);
  if (!account) throw new Error('Account not found');
  await updateAccount({
    ...account,
    isArchived: 'TRUE',
    updatedAt: new Date().toISOString(),
    updatedBy: store.user.email,
  });
}

export async function saveProfile(profile) {
  const row = [profile.email, profile.displayName, profile.baseCurrency, profile.dateFormat, profile.createdAt];
  if (!store.profile) {
    await sheetsPost(
      `/values/${encodeURIComponent('UserProfiles!A:E')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      { values: [row] }
    );
  } else {
    const rowNum = await findRowNumber('UserProfiles', profile.email);
    await sheetsPut(
      `/values/${encodeURIComponent(`UserProfiles!A${rowNum}:E${rowNum}`)}?valueInputOption=RAW`,
      { values: [row] }
    );
  }
  store.profile = profile;
}

async function _appendHistorySnapshot(account) {
  const snapshot = {
    id: crypto.randomUUID(),
    accountId: account.id,
    balance: account.balance,
    currency: account.currency,
    snapshotAt: account.updatedAt,
    updatedBy: account.updatedBy,
  };
  await sheetsPost(
    `/values/${encodeURIComponent('BalanceHistory!A:F')}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { values: [historyToRow(snapshot)] }
  );
  store.history.push(snapshot);
}
