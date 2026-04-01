import { store, assets, liabilities } from '../store.js';
import { convert, formatCurrency } from '../currency.js';
import { navigate } from '../router.js';
import { accountIconHTML, getAccountColor, cssBarChart, donutWithLegend } from '../utils/charts.js';

export async function render(container) {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;

  const assetList = assets();
  const liabList  = liabilities();

  const totalAssets = assetList.reduce((s, a) =>
    s + convert(parseFloat(a.balance) || 0, a.currency || 'USD', currency), 0);
  const totalLiab   = liabList.reduce((s, a) =>
    s + convert(parseFloat(a.balance) || 0, a.currency || 'USD', currency), 0);
  const netWorth    = totalAssets - totalLiab;

  if (assetList.length === 0 && liabList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-title">No accounts yet</div>
        <div class="empty-state-sub">Add your first account to get started</div>
        <button class="btn btn-primary" id="empty-add-btn">+ Add Account</button>
      </div>
    `;
    document.getElementById('empty-add-btn').addEventListener('click', () => navigate('#accounts'));
    return;
  }

  // Asset/liability split percentages
  const total = totalAssets + totalLiab;
  const assetPct = total > 0 ? ((totalAssets / total) * 100).toFixed(1) : '100';
  const liabPct  = total > 0 ? ((totalLiab  / total) * 100).toFixed(1) : '0';
  const assetBarWidth = total > 0 ? (totalAssets / total * 100).toFixed(1) : '100';

  // Liquid / Illiquid
  const liquidAssets   = assetList.filter(a => a.liquidity === 'Liquid' || a.liquidity === 'Semi-liquid');
  const illiquidAssets = assetList.filter(a => a.liquidity === 'Illiquid');
  const totalLiquid    = liquidAssets.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const totalIlliquid  = illiquidAssets.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const debtRatio = totalAssets > 0 ? ((totalLiab / totalAssets) * 100).toFixed(1) : '0';

  // Quick snapshot bar chart — group assets by broad category
  const snapGroups = [
    { label: 'Cash & Savings',  types: ['Checking','Savings','Money Market','CD'] },
    { label: 'Investments',     types: ['Brokerage','Crypto','Annuity'] },
    { label: 'Retirement',      types: ['Retirement','HSA','529'] },
    { label: 'Real Estate',     types: ['Real Estate'] },
  ];
  const snapItems = snapGroups.map(g => {
    const val = assetList
      .filter(a => g.types.includes(a.accountType))
      .reduce((s, a) => s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
    const color = getAccountColor(g.types[0]);
    return { label: g.label, value: val, formattedValue: formatCurrency(val, currency), color };
  }).filter(i => i.value > 0);

  // All accounts preview (first 5)
  const allActive = [...assetList, ...liabList]
    .sort((a, b) => convert(parseFloat(b.balance)||0, b.currency||'USD', currency)
                  - convert(parseFloat(a.balance)||0, a.currency||'USD', currency))
    .slice(0, 5);

  container.innerHTML = `
    <!-- Summary cards -->
    <div class="summary-grid">
      ${summaryCard('TOTAL ASSETS',      formatCurrency(totalAssets, currency), `${assetList.length} accounts`, 'var(--color-asset)')}
      ${summaryCard('TOTAL LIABILITIES', `(${formatCurrency(totalLiab, currency)})`, `${liabList.length} accounts`, 'var(--color-liability)')}
      ${summaryCard('NET WORTH',         formatCurrency(netWorth, currency),    netWorth >= 0 ? 'Positive' : 'Negative', 'var(--color-primary)')}
    </div>

    <!-- Middle row -->
    <div class="two-col">

      <!-- Asset vs Liability card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Asset vs Liability</span>
        </div>
        <div class="split-bar-track">
          <div class="split-bar-assets" style="width:${assetBarWidth}%"></div>
          <div class="split-bar-liabilities"></div>
        </div>
        <div class="split-bar-labels">
          <span style="color:var(--color-asset)">Assets ${assetPct}%</span>
          <span style="color:var(--color-liability)">Liabilities ${liabPct}%</span>
        </div>
        <div class="kpi-grid" style="margin-top:14px">
          <div class="kpi-card">
            <div class="kpi-label">Liquid Assets</div>
            <div class="kpi-value" style="color:var(--color-asset)">${formatCurrency(totalLiquid, currency, true)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Illiquid Assets</div>
            <div class="kpi-value" style="color:var(--color-illiquid)">${formatCurrency(totalIlliquid, currency, true)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Debt Ratio</div>
            <div class="kpi-value" style="color:${parseFloat(debtRatio) > 80 ? 'var(--color-liability)' : parseFloat(debtRatio) > 40 ? 'var(--color-illiquid)' : 'var(--color-asset)'}">${debtRatio}%</div>
          </div>
        </div>
      </div>

      <!-- Quick snapshot card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Quick Snapshot</span>
          <span class="card-action" id="see-alloc-link">See allocation →</span>
        </div>
        ${snapItems.length > 0
          ? cssBarChart(snapItems)
          : `<p style="font-size:13px;color:var(--text-tertiary)">No asset data yet.</p>`
        }
      </div>
    </div>

    <!-- All accounts preview -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">All Accounts (${assetList.length + liabList.length})</span>
        <span class="card-action" id="view-all-link">View all →</span>
      </div>
      ${allActive.map(a => accountRowHTML(a, currency)).join('')}
      ${(assetList.length + liabList.length) > 5
        ? `<div style="padding-top:10px;border-top:0.5px solid var(--border-light);margin-top:2px">
             <a class="card-action" id="view-all-link2">+ ${(assetList.length + liabList.length) - 5} more accounts · View all</a>
           </div>`
        : ''
      }
    </div>
  `;

  document.getElementById('view-all-link')?.addEventListener('click', () => navigate('#accounts'));
  document.getElementById('view-all-link2')?.addEventListener('click', () => navigate('#accounts'));
  document.getElementById('see-alloc-link')?.addEventListener('click', () => navigate('#allocation'));
}

function summaryCard(label, value, sub, color) {
  return `
    <div class="summary-card">
      <div class="summary-card-label">${label}</div>
      <div class="summary-card-value" style="color:${color}">${value}</div>
      <div class="summary-card-sub">${sub}</div>
    </div>
  `;
}

function accountRowHTML(a, currency) {
  const isAsset = a.classification === 'Asset';
  const bal = convert(parseFloat(a.balance)||0, a.currency||'USD', currency);
  const pillClass = isAsset
    ? (a.liquidity === 'Illiquid' ? 'pill-illiquid' : 'pill-liquid')
    : 'pill-liability';
  const pillLabel = isAsset ? (a.liquidity || 'Liquid') : 'Liability';

  return `
    <div class="account-row">
      ${accountIconHTML(a.accountType)}
      <div class="acct-info">
        <div class="acct-name">${a.name}</div>
        <div class="acct-meta">
          <span>${a.accountType}</span>
          ${a.institution ? `<span>· ${a.institution}</span>` : ''}
          <span class="pill ${pillClass}">${pillLabel}</span>
        </div>
      </div>
      <div class="acct-balance" style="color:${isAsset ? 'var(--color-asset)' : 'var(--color-liability)'}">
        ${isAsset ? formatCurrency(bal, currency) : `(${formatCurrency(bal, currency)})`}
      </div>
    </div>
  `;
}
