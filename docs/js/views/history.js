// views/history.js — balance history table and trend line chart.

import { store } from '../store.js';
import { formatCurrency, formatDate, convert } from '../currency.js';
import { setCurrentChart } from '../router.js';

export async function render(container) {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const dateFormat = store.profile?.dateFormat || 'MM/DD/YYYY';

  // Build account selector options (only accounts that have history)
  const accountsWithHistory = store.accounts.filter(a =>
    store.history.some(h => h.accountId === a.id)
  );

  const selectedId = accountsWithHistory[0]?.id || '';

  container.innerHTML = `
    <div class="flex flex-wrap items-center gap-3 mb-5">
      <select id="history-account-select"
        class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
               bg-white dark:bg-gray-700 text-sm text-gray-800 dark:text-white
               focus:outline-none focus:ring-2 focus:ring-blue-500">
        ${accountsWithHistory.length === 0
          ? `<option value="">No history yet</option>`
          : accountsWithHistory.map(a =>
              `<option value="${a.id}">${a.name}</option>`
            ).join('')
        }
      </select>
    </div>

    <!-- Chart -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 mb-6">
      <h3 class="font-semibold text-gray-700 dark:text-gray-200 mb-4">Balance Over Time</h3>
      <div class="chart-container" style="height:260px">
        <canvas id="history-chart"></canvas>
      </div>
    </div>

    <!-- History table -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 class="font-semibold text-gray-700 dark:text-gray-200">Snapshot Log</h3>
      </div>
      <div id="history-table-body">
        ${renderTable(selectedId, currency, dateFormat)}
      </div>
    </div>
  `;

  if (selectedId) renderChart(selectedId, currency);

  document.getElementById('history-account-select')?.addEventListener('change', (e) => {
    const id = e.target.value;
    document.getElementById('history-table-body').innerHTML = renderTable(id, currency, dateFormat);
    renderChart(id, currency);
  });
}

function renderTable(accountId, currency, dateFormat) {
  const rows = store.history
    .filter(h => h.accountId === accountId)
    .sort((a, b) => new Date(b.snapshotAt) - new Date(a.snapshotAt));

  if (rows.length === 0) {
    return `<p class="px-5 py-8 text-center text-sm text-gray-400">No history for this account.</p>`;
  }

  return `
    <table class="w-full text-sm">
      <thead class="bg-gray-50 dark:bg-gray-700/50">
        <tr>
          <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
          <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</th>
          <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Change</th>
          <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Updated By</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
        ${rows.map((h, i) => {
          const bal = convert(parseFloat(h.balance)||0, h.currency||'USD', currency);
          const prev = rows[i+1] ? convert(parseFloat(rows[i+1].balance)||0, rows[i+1].currency||'USD', currency) : null;
          const change = prev !== null ? bal - prev : null;
          return `<tr class="account-row">
            <td class="px-5 py-3 text-gray-700 dark:text-gray-300">${formatDate(h.snapshotAt, dateFormat)}</td>
            <td class="px-5 py-3 text-right font-medium text-gray-800 dark:text-white kpi-value">${formatCurrency(bal, currency)}</td>
            <td class="px-5 py-3 text-right hidden md:table-cell ${change === null ? 'text-gray-300' : change >= 0 ? 'text-green-600' : 'text-red-500'}">
              ${change === null ? '—' : (change >= 0 ? '+' : '') + formatCurrency(change, currency)}
            </td>
            <td class="px-5 py-3 text-gray-400 text-xs hidden lg:table-cell">${h.updatedBy?.split('@')[0] || '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderChart(accountId, currency) {
  const canvas = document.getElementById('history-chart');
  if (!canvas) return;

  const rows = store.history
    .filter(h => h.accountId === accountId)
    .sort((a, b) => new Date(a.snapshotAt) - new Date(b.snapshotAt));

  if (rows.length === 0) {
    canvas.parentElement.innerHTML = '<p class="text-center text-sm text-gray-400 py-8">No data to chart.</p>';
    return;
  }

  const labels = rows.map(h => {
    const d = new Date(h.snapshotAt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  });
  const data = rows.map(h => convert(parseFloat(h.balance)||0, h.currency||'USD', currency));

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: currency,
        data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#3b82f6',
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
        x: {
          ticks: { color: '#9ca3af', maxTicksLimit: 8 },
          grid: { display: false },
        },
      },
    },
  });
  setCurrentChart(chart);
}
