// auth.js — Google authentication using two separate Google libraries:
//
//   1. Google Identity Services (GSI) — sign-in button + ID token (who the user is)
//   2. gapi token client — access token for Sheets API calls (what they can do)
//
// The two-library approach is Google's current recommended pattern for browser SPAs.
// The older gapi.auth2 library is deprecated.

import { store } from './store.js';

let tokenClient = null;
let resolveTokenPromise = null;

// Decode a JWT without verifying the signature.
// Signature verification is Google's job on their servers; we just need the payload.
function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

// Wait for a global variable to appear (Google scripts load asynchronously)
function waitForGlobal(name, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (window[name]) return resolve(window[name]);
    const start = Date.now();
    const interval = setInterval(() => {
      if (window[name]) { clearInterval(interval); resolve(window[name]); }
      else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timed out waiting for window.${name}`));
      }
    }, 50);
  });
}

/**
 * Initialise both Google auth libraries.
 * Must be called once before renderSignInButton() or requestAccessToken().
 * @param {function} onSignIn  Called with the user object after whitelist check passes.
 * @param {function} onDenied  Called with the user's email if not on the whitelist.
 */
export async function initAuth(onSignIn, onDenied) {
  // Wait for both Google scripts to be ready
  await Promise.all([
    waitForGlobal('google'),
    waitForGlobal('gapi'),
  ]);

  // --- 1. Google Identity Services (sign-in + ID token) ---
  google.accounts.id.initialize({
    client_id: CONFIG.CLIENT_ID,
    callback: (response) => handleCredential(response, onSignIn, onDenied),
    auto_select: true,          // auto-signs in returning users silently
    cancel_on_tap_outside: false,
  });

  // --- 2. gapi client (Sheets API access token) ---
  await new Promise((resolve, reject) => {
    gapi.load('client', { callback: resolve, onerror: reject });
  });

  await gapi.client.init({
    discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
  });

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CONFIG.CLIENT_ID,
    scope: CONFIG.SCOPES,
    callback: (tokenResponse) => {
      const resolve = resolveTokenPromise;
      resolveTokenPromise = null;
      if (tokenResponse.error) {
        console.error('Token error:', tokenResponse.error);
        resolve({ error: tokenResponse.error });
      } else {
        gapi.client.setToken({ access_token: tokenResponse.access_token });
        resolve({ token: tokenResponse.access_token });
      }
    },
    error_callback: (err) => {
      // Fired when the user closes the consent popup or popups are blocked
      console.error('Token client error:', err);
      const resolve = resolveTokenPromise;
      resolveTokenPromise = null;
      if (resolve) resolve({ error: err.type || 'popup_closed' });
    },
  });
}

/**
 * Render the "Sign in with Google" button in the given container element.
 */
export function renderSignInButton(containerId) {
  google.accounts.id.renderButton(
    document.getElementById(containerId),
    {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 280,
    }
  );
  // Also prompt One Tap if the user has previously signed in
  google.accounts.id.prompt();
}

/**
 * Request a Sheets-scoped access token.
 * Returns { token } on success or { error } on failure.
 * Pass forceConsent=true to always show the Google consent screen
 * (required when called from a direct user click to avoid popup blockers).
 */
export function requestAccessToken(forceConsent = false) {
  return new Promise((resolve) => {
    resolveTokenPromise = resolve;
    tokenClient.requestAccessToken({ prompt: forceConsent ? 'consent' : '' });
  });
}

/**
 * Sign the user out and clear local state.
 */
export function signOut() {
  const email = store.user?.email;
  store.user = null;
  store.accounts = [];
  store.history = [];
  store.profile = null;
  gapi.client.setToken(null);
  if (email) google.accounts.id.revoke(email, () => {});
  google.accounts.id.disableAutoSelect();
  // Reload so the sign-in screen re-renders cleanly
  window.location.reload();
}

// Internal: called by GSI after the user clicks "Sign in with Google"
async function handleCredential(response, onSignIn, onDenied) {
  const payload = parseJwt(response.credential);
  const user = {
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };

  const allowed = CONFIG.WHITELIST
    .map(e => e.toLowerCase().trim())
    .includes(user.email.toLowerCase().trim());

  if (!allowed) {
    onDenied(user.email);
    return;
  }

  store.user = user;
  onSignIn(user);
}
