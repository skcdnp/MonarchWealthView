import { store, assets } from '../store.js';
import { convert, formatCurrency } from '../currency.js';
import { accountIconHTML, getAccountColor, cssBarChart } from '../utils/charts.js';

export async function render(container) {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;

  const illiquidAccts = assets().filter(a => a.liquidity === 'Illiquid' || a.liquidity === 'Semi-liquid');
  const liquidAccts   = assets().filter(a => a.liquidity === 'Liquid');
  const totalIlliquid = illiquidAccts.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const totalLiquid   = liquidAccts.reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const totalAssets   = assets().reduce((s, a) =>
    s + convert(parseFloat(a.balance)||0, a.currency||'USD', currency), 0);
  const pct = totalAssets > 0 ? ((totalIlliquid / totalAssets)*100).toFixed(1) : '0';

  // Bar chart items — each illiquid account as a bar
  const barItems = illiquidAccts
    .map(a => ({
      label: a.name,
      value: convert(parseFloat(a.balance)||0, a.currency||'USD', currency),
      formattedValue: formatCurrency(convert(parseFloat(a.balance)||0, a.currency||'USD', currency), currency),
      color: getAccountColor(a.accountType),
    }))
    .sort((a, b) => b.value - a.value);

  container.innerHTML = `
    <!-- Summary cards -->
    <div class="summary-grid">
      ${sc('ILLIQUID ASSETS',    formatCurrency(totalIlliquid, currency), `${illiquidAccts.length} accounts`, 'var(--color-illiquid)')}
      ${sc('% OF TOTAL ASSETS',  pct + '%',                               'of all assets',                   'var(--color-illiquid)')}
      ${sc('LIQUID REMAINDER',   formatCurrency(totalLiquid, currency),   `${liquidAccts.length} liquid accounts`, 'var(--color-asset)')}
    </div>

    <!-- Full-width card: bar chart + account list -->
    <div class="card">
      <div class="card-header"><span class="card-title">Illiquid Holdings</span></div>
      ${illiquidAccts.length === 0
        ? `<div class="empty-state" style="padding:24px 0">
             <div class="empty-state-icon">🏛</div>
             <div class="empty-state-title">No illiquid assets</div>
             <div class="empty-state-sub">Accounts marked as Illiquid or Semi-liquid will appear here</div>
           </div>`
        : `
          <!-- Horizontal bar chart -->
          ${barItems.length > 0 ? `<div style="margin-bottom:20px">${cssBarChart(barItems)}</div>` : ''}
          <!-- Account list -->
          <div style="border-top:0.5px solid var(--border-light);padding-top:14px">
            ${illiquidAccts.map(a => {
              const bal = convert(parseFloat(a.balance)||0, a.currency||'USD', currency);
              const pctRow = totalIlliquid > 0 ? ((bal/totalIlliquid)*100).toFixed(1) : '0';
              return `
                <div class="account-row">
                  ${accountIconHTML(a.accountType)}
                  <div class="acct-info">
                    <div class="acct-name">${a.name}</div>
                    <div class="acct-meta">
                      <span>${a.accountType}</span>
                      ${a.institution ? `<span>· ${a.institution}</span>` : ''}
                      <span class="pill ${a.liquidity === 'Semi-liquid' ? 'pill-semi-liquid' : 'pill-illiquid'}">${a.liquidity}</span>
                    </div>
                  </div>
                  <div style="text-align:right">
                    <div class="acct-balance" style="color:var(--color-illiquid)">${formatCurrency(bal, currency)}</div>
                    <div style="font-size:11px;color:var(--text-tertiary)">${pctRow}% of illiquid</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `
      }
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
