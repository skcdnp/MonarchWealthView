// nav.js — sidebar navigation component.

import { store } from '../store.js';
import { signOut } from '../auth.js';
import { navigate } from '../router.js';

const NAV_ITEMS = [
  { hash: '#dashboard',   label: 'Dashboard',       icon: '▦' },
  { hash: '#accounts',    label: 'Accounts',         icon: '≡' },
  { hash: '#cash',        label: 'Cash & Liquid',    icon: '💧' },
  { hash: '#illiquid',    label: 'Illiquid Assets',  icon: '🏠' },
  { hash: '#liabilities', label: 'Liabilities',      icon: '📉' },
  { hash: '#allocation',  label: 'Asset Allocation', icon: '◔' },
  { hash: '#history',     label: 'Balance History',  icon: '📈' },
];

export function renderNav() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const user = store.user;
  const activeHash = window.location.hash || '#dashboard';

  sidebar.innerHTML = `
    <!-- Logo -->
    <div class="flex items-center gap-2 px-4 py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <span class="text-xl">👑</span>
      <span class="font-bold text-sm text-gray-800 dark:text-white leading-tight">Monarch<br>WealthView</span>
    </div>

    <!-- Nav links -->
    <nav class="flex-1 py-3 px-2 space-y-0.5">
      ${NAV_ITEMS.map(item => `
        <a href="${item.hash}"
           data-hash="${item.hash}"
           class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400
                  hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white
                  transition-colors cursor-pointer no-underline
                  ${activeHash === item.hash ? 'nav-link-active' : ''}">
          <span class="w-5 text-center text-base leading-none">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </nav>

    <!-- User section -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0">
      <a href="#profile"
         data-hash="#profile"
         class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400
                hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white
                transition-colors cursor-pointer no-underline
                ${activeHash === '#profile' ? 'nav-link-active' : ''}">
        ${user?.picture
          ? `<img src="${user.picture}" class="w-7 h-7 rounded-full flex-shrink-0" alt="${user.name}" referrerpolicy="no-referrer">`
          : `<span class="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
               ${(user?.name?.[0] || '?').toUpperCase()}
             </span>`
        }
        <span class="flex-1 min-w-0">
          <p class="font-medium text-xs text-gray-800 dark:text-white truncate">${user?.name || 'User'}</p>
          <p class="text-xs text-gray-400 truncate">${user?.email || ''}</p>
        </span>
      </a>
      <button id="signout-btn"
        class="w-full mt-1 px-3 py-2 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400
               text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        Sign out
      </button>
    </div>
  `;

  document.getElementById('signout-btn').addEventListener('click', signOut);

  // Nav link clicks go through the router (prevents full page reload)
  sidebar.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.hash);
    });
  });
}
