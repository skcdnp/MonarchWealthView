// views/dashboard.js — net worth summary dashboard.

import { store, assets, liabilities } from '../store.js';
import { convert, formatCurrency } from '../currency.js';

export async function render(container) {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;

  const totalAssets = assets().reduce((sum, a) =>
    sum + convert(parseFloat(a.balance) || 0, a.currency || 'USD', currency), 0);

  const totalLiabilities = liabilities().reduce((sum, a) =>
    sum + convert(parseFloat(a.balance) || 0, a.currency || 'USD', currency), 0);

  const netWorth = totalAssets - totalLiabilities;

  container.innerHTML = `
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      ${kpiCard('Total Assets', totalAssets, currency, 'green')}
      ${kpiCard('Total Liabilities', totalLiabilities, currency, 'red')}
      ${kpiCard('Net Worth', netWorth, currency, netWorth >= 0 ? 'blue' : 'red')}
    </div>

    <!-- Account summary table -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
      <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h3 class="font-semibold text-gray-700 dark:text-gray-200">Asset Breakdown</h3>
        <a href="#accounts" id="view-all-link"
           class="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all accounts →</a>
      </div>
      ${assetBreakdownTable(currency)}
    </div>

    <!-- Liabilities summary -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-semibold text-gray-700 dark:text-gray-200">Liability Breakdown</h3>
      </div>
      ${liabilityBreakdownTable(currency)}
    </div>
  `;

  // Wire up "View all" link through router
  document.getElementById('view-all-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    const { navigate } = require('../router.js');
    navigate('#accounts');
  });
}

function kpiCard(label, value, currency, color) {
  const colors = {
    green: 'text-green-600 dark:text-green-400',
    red:   'text-red-500 dark:text-red-400',
    blue:  'text-blue-600 dark:text-blue-400',
  };
  const bg = {
    green: 'bg-green-50 dark:bg-green-900/20',
    red:   'bg-red-50 dark:bg-red-900/20',
    blue:  'bg-blue-50 dark:bg-blue-900/20',
  };
  return `
    <div class="${bg[color]} rounded-xl p-6 border border-${color}-100 dark:border-${color}-900/40">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">${label}</p>
      <p class="text-2xl font-bold kpi-value ${colors[color]}">${formatCurrency(value, currency)}</p>
    </div>
  `;
}

function assetBreakdownTable(currency) {
  const grouped = groupByType(assets());
  if (Object.keys(grouped).length === 0) {
    return `<p class="px-5 py-8 text-sm text-gray-400 text-center">No assets yet. <a href="#accounts" class="text-blue-600 underline">Add your first account →</a></p>`;
  }
  return `
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-gray-700/50">
        <tr>
          <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
          <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Count</th>
          <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Value (${currency})</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
        ${Object.entries(grouped).map(([type, accs]) => {
          const total = accs.reduce((s, a) => s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
          return `
            <tr class="account-row">
              <td class="px-5 py-3 text-gray-700 dark:text-gray-300">${type}</td>
              <td class="px-5 py-3 text-right text-gray-500">${accs.length}</td>
              <td class="px-5 py-3 text-right font-medium text-green-600 dark:text-green-400 kpi-value">${formatCurrency(total, currency)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function liabilityBreakdownTable(currency) {
  const grouped = groupByType(liabilities());
  if (Object.keys(grouped).length === 0) {
    return `<p class="px-5 py-8 text-sm text-gray-400 text-center">No liabilities recorded.</p>`;
  }
  return `
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-gray-700/50">
        <tr>
          <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
          <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Count</th>
          <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Balance (${currency})</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
        ${Object.entries(grouped).map(([type, accs]) => {
          const total = accs.reduce((s, a) => s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
          return `
            <tr class="account-row">
              <td class="px-5 py-3 text-gray-700 dark:text-gray-300">${type}</td>
              <td class="px-5 py-3 text-right text-gray-500">${accs.length}</td>
              <td class="px-5 py-3 text-right font-medium text-red-500 dark:text-red-400 kpi-value">${formatCurrency(total, currency)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function groupByType(accountList) {
  return accountList.reduce((acc, a) => {
    (acc[a.accountType] = acc[a.accountType] || []).push(a);
    return acc;
  }, {});
}
