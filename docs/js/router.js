// router.js — hash-based SPA routing.
// Hash routing works on GitHub Pages without any server config.
// Each view module exports a render(container) function.

const routes = {
  '#dashboard':   () => import('./views/dashboard.js'),
  '#accounts':    () => import('./views/accounts.js'),
  '#cash':        () => import('./views/cashLiquid.js'),
  '#illiquid':    () => import('./views/illiquid.js'),
  '#liabilities': () => import('./views/liabilities.js'),
  '#allocation':  () => import('./views/allocation.js'),
  '#history':     () => import('./views/history.js'),
  '#profile':     () => import('./views/profile.js'),
};

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

let currentChart = null; // track active Chart.js instance for cleanup

export function setCurrentChart(chart) {
  currentChart = chart;
}

export function destroyCurrentChart() {
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }
}

export async function navigate(hash) {
  const target = hash || window.location.hash || '#dashboard';
  window.location.hash = target;

  // Update page title
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[target] || '';

  // Highlight active nav link
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('nav-link-active', el.dataset.hash === target);
  });

  // Destroy any previous chart to prevent "canvas already in use" errors
  destroyCurrentChart();

  const container = document.getElementById('main-content');
  if (!container) return;

  const loader = routes[target];
  if (!loader) {
    container.innerHTML = '<p class="text-gray-400 p-8">Page not found.</p>';
    return;
  }

  try {
    const mod = await loader();
    await mod.render(container);
  } catch (err) {
    console.error('[MWV] View render error:', err);
    container.innerHTML = `
      <div style="padding:32px;color:#A32D2D;background:#FCEBEB;border-radius:12px;font-size:13px">
        <strong>View error:</strong> ${err.message}<br>
        <span style="color:#555;font-size:12px">Check the browser console (F12) for details.</span>
      </div>`;
  }
}

export function initRouter() {
  window.addEventListener('hashchange', () => navigate(window.location.hash));
}
