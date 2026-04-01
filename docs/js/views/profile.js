// views/profile.js — user profile and preferences.

import { store } from '../store.js';
import { saveProfile } from '../sheets.js';
import { showToast } from '../components/toast.js';

export async function render(container) {
  const p = store.profile;
  const user = store.user;

  const currencyOptions = CONFIG.CURRENCIES.map(c =>
    `<option value="${c}" ${(p?.baseCurrency || CONFIG.BASE_CURRENCY) === c ? 'selected' : ''}>${c}</option>`
  ).join('');

  const dateOptions = CONFIG.DATE_FORMATS.map(f =>
    `<option value="${f}" ${(p?.dateFormat || 'MM/DD/YYYY') === f ? 'selected' : ''}>${f}</option>`
  ).join('');

  container.innerHTML = `
    <div class="max-w-lg">
      <!-- Account info (read-only from Google) -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
        <h3 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">Google Account</h3>
        <div class="flex items-center gap-4">
          ${user?.picture
            ? `<img src="${user.picture}" class="w-14 h-14 rounded-full" alt="${user.name}" referrerpolicy="no-referrer">`
            : `<div class="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                 ${(user?.name?.[0] || '?').toUpperCase()}
               </div>`
          }
          <div>
            <p class="font-medium text-gray-800 dark:text-white">${user?.name || ''}</p>
            <p class="text-sm text-gray-400">${user?.email || ''}</p>
          </div>
        </div>
      </div>

      <!-- Preferences form -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">Preferences</h3>
        <form id="profile-form" class="space-y-4">
          <!-- Display Name -->
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Display Name</label>
            <input id="p-name" type="text" value="${p?.displayName || user?.name || ''}"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <!-- Base Currency -->
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Base Currency</label>
            <select id="p-currency"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500">
              ${currencyOptions}
            </select>
            <p class="text-xs text-gray-400 mt-1">All totals and charts will display in this currency.</p>
          </div>
          <!-- Date Format -->
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date Format</label>
            <select id="p-dateformat"
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500">
              ${dateOptions}
            </select>
          </div>
          <!-- Save -->
          <div class="pt-2">
            <button type="submit"
              class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    const profile = {
      email:        store.user.email,
      displayName:  document.getElementById('p-name').value.trim() || store.user.name,
      baseCurrency: document.getElementById('p-currency').value,
      dateFormat:   document.getElementById('p-dateformat').value,
      createdAt:    store.profile?.createdAt || new Date().toISOString(),
    };

    try {
      await saveProfile(profile);
      showToast('Preferences saved', 'success');
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Preferences';
    }
  });
}
