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

// ── App load sequence ─────────────────────────────────────────────────────────

async function loadApp(user) {
  showScreen('loading-screen');
  setLoadingMessage('Connecting to Google Sheets…');

  try {
    // Get Sheets-scoped access token (prompts user only if needed)
    await requestAccessToken();

    setLoadingMessage('Loading portfolio data…');
    await loadAllData();

    setLoadingMessage('Loading exchange rates…');
    await loadRates();

    // Show the app
    showScreen('app-shell');
    initDarkMode();
    renderNav();
    initRouter();

    // Wire up refresh button
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

    // Route to initial view
    navigate(window.location.hash || '#dashboard');

  } catch (err) {
    console.error('App load failed:', err);
    // If token failed, it may be a gapi not-ready issue — stay on loading with error
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
