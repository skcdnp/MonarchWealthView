// charts.js — shared chart helpers and design-system constants.

// ── Account type config ───────────────────────────────────────────────────────

export const ACCOUNT_ICONS = {
  'Checking':      { icon: '$',  bg: '#E6F1FB', color: '#185FA5' },
  'Savings':       { icon: '↑',  bg: '#EAF3DE', color: '#3B6D11' },
  'Money Market':  { icon: '↑',  bg: '#EAF3DE', color: '#3B6D11' },
  'CD':            { icon: '⏳', bg: '#EAF3DE', color: '#3B6D11' },
  'Brokerage':     { icon: '📈', bg: '#EEEDFE', color: '#534AB7' },
  'Retirement':    { icon: '🏛', bg: '#FAEEDA', color: '#854F0B' },
  'HSA':           { icon: '♥',  bg: '#E1F5EE', color: '#0F6E56' },
  '529':           { icon: '🎓', bg: '#E6F1FB', color: '#185FA5' },
  'Real Estate':   { icon: '🏠', bg: '#F1EFE8', color: '#5F5E5A' },
  'Crypto':        { icon: '₿',  bg: '#E1F5EE', color: '#0F6E56' },
  'Annuity':       { icon: '📋', bg: '#FAEEDA', color: '#854F0B' },
  'Vehicle':       { icon: '🚗', bg: '#FCEBEB', color: '#A32D2D' },
  'Collectibles':  { icon: '◆',  bg: '#F1EFE8', color: '#5F5E5A' },
  'Business':      { icon: '🏢', bg: '#EEEDFE', color: '#534AB7' },
  'Life Insurance':{ icon: '🛡', bg: '#EAF3DE', color: '#3B6D11' },
  'Mortgage':      { icon: '🏦', bg: '#FCEBEB', color: '#A32D2D' },
  'Credit Card':   { icon: '💳', bg: '#FCEBEB', color: '#A32D2D' },
  'Loan':          { icon: '📄', bg: '#FCEBEB', color: '#A32D2D' },
  'Other':         { icon: '◆',  bg: '#F1EFE8', color: '#5F5E5A' },
};

export const ACCOUNT_COLORS = {
  'Checking':      '#378ADD',
  'Savings':       '#85B7EB',
  'Money Market':  '#85B7EB',
  'CD':            '#5BA3D9',
  'Brokerage':     '#7F77DD',
  'Retirement':    '#EF9F27',
  'HSA':           '#20B2AA',
  '529':           '#6495ED',
  'Real Estate':   '#888780',
  'Crypto':        '#1D9E75',
  'Annuity':       '#DAA520',
  'Vehicle':       '#BA7517',
  'Collectibles':  '#9E9E9E',
  'Business':      '#9370DB',
  'Life Insurance':'#4CAF50',
  'Mortgage':      '#E24B4A',
  'Credit Card':   '#F09595',
  'Loan':          '#BA7517',
  'Other':         '#AAAAAA',
};

export function getAccountIcon(type) {
  return ACCOUNT_ICONS[type] || ACCOUNT_ICONS['Other'];
}
export function getAccountColor(type) {
  return ACCOUNT_COLORS[type] || '#AAAAAA';
}

// ── Account icon HTML ─────────────────────────────────────────────────────────

export function accountIconHTML(type) {
  const { icon, bg, color } = getAccountIcon(type);
  return `<div class="acct-icon" style="background:${bg};color:${color}">${icon}</div>`;
}

// ── SVG Donut Chart ───────────────────────────────────────────────────────────
// segments: [{ label, value, color }]

export function svgDonut(segments, size = 110) {
  const total = segments.reduce((s, seg) => s + (seg.value || 0), 0);
  if (total === 0) return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size*0.436}" fill="none" stroke="#F2F3F4" stroke-width="${size*0.19}"/></svg>`;

  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.436;
  const innerR = outerR * 0.54;
  let paths = '';
  let angle = -Math.PI / 2;

  segments.forEach(seg => {
    if (!seg.value) return;
    const frac = seg.value / total;
    const delta = frac * 2 * Math.PI;
    // Slightly less than full circle to avoid SVG path bug
    const sweepDelta = Math.min(delta, Math.PI * 1.9999);
    const endAngle = angle + sweepDelta;
    const large = sweepDelta > Math.PI ? 1 : 0;

    const x1 = cx + outerR * Math.cos(angle),   y1 = cy + outerR * Math.sin(angle);
    const x2 = cx + outerR * Math.cos(endAngle), y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle),iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(angle),   iy2 = cy + innerR * Math.sin(angle);

    paths += `<path d="M${x1},${y1} A${outerR},${outerR} 0 ${large},1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${large},0 ${ix2},${iy2} Z" fill="${seg.color}"/>`;
    angle += sweepDelta;
  });

  // White hole
  paths += `<circle cx="${cx}" cy="${cy}" r="${innerR - 0.5}" fill="var(--bg-primary)"/>`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg>`;
}

// ── Donut + legend composite HTML ────────────────────────────────────────────
// items: [{ label, value, formattedValue, color }]

export function donutWithLegend(items, size = 110) {
  const total = items.reduce((s, i) => s + (i.value || 0), 0);
  const segments = items.map(i => ({ value: i.value, color: i.color }));

  const legendHTML = items.map(i => {
    const pct = total > 0 ? ((i.value / total) * 100).toFixed(1) : '0';
    return `
      <div class="donut-legend-item">
        <span class="donut-legend-dot" style="background:${i.color}"></span>
        <span class="donut-legend-label">${i.label}</span>
        <span class="donut-legend-value">${i.formattedValue} <span style="color:var(--text-tertiary);font-weight:400">${pct}%</span></span>
      </div>
    `;
  }).join('');

  return `
    <div class="donut-wrap">
      <div style="flex-shrink:0">${svgDonut(segments, size)}</div>
      <div class="donut-legend">${legendHTML}</div>
    </div>
  `;
}

// ── CSS horizontal bar chart ──────────────────────────────────────────────────
// items: [{ label, value, formattedValue, color }]

export function cssBarChart(items) {
  const max = Math.max(...items.map(i => i.value || 0), 1);
  return `
    <div class="bar-chart">
      ${items.map(i => {
        const pct = ((i.value || 0) / max * 100).toFixed(1);
        return `
          <div class="bar-row">
            <div class="bar-row-labels">
              <span class="bar-row-label">${i.label}</span>
              <span class="bar-row-value">${i.formattedValue}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${pct}%;background:${i.color}"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
