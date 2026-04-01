import { store, assets } from '../store.js';
import { convert, formatCurrency } from '../currency.js';
import { getAccountColor, donutWithLegend, cssBarChart } from '../utils/charts.js';

export async function render(container) {
  const currency  = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const assetList = assets();

  // Group by account type
  const grouped = assetList.reduce((acc, a) => {
    (acc[a.accountType] = acc[a.accountType] || []).push(a);
    return acc;
  }, {});

  const items = Object.entries(grouped).map(([type, accs]) => {
    const val = accs.reduce((s, a) =>
      s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
    return { label: type, value: val, formattedValue: formatCurrency(val, currency), color: getAccountColor(type) };
  }).sort((a, b) => b.value - a.value);

  const totalAssets = items.reduce((s, i) => s + i.value, 0);
  const largest     = items[0];
  const typeCount   = items.length;

  container.innerHTML = `
    <!-- Summary cards -->
    <div class="summary-grid">
      ${sc('ASSET TYPES',      typeCount + ' types',                                           'in portfolio')}
      ${sc('LARGEST POSITION', largest ? formatCurrency(largest.value, currency) : '—',        largest?.label || '—', 'var(--color-primary)')}
      ${sc('TOTAL ASSETS',     formatCurrency(totalAssets, currency),                          `${assetList.length} accounts`, 'var(--color-asset)')}
    </div>

    <div class="two-col">
      <!-- Donut -->
      <div class="card">
        <div class="card-header"><span class="card-title">Allocation by Type</span></div>
        ${items.length === 0
          ? `<p style="font-size:13px;color:var(--text-tertiary)">No assets yet.</p>`
          : donutWithLegend(items.map(i => ({
              ...i,
              formattedValue: formatCurrency(i.value, currency) + ` <span style="color:var(--text-tertiary);font-weight:400">${totalAssets > 0 ? ((i.value/totalAssets)*100).toFixed(1) : 0}%</span>`,
            })), 120)
        }
      </div>

      <!-- Bar chart by balance -->
      <div class="card">
        <div class="card-header"><span class="card-title">By Balance</span></div>
        ${items.length === 0
          ? `<p style="font-size:13px;color:var(--text-tertiary)">No data.</p>`
          : cssBarChart(items)
        }
      </div>
    </div>
  `;
}

function sc(label, value, sub, color = 'var(--text-primary)') {
  return `
    <div class="summary-card">
      <div class="summary-card-label">${label}</div>
      <div class="summary-card-value" style="color:${color};font-size:${value.length > 10 ? '20px' : '26px'}">${value}</div>
      <div class="summary-card-sub">${sub}</div>
    </div>
  `;
}
