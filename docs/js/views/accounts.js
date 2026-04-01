import { store } from '../store.js';
import { saveAccount, updateAccount, archiveAccount } from '../sheets.js';
import { showModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { formatCurrency, formatDate, convert } from '../currency.js';
import { accountIconHTML } from '../utils/charts.js';

let activeTab = 'all'; // 'all' | 'assets' | 'liabilities'

export async function render(container) {
  _render(container);

  // If triggered from top bar "+ Add Account" button
  if (window._openAddForm) {
    window._openAddForm = false;
    setTimeout(() => openInlineForm(container), 50);
  }
}

function _render(container) {
  const currency   = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const dateFormat = store.profile?.dateFormat || 'MM/DD/YYYY';
  const active = store.accounts.filter(a => a.isArchived !== 'TRUE');

  let filtered = active;
  if (activeTab === 'assets')      filtered = active.filter(a => a.classification === 'Asset');
  if (activeTab === 'liabilities') filtered = active.filter(a => a.classification === 'Liability');

  container.innerHTML = `
    <div class="card">
      <!-- Card header -->
      <div class="card-header">
        <span class="card-title">All Accounts (${active.length})</span>
        <button class="btn btn-outline" id="inline-add-btn" style="font-size:11px;padding:5px 10px">+ Add account</button>
      </div>

      <!-- Inline form placeholder -->
      <div id="inline-form-container"></div>

      <!-- View tabs -->
      <div style="margin-bottom:14px">
        <div class="view-tabs">
          <button class="view-tab ${activeTab==='all'         ? 'active':''}" data-tab="all">All</button>
          <button class="view-tab ${activeTab==='assets'      ? 'active':''}" data-tab="assets">Assets</button>
          <button class="view-tab ${activeTab==='liabilities' ? 'active':''}" data-tab="liabilities">Liabilities</button>
        </div>
      </div>

      <!-- Account list -->
      <div id="account-list">
        ${filtered.length === 0
          ? `<div class="empty-state" style="padding:32px 0">
               <div class="empty-state-icon">📂</div>
               <div class="empty-state-title">No accounts here</div>
               <div class="empty-state-sub">Add an account using the button above</div>
             </div>`
          : filtered.map(a => accountRowHTML(a, currency, dateFormat)).join('')
        }
      </div>
    </div>

    <!-- Archived -->
    ${store.accounts.some(a => a.isArchived === 'TRUE') ? `
      <div style="margin-top:14px">
        <button id="toggle-archived" style="font-size:12px;color:var(--text-tertiary);background:none;border:none;cursor:pointer;font-family:inherit">
          ▸ Show archived accounts
        </button>
        <div id="archived-section" style="display:none;margin-top:10px">
          <div class="card">
            <div class="card-header"><span class="card-title" style="color:var(--text-tertiary)">Archived</span></div>
            ${store.accounts.filter(a => a.isArchived === 'TRUE')
              .map(a => accountRowHTML(a, currency, dateFormat, true)).join('')}
          </div>
        </div>
      </div>
    ` : ''}
  `;

  // Tab switching
  container.querySelectorAll('.view-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      _render(container);
    });
  });

  // Inline form trigger
  document.getElementById('inline-add-btn').addEventListener('click', () => {
    openInlineForm(container);
  });

  // Row actions (edit / archive)
  document.getElementById('account-list').addEventListener('click', e => {
    const id = e.target.dataset.id;
    if (!id) return;
    if (e.target.dataset.action === 'edit') {
      openEditModal(store.accounts.find(a => a.id === id), container);
    }
    if (e.target.dataset.action === 'archive') {
      confirmArchive(id, container);
    }
  });

  // Archived toggle
  document.getElementById('toggle-archived')?.addEventListener('click', function() {
    const sec = document.getElementById('archived-section');
    const open = sec.style.display === 'none';
    sec.style.display = open ? 'block' : 'none';
    this.textContent = (open ? '▾' : '▸') + ' ' + (open ? 'Hide' : 'Show') + ' archived accounts';
  });
}

// ── Account row HTML ──────────────────────────────────────────────────────────

