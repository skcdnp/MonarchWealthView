import {
  initAuth, renderSignInButton, requestAccessToken,
  setAccessToken, signOut,
  extractRedirectToken, restoreUserFromSession,
} from './auth.js';
import { loadAllData } from './sheets.js';
import { loadRates } from './currency.js';
import { store } from './store.js';
import { renderNav, updateNavActive, initMobileSidebar } from './components/nav.js';
import { navigate, initRouter } from './router.js';

// ── Screen helpers ────────────────────────────────────────────────────────────

function showScreen(id) {
  ['signin-screen','access-denied-screen','loading-screen','app-shell'].forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    el.style.display = s === id ? 'flex' : 'none';
  });
}

function setLoadingMessage(msg) {
  const el = document.getElementById('loading-message');
  if (el) el.textContent = msg;
}

// ── Consent screen (shown after GSI sign-in, before Sheets redirect) ──────────

function showSheetsConsentScreen() {
  showScreen('loading-screen');
  document.getElementById('loading-screen').innerHTML = `
    <div style="text-align:center;max-width:320px;padding:24px;margin:0 auto">
      <div style="font-size:36px;margin-bottom:14px">📊</div>
      <p style="font-size:15px;font-weight:500;color:var(--text-primary);margin-bottom:6px">One more step</p>
      <p style="font-size:13px;color:var(--text-tertiary);margin-bottom:24px">
        MonarchWealthView needs permission to access your Google Sheet.
        You'll be redirected to Google to approve — then brought right back.
      </p>
      <button id="grant-sheets-btn" class="btn btn-primary" style="width:100%;justify-content:center;padding:10px 14px">
        Connect Google Sheets
      </button>
    </div>
  `;

  // requestAccessToken() does a full-page redirect — no return value
  document.getElementById('grant-sheets-btn').addEventListener('click', () => {
    const btn = document.getElementById('grant-sheets-btn');
    btn.disabled = true;
    btn.textContent = 'Redirecting to Google…';
    requestAccessToken();
  });
}

// ── App load (called once we have a valid Sheets token) ───────────────────────

async function finishLoading() {
  showScreen('loading-screen');
  document.getElementById('loading-screen').innerHTML = `
    <div style="text-align:center">
      <div style="width:36px;height:36px;border-radius:50%;border:2.5px solid rgba(0,0,0,0.08);border-top-color:var(--color-primary);animation:spin 0.7s linear infinite;margin:0 auto 14px"></div>
      <p id="loading-message" style="font-size:13px;color:var(--text-tertiary)">Loading portfolio data…</p>
    </div>
  `;

  try {
    await loadAllData();
    setLoadingMessage('Loading exchange rates…');
    await loadRates();

    showScreen('app-shell');
    renderNav();
    initMobileSidebar();
    wireTopBar();
    initRouter();

    const dateEl = document.getElementById('topbar-date');
    if (dateEl) dateEl.textContent = 'As of ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    navigate(window.location.hash || '#dashboard');

  } catch (err) {
    console.error('[MWV] Load failed:', err);
    document.getElementById('loading-screen').innerHTML = `
      <div style="text-align:center;max-width:320px;padding:24px;margin:0 auto">
        <div style="font-size:36px;margin-bottom:14px">⚠️</div>
        <p style="font-size:15px;font-weight:500;color:var(--color-liability);margin-bottom:6px">Failed to load data</p>
        <p style="font-size:12px;color:var(--text-tertiary);margin-bottom:20px">${err.message}</p>
        <button class="btn btn-outline" onclick="window.location.reload()">Retry</button>
      </div>
    `;
  }
}

// ── Top bar ───────────────────────────────────────────────────────────────────

function wireTopBar() {
  window.addEventListener('hashchange', () => {
    updateNavActive(window.location.hash || '#dashboard');
    const dateEl = document.getElementById('topbar-date');
    if (dateEl) dateEl.textContent = 'As of ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  });

  document.getElementById('add-account-topbar-btn')?.addEventListener('click', () => {
    window._openAddForm = true;
    navigate('#accounts');
  });

  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    navigate('#profile');
  });
}

// ── Startup ───────────────────────────────────────────────────────────────────

async function init() {
  showScreen('loading-screen');
  setLoadingMessage('Initialising…');

  // ── Check for OAuth error returned by Google ──
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  if (hashParams.get('error')) {
    const errMsg = hashParams.get('error_description') || hashParams.get('error');
    history.replaceState(null, '', window.location.pathname);
    console.error('[MWV] OAuth error from Google:', errMsg);
    document.getElementById('loading-screen').innerHTML = `
      <div style="text-align:center;max-width:320px;padding:24px;margin:0 auto">
        <div style="font-size:36px;margin-bottom:14px">⚠️</div>
        <p style="font-size:15px;font-weight:500;color:var(--color-liability);margin-bottom:6px">Google auth error</p>
        <p style="font-size:12px;color:var(--text-tertiary);margin-bottom:20px">${errMsg}</p>
        <button class="btn btn-outline" onclick="window.location.reload()">Try again</button>
      </div>
    `;
    return;
  }

  // ── Case 1: returning from OAuth redirect with access token in URL ──
  const redirect = extractRedirectToken();
  if (redirect?.token) {
    // Restore user from sessionStorage (saved before we left)
    const user = redirect.user || restoreUserFromSession();
    if (user) {
      store.user = user;
      try {
        await Promise.all([
          new Promise((resolve, reject) => { try { gapi.load('client', { callback: resolve, onerror: reject }); } catch(e) { reject(e); } }),
        ]);
        await gapi.client.init({});
      } catch (e) { /* gapi may already be loaded */ }
      setAccessToken(redirect.token);
      await finishLoading();
      return;
    }
  }

  // ── Case 2: normal startup — show sign-in screen ──
  try {
    await initAuth(
      // Whitelist passed — show Sheets consent screen
      () => showSheetsConsentScreen(),
      // Not on whitelist
      (email) => {
        document.getElementById('access-denied-email').textContent = email;
        document.getElementById('access-denied-signout').addEventListener('click', signOut);
        showScreen('access-denied-screen');
      }
    );
    showScreen('signin-screen');
    renderSignInButton('google-signin-btn');
  } catch (err) {
    console.error('[MWV] Auth init failed:', err);
    setLoadingMessage(`Failed to initialise. Check connection and refresh. (${err.message})`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
