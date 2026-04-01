// auth.js — Google authentication
//
// Two Google libraries:
//   1. GSI (accounts.google.com/gsi/client) — sign-in button + ID token
//   2. gapi — stores the Sheets access token in memory
//
// GitHub Pages sets Cross-Origin-Opener-Policy: same-origin which blocks
// OAuth popups. We use ux_mode: 'redirect' so the token flow is a full-page
// redirect instead of a popup — this is unaffected by COOP.
//
// Redirect flow:
//   1. User signs in with GSI → we save user to sessionStorage
//   2. User clicks "Connect Sheets" → tokenClient redirects to Google
//   3. Google redirects back → #access_token=... in the URL hash
//   4. main.js detects the token in the hash, restores user, loads data

import { store } from './store.js';

const SESSION_USER_KEY = 'mwv_user';

function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

function waitForGlobal(name, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (window[name]) return resolve(window[name]);
    const start = Date.now();
    const interval = setInterval(() => {
      if (window[name]) { clearInterval(interval); resolve(window[name]); }
      else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timed out waiting for ${name}`));
      }
    }, 50);
  });
}

// Save/restore user across the redirect
export function saveUserToSession(user) {
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}
export function restoreUserFromSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function clearUserFromSession() {
  sessionStorage.removeItem(SESSION_USER_KEY);
}

/**
 * Check if the current URL contains an OAuth access token returned by the
 * redirect flow (#access_token=...). Call this before showing the sign-in
 * screen — if a token is present we can skip the whole auth UI.
 *
 * Returns { token, user } if a redirect token is present, null otherwise.
 */
export function extractRedirectToken() {
  const hash = window.location.hash;
  if (!hash.includes('access_token=')) return null;

  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
  const accessToken = params.get('access_token');
  if (!accessToken) return null;

  // Clean the token out of the URL so hash-based routing works normally
  history.replaceState(null, '', window.location.pathname);

  const user = restoreUserFromSession();
  return { token: accessToken, user };
}

/**
 * Initialise both Google auth libraries.
 */
export async function initAuth(onSignIn, onDenied) {
  await Promise.all([waitForGlobal('google'), waitForGlobal('gapi')]);

  // 1. GSI — sign-in button
  google.accounts.id.initialize({
    client_id: CONFIG.CLIENT_ID,
    callback: (response) => handleCredential(response, onSignIn, onDenied),
    auto_select: true,
    cancel_on_tap_outside: false,
  });

  // 2. gapi — used only to store/retrieve the access token in memory
  await new Promise((resolve, reject) => {
    gapi.load('client', { callback: resolve, onerror: reject });
  });
  await gapi.client.init({});

}

export function renderSignInButton(containerId) {
  google.accounts.id.renderButton(
    document.getElementById(containerId),
    { theme: 'outline', size: 'large', text: 'signin_with', shape: 'rectangular', width: 280 }
  );
  google.accounts.id.prompt();
}

/**
 * Redirect to Google's OAuth authorization endpoint (implicit/token flow).
 * Google returns the access token in the URL hash: #access_token=...
 * This approach requires only an Authorized JavaScript Origin in Google Cloud —
 * no redirect URI registration needed.
 */
export function requestAccessToken() {
  const redirectUri = window.location.origin + window.location.pathname;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id',             CONFIG.CLIENT_ID);
  url.searchParams.set('redirect_uri',          redirectUri);
  url.searchParams.set('response_type',         'token');
  url.searchParams.set('scope',                 CONFIG.SCOPES);
  url.searchParams.set('include_granted_scopes','true');
  url.searchParams.set('prompt',                'consent');
  window.location.href = url.toString();
  // Page navigates away — execution stops here
}

export function setAccessToken(token) {
  gapi.client.setToken({ access_token: token });
}

export function signOut() {
  const email = store.user?.email;
  clearUserFromSession();
  store.user = null;
  store.accounts = [];
  store.history = [];
  store.profile = null;
  gapi.client.setToken(null);
  if (email) google.accounts.id.revoke(email, () => {});
  google.accounts.id.disableAutoSelect();
  window.location.reload();
}

async function handleCredential(response, onSignIn, onDenied) {
  const payload = parseJwt(response.credential);
  const user = { email: payload.email, name: payload.name, picture: payload.picture };

  const allowed = CONFIG.WHITELIST
    .map(e => e.toLowerCase().trim())
    .includes(user.email.toLowerCase().trim());

  if (!allowed) { onDenied(user.email); return; }

  // Save to sessionStorage so we can restore after the redirect
  saveUserToSession(user);
  store.user = user;
  onSignIn(user);
}