function accountRowHTML(a, currency, dateFormat, archived = false) {
  const isAsset = a.classification === 'Asset';
  const bal = convert(parseFloat(a.balance)||0, a.currency||'USD', currency);
  const pillClass = isAsset
    ? (a.liquidity === 'Illiquid' ? 'pill-illiquid' : a.liquidity === 'Semi-liquid' ? 'pill-semi-liquid' : 'pill-liquid')
    : 'pill-liability';
  const pillLabel = isAsset ? (a.liquidity || 'Liquid') : 'Liability';

  return `
    <div class="account-row" data-id="${a.id}">
      ${accountIconHTML(a.accountType)}
      <div class="acct-info">
        <div class="acct-name" ${archived ? 'style="color:var(--text-tertiary)"' : ''}>${a.name}</div>
        <div class="acct-meta">
          <span>${a.accountType}</span>
          ${a.institution ? `<span>· ${a.institution}</span>` : ''}
          <span class="pill ${pillClass}">${pillLabel}</span>
        </div>
      </div>
      <div class="acct-balance" style="color:${isAsset ? 'var(--color-asset)' : 'var(--color-liability)'}">
        ${isAsset ? formatCurrency(bal, currency) : `(${formatCurrency(bal, currency)})`}
        ${a.currency && a.currency !== currency
          ? `<div style="font-size:10px;color:var(--text-tertiary);font-weight:400">${a.currency} ${parseFloat(a.balance).toLocaleString()}</div>`
          : ''}
      </div>
      ${archived ? '' : `
        <div class="acct-actions">
          <button class="btn-icon" data-id="${a.id}" data-action="edit" title="Edit account">✎</button>
          <button class="btn-icon danger" data-id="${a.id}" data-action="archive" title="Archive account">✕</button>
        </div>
      `}
    </div>
  `;
}

// ── Inline add form ───────────────────────────────────────────────────────────

function openInlineForm(container) {
  const fc = document.getElementById('inline-form-container');
  if (!fc) return;
  if (fc.innerHTML) { fc.innerHTML = ''; return; } // toggle off

  fc.innerHTML = `
    <div class="add-form-panel" style="margin-bottom:14px">
      <div class="add-form-title">New Account</div>
      <div class="form-grid">
        ${formField('f-name',    'text',   'Account Name *',   '', 'e.g. Chase Checking')}
        ${formField('f-inst',    'text',   'Institution',      '', 'e.g. Chase')}
        ${formSelect('f-type',   'Account Type *', CONFIG.ACCOUNT_TYPES, '')}
        ${formSelect('f-class',  'Classification *', ['Asset','Liability'], 'Asset')}
        ${formField('f-balance', 'number', 'Balance *',        '', '0.00')}
        ${formSelect('f-currency','Currency', CONFIG.CURRENCIES, CONFIG.BASE_CURRENCY)}
        <div id="f-liquidity-wrap">
          ${formSelect('f-liquidity','Liquidity', ['Liquid','Semi-liquid','Illiquid'], 'Liquid')}
        </div>
        ${formTextarea('f-notes','Notes', '')}
      </div>
      <div class="form-actions" style="margin-top:10px">
        <button class="btn btn-outline" id="inline-cancel">Cancel</button>
        <button class="btn btn-primary" id="inline-save">Save Account</button>
      </div>
    </div>
  `;

  // Toggle liquidity for liabilities
  const classSelect = fc.querySelector('#f-class');
  const liqWrap = fc.querySelector('#f-liquidity-wrap');
  classSelect.addEventListener('change', () => {
    liqWrap.style.display = classSelect.value === 'Liability' ? 'none' : '';
  });

  document.getElementById('inline-cancel').addEventListener('click', () => { fc.innerHTML = ''; });
  document.getElementById('inline-save').addEventListener('click', () => submitInlineForm(fc, container));
}

