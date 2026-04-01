// views/allocation.js — asset allocation donut chart view.

import { store, assets } from '../store.js';
import { convert, formatCurrency } from '../currency.js';
import { setCurrentChart } from '../router.js';

const COLORS = [
  '#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444',
  '#06b6d4','#f97316','#84cc16','#ec4899','#14b8a6',
  '#a78bfa','#fb923c','#4ade80','#f472b6','#38bdf8',
];

export async function render(container) {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const assetList = assets();

  // Group by accountType
  const grouped = assetList.reduce((acc, a) => {
    (acc[a.accountType] = acc[a.accountType] || []).push(a);
    return acc;
  }, {});

  const labels = Object.keys(grouped);
  const values = labels.map(type =>
    grouped[type].reduce((s, a) =>
      s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0)
  );
  const total = values.reduce((s, v) => s + v, 0);
  const bgColors = labels.map((_, i) => COLORS[i % COLORS.length]);

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Donut Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h3 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">Asset Allocation</h3>
        ${assetList.length === 0
          ? `<p class="text-center text-sm text-gray-400 py-12">No assets to display.</p>`
          : `<div class="relative chart-container" style="height:300px">
               <canvas id="alloc-chart"></canvas>
               <div class="donut-center">
                 <p class="text-xs text-gray-400">Total</p>
                 <p class="text-lg font-bold text-gray-800 dark:text-white kpi-value">${formatCurrency(total, currency, true)}</p>
               </div>
             </div>`
        }
      </div>

      <!-- Legend / breakdown table -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 class="font-semibold text-gray-700 dark:text-gray-200">Breakdown</h3>
        </div>
        ${labels.length === 0
          ? `<p class="px-5 py-8 text-center text-sm text-gray-400">No data.</p>`
          : `<table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                  <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Value</th>
                  <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Allocation</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                ${labels.map((label, i) => {
                  const pct = total > 0 ? ((values[i]/total)*100).toFixed(1) : '0';
                  return `<tr class="account-row">
                    <td class="px-5 py-3">
                      <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${bgColors[i]}"></span>
                        <span class="text-gray-700 dark:text-gray-300">${label}</span>
                      </div>
                    </td>
                    <td class="px-5 py-3 text-right font-medium text-gray-800 dark:text-white kpi-value">
                      ${formatCurrency(values[i], currency)}
                    </td>
                    <td class="px-5 py-3 text-right text-gray-500">${pct}%</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>`
        }
      </div>
    </div>
  `;

  if (assetList.length > 0 && labels.length > 0) {
    const chart = new Chart(document.getElementById('alloc-chart'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: 'transparent',
          hoverBorderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct = total > 0 ? ((ctx.raw / total)*100).toFixed(1) : 0;
                return ` ${formatCurrency(ctx.raw, currency)} (${pct}%)`;
              },
            },
          },
        },
      },
    });
    setCurrentChart(chart);
  }
}
