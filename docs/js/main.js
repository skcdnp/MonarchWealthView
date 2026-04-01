// main.js — app entry point.
// Orchestrates the startup sequence:
//   1. Init Google auth libraries
//   2. Show sign-in screen
//   3. On successful auth + whitelist pass → get Sheets access token
//   4. Load all data from Google Sheets
//   5. Load FX rates
//   6. Show app shell and route to #dashboard

import { initAuth, renderSignInButton, requestAccessToken, signOut } from './auth.js';
import { loadAllData } from './sheets.js';
import { loadRates } from './currency.js';
import { store } from './store.js';
import { renderNav } from './components/nav.js';
import { navigate, initRouter } from './router.js';

// ── Screen helpers ────────────────────────────────────────────────────────────

function showScreen(id) {
  ['signin-screen', 'access-denied-screen', 'loading-screen', 'app-shell']
    .forEach(s => document.getElementById(s)?.classList.toggle('hidden', s !== id));
}

function setLoadingMessage(msg) {
  const el = document.getElementById('loading-message');
  if (el) el.textContent = msg;
}

// ── Dark mode ─────────────────────────────────────────────────────────────────

function initDarkMode() {
  const saved = localStorage.getItem('mwv_dark');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (saved === 'true' || (saved === null && prefersDark)) {
    document.documentElement.classList.add('dark');
  }

  document.getElementById('darkmode-btn')?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('mwv_dark', isDark);
    document.getElementById('darkmode-btn').textContent = isDark ? '☀️' : '🌙';
  });

  const isDark = document.documentElement.classList.contains('dark');
  const btn = document.getElementById('darkmode-btn');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
}

// ── Sheets consent screen ─────────────────────────────────────────────────────
// Shown after Google sign-in. The user must click a button to grant Sheets access.
// Using an explicit button (direct user action) prevents popup blockers from
// silently swallowing the consent window.

function showSheetsConsentScreen(onGranted) {
  const screen = document.getElementById('loading-screen');
  screen.classList.remove('hidden');
  screen.innerHTML = `
    <div class="text-center max-w-sm px-6">
      <div class="text-4xl mb-4">📊</div>
      <h2 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">One more step</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        MonarchWealthView needs permission to read and write your Google Sheet.
        A Google permission window will open — please click <strong>Allow</strong>.
      </p>
      <button id="grant-sheets-btn"
        class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm w-full mb-3">
        Connect Google Sheets
      </button>
      <p class="text-xs text-gray-400" id="grant-status"></p>
    </div>
  `;

  document.getElementById('grant-sheets-btn').addEventListener('click', async () => {
    const btn = document.getElementById('grant-sheets-btn');
    const status = document.getElementById('grant-status');
    btn.disabled = true;
    btn.textContent = 'Waiting for permission…';
    status.textContent = '';

    const result = await requestAccessToken(true); // forceConsent=true — called from click, safe from popup blockers

    if (result?.token) {
      onGranted();
    } else {
      btn.disabled = false;
      btn.textContent = 'Connect Google Sheets';
      status.textContent = result?.error === 'popup_closed'
        ? 'Window was closed. Please try again.'
        : `Error: ${result?.error || 'unknown'}. Please try again.`;
    }
  });
}

// ── App load sequence ─────────────────────────────────────────────────────────

async function loadApp(user) {
  // Step 1: Show the Sheets consent screen with an explicit button.
  // This avoids popup blockers and gives the user clear feedback.
  showSheetsConsentScreen(async () => {
    await finishLoading();
  });
}

async function finishLoading() {
  const screen = document.getElementById('loading-screen');
  screen.innerHTML = `
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p id="loading-message" class="text-gray-400 dark:text-gray-500 text-sm">Loading portfolio data…</p>
    </div>
  `;

  try {
    await loadAllData();
    setLoadingMessage('Loading exchange rates…');
    await loadRates();

    showScreen('app-shell');
    initDarkMode();
    renderNav();
    initRouter();

    document.getElementById('refresh-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('refresh-btn');
      btn.style.opacity = '0.4';
      btn.style.pointerEvents = 'none';
      try {
        await loadAllData();
        await loadRates();
        navigate(window.location.hash || '#dashboard');
      } finally {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }
    });

    navigate(window.location.hash || '#dashboard');

  } catch (err) {
    console.error('App load failed:', err);
    setLoadingMessage(`Error: ${err.message}. Please refresh the page.`);
  }
}

// ── Startup ───────────────────────────────────────────────────────────────────

async function init() {
  showScreen('loading-screen');
  setLoadingMessage('Initialising…');

  try {
    await initAuth(
      // onSignIn — user is on the whitelist
      (user) => {
        loadApp(user);
      },
      // onDenied — user is NOT on the whitelist
      (email) => {
        document.getElementById('access-denied-email').textContent = email;
        document.getElementById('access-denied-signout').addEventListener('click', signOut);
        showScreen('access-denied-screen');
      }
    );

    // Show sign-in screen and render the Google button
    showScreen('signin-screen');
    renderSignInButton('google-signin-btn');

  } catch (err) {
    console.error('Auth init failed:', err);
    setLoadingMessage(`Failed to load Google sign-in. Check your internet connection and refresh. (${err.message})`);
  }
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
