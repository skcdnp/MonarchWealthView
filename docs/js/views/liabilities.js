import { store, assets, liabilities } from '../store.js';
import { convert, formatCurrency } from '../currency.js';
import { accountIconHTML, getAccountColor, donutWithLegend } from '../utils/charts.js';

export async function render(container) {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const liabs     = liabilities();
  const assetList = assets();

  const totalLiab   = liabs.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const totalAssets = assetList.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);

  const debtRatio = totalAssets > 0 ? ((totalLiab / totalAssets)*100).toFixed(1) : '0';
  const largest   = liabs.reduce((max, a) => {
    const v = convert(parseFloat(a.balance)||0, a.currency||'USD', currency);
    return v > (max?.val || 0) ? { name: a.name, val: v } : max;
  }, null);

  // Donut segments by type
  const grouped = liabs.reduce((acc, a) => {
    (acc[a.accountType] = acc[a.accountType] || []).push(a);
    return acc;
  }, {});
  const donutItems = Object.entries(grouped).map(([type, accs]) => {
    const val = accs.reduce((s, a) => s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
    return { label: type, value: val, formattedValue: formatCurrency(val, currency), color: getAccountColor(type) };
  }).sort((a, b) => b.value - a.value);

  const dtaColor = parseFloat(debtRatio) > 80
    ? 'var(--color-liability)'
    : parseFloat(debtRatio) > 40 ? 'var(--color-illiquid)' : 'var(--color-asset)';

  container.innerHTML = `
    <!-- Summary cards -->
    <div class="summary-grid">
      ${sc('TOTAL LIABILITIES', `(${formatCurrency(totalLiab, currency)})`, `${liabs.length} accounts`, 'var(--color-liability)')}
      ${sc('DEBT-TO-ASSET',     debtRatio + '%', parseFloat(debtRatio) > 80 ? 'High' : parseFloat(debtRatio) > 40 ? 'Moderate' : 'Healthy', dtaColor)}
      ${sc('LARGEST DEBT',      largest ? formatCurrency(largest.val, currency) : '—', largest?.name || 'None', 'var(--color-liability)')}
    </div>

    <div class="two-col">
      <!-- Liability list -->
      <div class="card">
        <div class="card-header"><span class="card-title">Liabilities</span></div>
        ${liabs.length === 0
          ? `<div class="empty-state" style="padding:24px 0">
               <div class="empty-state-icon">✓</div>
               <div class="empty-state-title">No liabilities</div>
               <div class="empty-state-sub">Debt-free!</div>
             </div>`
          : liabs.map(a => {
              const bal = convert(parseFloat(a.balance)||0, a.currency||'USD', currency);
              const pct = totalLiab > 0 ? ((bal/totalLiab)*100).toFixed(1) : '0';
              return `
                <div class="account-row">
                  ${accountIconHTML(a.accountType)}
                  <div class="acct-info">
                    <div class="acct-name">${a.name}</div>
                    <div class="acct-meta">
                      <span>${a.accountType}</span>
                      ${a.institution ? `<span>· ${a.institution}</span>` : ''}
                      <span class="pill pill-liability">Liability</span>
                    </div>
                  </div>
                  <div style="text-align:right">
                    <div class="acct-balance" style="color:var(--color-liability)">(${formatCurrency(bal, currency)})</div>
                    <div style="font-size:11px;color:var(--text-tertiary)">${pct}% of debt</div>
                  </div>
                </div>
              `;
            }).join('')
        }
      </div>

      <!-- Donut breakdown -->
      <div class="card">
        <div class="card-header"><span class="card-title">Breakdown</span></div>
        ${donutItems.length === 0
          ? `<p style="font-size:13px;color:var(--text-tertiary)">No liabilities to display.</p>`
          : donutWithLegend(donutItems)
        }
      </div>
    </div>
  `;
}

function sc(label, value, sub, color = 'var(--text-primary)') {
  return `
    <div class="summary-card">
      <div class="summary-card-label">${label}</div>
      <div class="summary-card-value" style="color:${color}">${value}</div>
      <div class="summary-card-sub">${sub}</div>
    </div>
  `;
}
