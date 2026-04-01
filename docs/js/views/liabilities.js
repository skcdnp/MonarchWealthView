// views/liabilities.js — liabilities view with debt-to-asset ratio.

import { store, assets, liabilities } from '../store.js';
import { convert, formatCurrency } from '../currency.js';

export async function render(container) {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const liabs = liabilities();
  const assetList = assets();

  const totalLiab = liabs.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const totalAssets = assetList.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);

  const dta = totalAssets > 0 ? ((totalLiab / totalAssets) * 100).toFixed(1) : '—';
  const dtaNum = totalAssets > 0 ? (totalLiab / totalAssets) * 100 : 0;
  const dtaColor = dtaNum > 80 ? 'text-red-500' : dtaNum > 40 ? 'text-yellow-500' : 'text-green-600';

  // Group by account type
  const grouped = liabs.reduce((acc, a) => {
    (acc[a.accountType] = acc[a.accountType] || []).push(a);
    return acc;
  }, {});

  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-100 dark:border-red-900/40">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Liabilities</p>
        <p class="text-2xl font-bold text-red-500 dark:text-red-400 kpi-value">${formatCurrency(totalLiab, currency)}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Accounts</p>
        <p class="text-2xl font-bold text-gray-700 dark:text-white">${liabs.length}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Debt-to-Asset Ratio</p>
        <p class="text-2xl font-bold kpi-value ${dtaColor}">${typeof dta === 'string' ? dta : dta + '%'}</p>
        ${totalAssets > 0 ? `<p class="text-xs text-gray-400 mt-1">${dtaNum > 80 ? 'High' : dtaNum > 40 ? 'Moderate' : 'Healthy'}</p>` : ''}
      </div>
    </div>

    ${Object.keys(grouped).length === 0
      ? `<div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
           <p class="text-gray-400 text-sm">No liabilities recorded.</p>
         </div>`
      : Object.entries(grouped).map(([type, accs]) => {
          const groupTotal = accs.reduce((s, a) =>
            s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
          return `
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-5">
              <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h3 class="font-semibold text-gray-700 dark:text-gray-200">${type}</h3>
                <span class="font-bold text-red-500 dark:text-red-400 kpi-value text-sm">${formatCurrency(groupTotal, currency)}</span>
              </div>
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Account</th>
                    <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</th>
                    <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">% of Debt</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  ${accs.map(a => {
                    const bal = convert(parseFloat(a.balance)||0, a.currency||'USD', currency);
                    const pct = totalLiab > 0 ? ((bal/totalLiab)*100).toFixed(1) : '0';
                    return `<tr class="account-row">
                      <td class="px-5 py-3">
                        <p class="font-medium text-gray-800 dark:text-white">${a.name}</p>
                        ${a.institution ? `<p class="text-xs text-gray-400">${a.institution}</p>` : ''}
                      </td>
                      <td class="px-5 py-3 text-right font-medium text-red-500 dark:text-red-400 kpi-value">${formatCurrency(bal, currency)}</td>
                      <td class="px-5 py-3 text-right text-gray-400 text-xs hidden md:table-cell">${pct}%</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('')
    }
  `;
}
