import { store } from '../store.js';
import { signOut } from '../auth.js';
import { navigate } from '../router.js';

const GROUPS = [
  {
    label: 'Overview',
    items: [
      { hash: '#dashboard', label: 'Dashboard',  dot: '#378ADD' },
      { hash: '#accounts',  label: 'Accounts',   dot: '#1D9E75' },
    ],
  },
  {
    label: 'Views',
    items: [
      { hash: '#cash',        label: 'Cash & Liquid',   dot: '#639922' },
      { hash: '#illiquid',    label: 'Illiquid Assets', dot: '#BA7517' },
      { hash: '#liabilities', label: 'Liabilities',     dot: '#E24B4A' },
      { hash: '#allocation',  label: 'Allocation',      dot: '#7F77DD' },
      { hash: '#history',     label: 'Balance History', dot: '#185FA5' },
    ],
  },
];

const PAGE_TITLES = {
  '#dashboard':   'Dashboard',
  '#accounts':    'Accounts',
  '#cash':        'Cash & Liquid',
  '#illiquid':    'Illiquid Assets',
  '#liabilities': 'Liabilities',
  '#allocation':  'Asset Allocation',
  '#history':     'Balance History',
  '#profile':     'Profile & Settings',
};

export function renderNav() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const user = store.user;
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const active = window.location.hash || '#dashboard';

  sidebar.innerHTML = `
    <!-- Logo -->
    <div class="nav-logo-block">
      <div class="nav-logo-name">WealthView</div>
      <div class="nav-logo-sub">Portfolio Manager</div>
    </div>

    <!-- Nav groups -->
    <div style="flex:1;padding-top:6px">
      ${GROUPS.map(g => `
        <div class="nav-section">
          <div class="nav-group-label">${g.label}</div>
          ${g.items.map(item => `
            <a class="nav-item ${active === item.hash ? 'active' : ''}"
               data-hash="${item.hash}" href="${item.hash}">
              <span class="nav-dot" style="background:${item.dot}"></span>
              ${item.label}
            </a>
          `).join('')}
        </div>
      `).join('')}
    </div>

    <!-- User footer -->
    <div class="nav-footer">
      <div class="nav-user">
        ${user?.picture
          ? `<img src="${user.picture}" class="nav-avatar" alt="" referrerpolicy="no-referrer">`
          : `<div class="nav-avatar-initials">${(user?.name?.[0] || '?').toUpperCase()}</div>`
        }
        <div style="min-width:0;flex:1">
          <div class="nav-user-name">${store.profile?.displayName || user?.name || 'User'}</div>
          <div class="nav-user-sub">${currency} · ${user?.email?.split('@')[0] || ''}</div>
        </div>
      </div>
      <button class="nav-signout" id="nav-signout-btn">Sign out</button>
    </div>
  `;

  // Nav link clicks through router
  sidebar.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      closeMobileSidebar();
      navigate(link.dataset.hash);
    });
  });

  document.getElementById('nav-signout-btn').addEventListener('click', signOut);
}

export function updateNavActive(hash) {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.hash === hash);
  });
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[hash] || '';
}

// ── Mobile sidebar ────────────────────────────────────────────────────────────

export function initMobileSidebar() {
  const hamburger = document.getElementById('hamburger-btn');
  const overlay   = document.getElementById('sidebar-overlay');
  const sidebar   = document.getElementById('sidebar');

  hamburger?.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('open');
  });
  overlay?.addEventListener('click', closeMobileSidebar);
}

export function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
}
