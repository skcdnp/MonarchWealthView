import { store, assets } from '../store.js';
import { convert, formatCurrency } from '../currency.js';
import { accountIconHTML, getAccountColor, donutWithLegend } from '../utils/charts.js';

export async function render(container) {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;

  const liquid    = assets().filter(a => a.liquidity === 'Liquid' || a.liquidity === 'Semi-liquid');
  const cashTypes = ['Checking','Savings','Money Market','CD'];
  const cashAccts = liquid.filter(a => cashTypes.includes(a.accountType));
  const otherLiq  = liquid.filter(a => !cashTypes.includes(a.accountType));

  const totalLiquid = liquid.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const totalCash   = cashAccts.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const netWorth    = [...assets()].reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const pctNetWorth = netWorth > 0 ? ((totalLiquid / netWorth)*100).toFixed(1) : '0';

  // Donut segments grouped by account type
  const grouped = liquid.reduce((acc, a) => {
    (acc[a.accountType] = acc[a.accountType] || []).push(a);
    return acc;
  }, {});
  const donutItems = Object.entries(grouped).map(([type, accs]) => {
    const val = accs.reduce((s, a) => s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
    return { label: type, value: val, formattedValue: formatCurrency(val, currency), color: getAccountColor(type) };
  }).sort((a, b) => b.value - a.value);

  container.innerHTML = `
    <!-- Summary cards -->
    <div class="summary-grid">
      ${sc('CASH BALANCE',      formatCurrency(totalCash,   currency), `${cashAccts.length} cash accounts`)}
      ${sc('LIQUID ASSETS',     formatCurrency(totalLiquid, currency), `${liquid.length} accounts total`)}
      ${sc('% OF NET WORTH',    pctNetWorth + '%',                     'liquid portion')}
    </div>

    <div class="two-col">
      <!-- Cash & Savings list -->
      <div class="card">
        <div class="card-header"><span class="card-title">Cash & Savings</span></div>
        ${cashAccts.length === 0
          ? `<p style="font-size:13px;color:var(--text-tertiary)">No cash accounts found.</p>`
          : cashAccts.map(a => acctRow(a, currency)).join('')
        }
        ${otherLiq.length > 0 ? `
          <div style="margin-top:12px;padding-top:12px;border-top:0.5px solid var(--border-light)">
            <div style="font-size:11px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Other Liquid</div>
            ${otherLiq.map(a => acctRow(a, currency)).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Donut breakdown -->
      <div class="card">
        <div class="card-header"><span class="card-title">Liquid Breakdown</span></div>
        ${donutItems.length === 0
          ? `<p style="font-size:13px;color:var(--text-tertiary)">No data.</p>`
          : donutWithLegend(donutItems)
        }
      </div>
    </div>
  `;
}

function sc(label, value, sub) {
  return `
    <div class="summary-card">
      <div class="summary-card-label">${label}</div>
      <div class="summary-card-value" style="color:var(--color-asset)">${value}</div>
      <div class="summary-card-sub">${sub}</div>
    </div>
  `;
}

function acctRow(a, currency) {
  const bal = convert(parseFloat(a.balance)||0, a.currency||'USD', currency);
  return `
    <div class="account-row">
      ${accountIconHTML(a.accountType)}
      <div class="acct-info">
        <div class="acct-name">${a.name}</div>
        <div class="acct-meta">
          <span>${a.accountType}</span>
          ${a.institution ? `<span>· ${a.institution}</span>` : ''}
          ${a.liquidity === 'Semi-liquid' ? `<span class="pill pill-semi-liquid">Semi-liquid</span>` : ''}
        </div>
      </div>
      <div class="acct-balance" style="color:var(--color-asset)">${formatCurrency(bal, currency)}</div>
    </div>
  `;
}
