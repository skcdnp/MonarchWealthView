import { initAuth, renderSignInButton, requestAccessToken, signOut } from './auth.js';
import { loadAllData } from './sheets.js';
import { loadRates } from './currency.js';
import { renderNav, updateNavActive, initMobileSidebar } from './components/nav.js';
import { navigate, initRouter } from './router.js';

// ── Screen helpers ────────────────────────────────────────────────────────────

function showScreen(id) {
  const screens = ['signin-screen','access-denied-screen','loading-screen','app-shell'];
  screens.forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    el.style.display = s === id ? (s === 'app-shell' ? 'flex' : 'flex') : 'none';
  });
}

function setLoadingMessage(msg) {
  const el = document.getElementById('loading-message');
  if (el) el.textContent = msg;
}

// ── Consent screen (Sheets access) ───────────────────────────────────────────

function showSheetsConsentScreen(onGranted) {
  showScreen('loading-screen');
  document.getElementById('loading-screen').innerHTML = `
    <div style="text-align:center;max-width:320px;padding:24px;margin:0 auto">
      <div style="font-size:36px;margin-bottom:14px">📊</div>
      <p style="font-size:15px;font-weight:500;color:var(--text-primary);margin-bottom:6px">One more step</p>
      <p style="font-size:13px;color:var(--text-tertiary);margin-bottom:24px">
        MonarchWealthView needs permission to read and write your Google Sheet.
        A Google permission window will open — click <strong>Allow</strong>.
      </p>
      <button id="grant-sheets-btn" class="btn btn-primary" style="width:100%;justify-content:center;padding:10px 14px">
        Connect Google Sheets
      </button>
      <p id="grant-status" style="font-size:12px;color:var(--color-liability);margin-top:10px;min-height:18px"></p>
    </div>
  `;

  document.getElementById('grant-sheets-btn').addEventListener('click', async () => {
    const btn    = document.getElementById('grant-sheets-btn');
    const status = document.getElementById('grant-status');
    btn.disabled = true;
    btn.textContent = 'Waiting for permission…';
    status.textContent = '';

    const result = await requestAccessToken(true);
    if (result?.token) {
      onGranted();
    } else {
      btn.disabled = false;
      btn.textContent = 'Connect Google Sheets';
      status.textContent = result?.error === 'popup_closed'
        ? 'Window was closed — please try again.'
        : `Error: ${result?.error || 'unknown'}`;
    }
  });
}

// ── App load ──────────────────────────────────────────────────────────────────

async function loadApp() {
  showSheetsConsentScreen(async () => {
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

      // Date in top bar
      const dateEl = document.getElementById('topbar-date');
      if (dateEl) dateEl.textContent = 'As of ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      navigate(window.location.hash || '#dashboard');

    } catch (err) {
      console.error('Load failed:', err);
      setLoadingMessage(`Error: ${err.message}. Please refresh.`);
    }
  });
}

// ── Top bar wiring ────────────────────────────────────────────────────────────

function wireTopBar() {
  // Refresh on nav (update date)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash || '#dashboard';
    updateNavActive(hash);
    const dateEl = document.getElementById('topbar-date');
    if (dateEl) dateEl.textContent = 'As of ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  });

  // + Add Account button
  document.getElementById('add-account-topbar-btn')?.addEventListener('click', async () => {
    window._openAddForm = true;
    navigate('#accounts');
  });

  // Edit Profile button
  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    navigate('#profile');
  });

  // Refresh icon (re-use topbar date as a subtle click target — or add a refresh icon)
  document.getElementById('topbar-date')?.addEventListener('dblclick', async () => {
    try {
      await loadAllData();
      await loadRates();
      navigate(window.location.hash || '#dashboard');
    } catch (e) { /* silent */ }
  });
}

// ── Startup ───────────────────────────────────────────────────────────────────

async function init() {
  showScreen('loading-screen');
  setLoadingMessage('Initialising…');

  try {
    await initAuth(
      () => loadApp(),
      (email) => {
        document.getElementById('access-denied-email').textContent = email;
        document.getElementById('access-denied-signout').addEventListener('click', signOut);
        showScreen('access-denied-screen');
      }
    );
    showScreen('signin-screen');
    renderSignInButton('google-signin-btn');
  } catch (err) {
    console.error('Auth init failed:', err);
    setLoadingMessage(`Failed to initialise. Check connection and refresh. (${err.message})`);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