async function submitInlineForm(fc, container) {
  const name    = fc.querySelector('#f-name')?.value.trim();
  const inst    = fc.querySelector('#f-inst')?.value.trim();
  const type    = fc.querySelector('#f-type')?.value;
  const classif = fc.querySelector('#f-class')?.value;
  const balance = fc.querySelector('#f-balance')?.value;
  const curr    = fc.querySelector('#f-currency')?.value;
  const liquid  = fc.querySelector('#f-liquidity')?.value;
  const notes   = fc.querySelector('#f-notes')?.value.trim();

  if (!name)  { showToast('Account name is required', 'error'); return; }
  if (!type)  { showToast('Account type is required', 'error'); return; }
  if (!balance || isNaN(parseFloat(balance))) { showToast('Balance is required', 'error'); return; }

  const btn = document.getElementById('inline-save');
  btn.disabled = true; btn.textContent = 'Saving…';

  const now = new Date().toISOString();
  const account = {
    id: crypto.randomUUID(), name, accountType: type,
    classification: classif, liquidity: classif === 'Liability' ? '' : (liquid || 'Liquid'),
    balance: parseFloat(balance), currency: curr || CONFIG.BASE_CURRENCY,
    institution: inst, notes, isArchived: 'FALSE',
    createdAt: now, updatedAt: now, updatedBy: store.user.email,
  };

  try {
    await saveAccount(account);
    showToast('Account added', 'success');
    _render(container);
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
    btn.disabled = false; btn.textContent = 'Save Account';
  }
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function openEditModal(a, container) {
  if (!a) return;
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;

  showModal({
    title: 'Edit Account',
    bodyHTML: `
      <div class="form-grid">
        ${formField('ef-name',    'text',   'Account Name *',   a.name, '')}
        ${formField('ef-inst',    'text',   'Institution',      a.institution || '', '')}
        ${formSelect('ef-type',   'Account Type *', CONFIG.ACCOUNT_TYPES, a.accountType)}
        ${formSelect('ef-class',  'Classification', ['Asset','Liability'], a.classification)}
        ${formField('ef-balance', 'number', 'Balance *',        a.balance, '0.00')}
        ${formSelect('ef-currency','Currency', CONFIG.CURRENCIES, a.currency || 'USD')}
        <div id="ef-liquidity-wrap" ${a.classification === 'Liability' ? 'style="display:none"' : ''}>
          ${formSelect('ef-liquidity','Liquidity', ['Liquid','Semi-liquid','Illiquid'], a.liquidity || 'Liquid')}
        </div>
        ${formTextarea('ef-notes','Notes', a.notes || '')}
      </div>
    `,
    confirmLabel: 'Save Changes',
    onConfirm: async () => {
      // Toggle liquidity for liabilities
      const classif = document.getElementById('ef-class')?.value;
      const name    = document.getElementById('ef-name')?.value.trim();
      const balance = document.getElementById('ef-balance')?.value;
      if (!name)    { showToast('Name required', 'error'); return false; }
      if (!balance || isNaN(parseFloat(balance))) { showToast('Balance required', 'error'); return false; }

      const now = new Date().toISOString();
      const updated = {
        ...a,
        name,
        institution:    document.getElementById('ef-inst')?.value.trim(),
        accountType:    document.getElementById('ef-type')?.value,
        classification: classif,
        liquidity:      classif === 'Liability' ? '' : (document.getElementById('ef-liquidity')?.value || 'Liquid'),
        balance:        parseFloat(balance),
        currency:       document.getElementById('ef-currency')?.value,
        notes:          document.getElementById('ef-notes')?.value.trim(),
        updatedAt:      now,
        updatedBy:      store.user.email,
      };
      try {
        await updateAccount(updated);
        showToast('Account updated', 'success');
        _render(container);
      } catch (err) {
        showToast(`Update failed: ${err.message}`, 'error');
        return false;
      }
    },
  });

  // Wire classification toggle inside modal
  setTimeout(() => {
    const classEl = document.getElementById('ef-class');
    const liqWrap = document.getElementById('ef-liquidity-wrap');
    classEl?.addEventListener('change', () => {
      if (liqWrap) liqWrap.style.display = classEl.value === 'Liability' ? 'none' : '';
    });
  }, 50);
}

// ── Archive ───────────────────────────────────────────────────────────────────

function confirmArchive(id, container) {
  const a = store.accounts.find(acc => acc.id === id);
  if (!a) return;
  showModal({
    title: 'Archive Account',
    bodyHTML: `<p style="font-size:13px;color:var(--text-secondary)">Archive <strong>${a.name}</strong>? It will be hidden from active views but its history is preserved.</p>`,
    confirmLabel: 'Archive',
    danger: true,
    onConfirm: async () => {
      try {
        await archiveAccount(id);
        showToast(`${a.name} archived`, 'success');
        _render(container);
      } catch (err) {
        showToast(`Failed: ${err.message}`, 'error');
        return false;
      }
    },
  });
}

// ── Form helpers ──────────────────────────────────────────────────────────────

function formField(id, type, label, value = '', placeholder = '') {
  return `
    <div class="form-group">
      <label class="form-label" for="${id}">${label}</label>
      <input class="form-input" id="${id}" type="${type}" value="${value}" placeholder="${placeholder}" />
    </div>
  `;
}

function formSelect(id, label, options, selected) {
  return `
    <div class="form-group">
      <label class="form-label" for="${id}">${label}</label>
      <select class="form-select" id="${id}">
        ${options.map(o => `<option value="${o}" ${o === selected ? 'selected' : ''}>${o}</option>`).join('')}
      </select>
    </div>
  `;
}

function formTextarea(id, label, value = '') {
  return `
    <div class="form-group" style="grid-column:1/-1">
      <label class="form-label" for="${id}">${label}</label>
      <textarea class="form-input" id="${id}" rows="2" style="resize:none">${value}</textarea>
    </div>
  `;
}
