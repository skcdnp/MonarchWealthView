import { store } from '../store.js';
import { convert, formatCurrency, formatDate } from '../currency.js';
import { setCurrentChart } from '../router.js';

export async function render(container) {
  const currency   = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const dateFormat = store.profile?.dateFormat || 'MM/DD/YYYY';

  const accountsWithHistory = store.accounts.filter(a =>
    store.history.some(h => h.accountId === a.id)
  );

  const firstId = accountsWithHistory[0]?.id || '';

  container.innerHTML = `
    <!-- Account selector -->
    <div class="card" style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span style="font-size:13px;font-weight:500;color:var(--text-primary)">Account</span>
        <select id="history-select" class="form-select" style="min-width:200px">
          ${accountsWithHistory.length === 0
            ? `<option value="">No history yet</option>`
            : accountsWithHistory.map(a =>
                `<option value="${a.id}">${a.name}</option>`
              ).join('')
          }
        </select>
      </div>
    </div>

    <!-- Line chart -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-header"><span class="card-title">Balance Over Time</span></div>
      <div style="position:relative;height:220px">
        <canvas id="history-chart"></canvas>
      </div>
    </div>

    <!-- Snapshot log -->
    <div class="card">
      <div class="card-header"><span class="card-title">Snapshot Log</span></div>
      <div id="history-table"></div>
    </div>
  `;

  if (firstId) {
    renderTableAndChart(firstId, currency, dateFormat);
  }

  document.getElementById('history-select')?.addEventListener('change', e => {
    renderTableAndChart(e.target.value, currency, dateFormat);
  });
}

function renderTableAndChart(accountId, currency, dateFormat) {
  const rows = store.history
    .filter(h => h.accountId === accountId)
    .sort((a, b) => new Date(a.snapshotAt) - new Date(b.snapshotAt));

  // Table (newest first)
  const tableRows = [...rows].reverse();
  document.getElementById('history-table').innerHTML = tableRows.length === 0
    ? `<p style="font-size:13px;color:var(--text-tertiary);padding:8px 0">No history for this account.</p>`
    : `<table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th style="text-align:right">Balance</th>
            <th style="text-align:right">Change</th>
            <th>Updated By</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows.map((h, i) => {
            const bal  = convert(parseFloat(h.balance)||0, h.currency||'USD', currency);
            const prev = tableRows[i+1]
              ? convert(parseFloat(tableRows[i+1].balance)||0, tableRows[i+1].currency||'USD', currency)
              : null;
            const change = prev !== null ? bal - prev : null;
            return `<tr>
              <td style="color:var(--text-secondary)">${formatDate(h.snapshotAt, dateFormat)}</td>
              <td style="text-align:right;font-weight:500;font-variant-numeric:tabular-nums">${formatCurrency(bal, currency)}</td>
              <td style="text-align:right;color:${change === null ? 'var(--text-tertiary)' : change >= 0 ? 'var(--color-asset)' : 'var(--color-liability)'};font-variant-numeric:tabular-nums">
                ${change === null ? '—' : (change >= 0 ? '+' : '') + formatCurrency(change, currency)}
              </td>
              <td style="color:var(--text-tertiary);font-size:12px">${h.updatedBy?.split('@')[0] || '—'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;

  // Chart
  const canvas = document.getElementById('history-chart');
  if (!canvas || rows.length === 0) return;

  const labels = rows.map(h => {
    const d = new Date(h.snapshotAt);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const data = rows.map(h => convert(parseFloat(h.balance)||0, h.currency||'USD', currency));

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        borderColor: '#185FA5',
        backgroundColor: 'rgba(24,95,165,0.06)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#185FA5',
        borderWidth: 2,
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
            color: '#999',
            font: { size: 11 },
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
          border: { display: false },
        },
        x: {
          ticks: { color: '#999', font: { size: 11 }, maxTicksLimit: 8 },
          grid: { display: false },
          border: { display: false },
        },
      },
    },
  });
  setCurrentChart(chart);
}
