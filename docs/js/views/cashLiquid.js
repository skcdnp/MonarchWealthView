// views/cashLiquid.js — Cash & Liquid assets view.

import { store, assets } from '../store.js';
import { convert, formatCurrency } from '../currency.js';
import { setCurrentChart } from '../router.js';

export async function render(container) {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const liquid = assets().filter(a => a.liquidity === 'Liquid' || a.liquidity === 'Semi-liquid');

  const total = liquid.reduce((s, a) =>
    s + convert(parseFloat(a.balance) || 0, a.currency || 'USD', currency), 0);

  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-900/40">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Liquid</p>
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 kpi-value">${formatCurrency(total, currency)}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">Accounts</p>
        <p class="text-2xl font-bold text-gray-700 dark:text-white">${liquid.length}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">% of Total Assets</p>
        <p class="text-2xl font-bold text-gray-700 dark:text-white">${pctOfAssets(liquid, currency)}%</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-700 dark:text-gray-200">Liquid Accounts</h3>
        </div>
        ${liquid.length === 0
          ? `<p class="px-5 py-8 text-center text-sm text-gray-400">No liquid accounts found.</p>`
          : `<table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Account</th>
                  <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                  <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                ${liquid.map(a => {
                  const bal = convert(parseFloat(a.balance)||0, a.currency||'USD', currency);
                  return `<tr class="account-row">
                    <td class="px-5 py-3">
                      <p class="font-medium text-gray-800 dark:text-white">${a.name}</p>
                      ${a.liquidity === 'Semi-liquid' ? `<span class="text-xs text-yellow-600">Semi-liquid</span>` : ''}
                    </td>
                    <td class="px-5 py-3 text-gray-500">${a.accountType}</td>
                    <td class="px-5 py-3 text-right font-medium text-green-600 dark:text-green-400 kpi-value">${formatCurrency(bal, currency)}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>`
        }
      </div>

      <!-- Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <h3 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">Balance by Account</h3>
        ${liquid.length === 0
          ? `<p class="text-center text-sm text-gray-400 py-8">No data to chart.</p>`
          : `<div class="chart-container" style="height:280px">
               <canvas id="liquid-chart"></canvas>
             </div>`
        }
      </div>
    </div>
  `;

  if (liquid.length > 0) {
    const labels = liquid.map(a => a.name);
    const values = liquid.map(a => convert(parseFloat(a.balance)||0, a.currency||'USD', currency));
    const colors = generateColors(liquid.length);

    const chart = new Chart(document.getElementById('liquid-chart'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: currency,
          data: values,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            ticks: {
              callback: v => formatCurrency(v, currency, true),
              color: '#9ca3af',
            },
            grid: { color: 'rgba(156,163,175,0.15)' },
          },
          x: { ticks: { color: '#9ca3af' }, grid: { display: false } },
        },
      },
    });
    setCurrentChart(chart);
  }
}

function pctOfAssets(subset, currency) {
  const subTotal = subset.reduce((s, a) => s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const allAssets = assets().reduce((s, a) => s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  if (allAssets === 0) return '0';
  return ((subTotal / allAssets) * 100).toFixed(1);
}

function generateColors(n) {
  const palette = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316','#84cc16'];
  const bg     = Array.from({length:n}, (_,i) => palette[i % palette.length] + '33');
  const border = Array.from({length:n}, (_,i) => palette[i % palette.length]);
  return { bg, border };
}
