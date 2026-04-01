// views/illiquid.js — Illiquid and semi-liquid assets view.

import { store, assets } from '../store.js';
import { convert, formatCurrency } from '../currency.js';

export async function render(container) {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const illiquid = assets().filter(a => a.liquidity === 'Illiquid' || a.liquidity === 'Semi-liquid');

  const total = illiquid.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);

  const allAssets = assets().reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);

  const pct = allAssets > 0 ? ((total / allAssets) * 100).toFixed(1) : '0';

  // Group by type for breakdown
  const grouped = illiquid.reduce((acc, a) => {
    (acc[a.accountType] = acc[a.accountType] || []).push(a);
    return acc;
  }, {});

  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 border border-purple-100 dark:border-purple-900/40">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Illiquid</p>
        <p class="text-2xl font-bold text-purple-600 dark:text-purple-400 kpi-value">${formatCurrency(total, currency)}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Accounts</p>
        <p class="text-2xl font-bold text-gray-700 dark:text-white">${illiquid.length}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">% of Total Assets</p>
        <p class="text-2xl font-bold text-gray-700 dark:text-white">${pct}%</p>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-semibold text-gray-700 dark:text-gray-200">Illiquid Holdings</h3>
      </div>
      ${illiquid.length === 0
        ? `<p class="px-5 py-8 text-center text-sm text-gray-400">No illiquid assets found.</p>`
        : `<table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Account</th>
                <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
                <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Liquidity</th>
                <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</th>
                <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">% of Assets</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              ${illiquid.map(a => {
                const bal = convert(parseFloat(a.balance)||0, a.currency||'USD', currency);
                const pctRow = allAssets > 0 ? ((bal / allAssets)*100).toFixed(1) : '0';
                return `<tr class="account-row">
                  <td class="px-5 py-3">
                    <p class="font-medium text-gray-800 dark:text-white">${a.name}</p>
                    ${a.institution ? `<p class="text-xs text-gray-400">${a.institution}</p>` : ''}
                  </td>
                  <td class="px-5 py-3 text-gray-500 hidden sm:table-cell">${a.accountType}</td>
                  <td class="px-5 py-3">
                    <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium
                      ${a.liquidity === 'Semi-liquid'
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}">
                      ${a.liquidity}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-right font-medium text-purple-600 dark:text-purple-400 kpi-value">${formatCurrency(bal, currency)}</td>
                  <td class="px-5 py-3 text-right text-gray-500 hidden md:table-cell">${pctRow}%</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>`
      }
    </div>

    <!-- Breakdown by type -->
    ${Object.keys(grouped).length > 1 ? `
      <div class="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-700 dark:text-gray-200">By Type</h3>
        </div>
        <table class="w-full text-sm">
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            ${Object.entries(grouped).map(([type, accs]) => {
              const typeTotal = accs.reduce((s, a) => s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
              const typePct = total > 0 ? ((typeTotal / total)*100).toFixed(1) : '0';
              return `<tr class="account-row">
                <td class="px-5 py-3 text-gray-700 dark:text-gray-300">${type}</td>
                <td class="px-5 py-3 text-right font-medium text-purple-600 dark:text-purple-400 kpi-value">${formatCurrency(typeTotal, currency)}</td>
                <td class="px-5 py-3 text-right text-gray-400 text-xs">${typePct}%</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  `;
}
