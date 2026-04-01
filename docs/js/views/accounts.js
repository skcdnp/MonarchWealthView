// views/accounts.js — full account list with add / edit / archive.

import { store } from '../store.js';
import { saveAccount, updateAccount, archiveAccount } from '../sheets.js';
import { showModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { formatCurrency, formatDate, convert } from '../currency.js';

export async function render(container) {
  container.innerHTML = buildPage();
  attachListeners(container);
}

// ── Page HTML ─────────────────────────────────────────────────────────────────

function buildPage() {
  const currency = store.profile?.baseCurrency || CONFIG.BASE_CURRENCY;
  const dateFormat = store.profile?.dateFormat || 'MM/DD/YYYY';
  const accounts = store.accounts.filter(a => a.isArchived !== 'TRUE');

  return `
    <div class="flex items-center justify-between mb-5">
      <div>
        <p class="text-sm text-gray-400">${accounts.length} active account${accounts.length !== 1 ? 's' : ''}</p>
      </div>
      <button id="add-account-btn"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
        + Add Account
      </button>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      ${accounts.length === 0
        ? `<p class="px-6 py-12 text-center text-gray-400 text-sm">No accounts yet. Click <strong>+ Add Account</strong> to get started.</p>`
        : `
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Account</th>
                <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Type</th>
                <th class="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Classification</th>
                <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Balance</th>
                <th class="text-right px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Last Updated</th>
                <th class="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700" id="accounts-tbody">
              ${accounts.map(a => accountRow(a, currency, dateFormat)).join('')}
            </tbody>
          </table>
        `
      }
    </div>

    <!-- Archived accounts toggle -->
    ${store.accounts.some(a => a.isArchived === 'TRUE') ? `
      <div class="mt-6">
        <button id="toggle-archived-btn"
          class="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline">
          Show archived accounts
        </button>
        <div id="archived-section" class="hidden mt-3
          bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="px-5 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
            <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Archived</p>
          </div>
          <table class="w-full text-sm">
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              ${store.accounts.filter(a => a.isArchived === 'TRUE')
                .map(a => accountRow(a, currency, dateFormat, true)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
  `;
}

function accountRow(a, currency, dateFormat, archived = false) {
  const balance = convert(parseFloat(a.balance) || 0, a.currency || 'USD', currency);
  const isAsset = a.classification === 'Asset';
  return `
    <tr class="account-row" data-id="${a.id}">
      <td class="px-5 py-3">
        <p class="font-medium text-gray-800 dark:text-white">${a.name}</p>
        ${a.institution ? `<p class="text-xs text-gray-400">${a.institution}</p>` : ''}
      </td>
      <td class="px-5 py-3 text-gray-500 hidden sm:table-cell">${a.accountType}</td>
      <td class="px-5 py-3 hidden md:table-cell">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
          ${isAsset ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}">
          ${a.classification}
        </span>
      </td>
      <td class="px-5 py-3 text-right font-medium kpi-value
        ${isAsset ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}">
        ${formatCurrency(balance, currency)}
        ${a.currency !== currency ? `<span class="block text-xs text-gray-400 font-normal">${a.currency} ${parseFloat(a.balance).toLocaleString()}</span>` : ''}
      </td>
      <td class="px-5 py-3 text-right text-xs text-gray-400 hidden lg:table-cell">
        ${formatDate(a.updatedAt, dateFormat)}
        ${a.updatedBy ? `<span class="block">${a.updatedBy.split('@')[0]}</span>` : ''}
      </td>
      <td class="px-5 py-3 text-right whitespace-nowrap">
        ${archived ? '' : `
          <button class="edit-btn text-blue-600 dark:text-blue-400 hover:underline text-xs mr-3"
            data-id="${a.id}">Edit</button>
          <button class="archive-btn text-gray-400 hover:text-red-500 text-xs"
            data-id="${a.id}">Archive</button>
        `}
      </td>
    </tr>
  `;
}

// ── Event Listeners ───────────────────────────────────────────────────────────

function attachListeners(container) {
  container.querySelector('#add-account-btn')?.addEventListener('click', () => openForm(null));

  container.querySelector('#accounts-tbody')?.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (!id) return;
    if (e.target.classList.contains('edit-btn')) {
      const account = store.accounts.find(a => a.id === id);
      openForm(account);
    }
    if (e.target.classList.contains('archive-btn')) {
      confirmArchive(id);
    }
  });

  const toggleBtn = container.querySelector('#toggle-archived-btn');
  const archivedSection = container.querySelector('#archived-section');
  toggleBtn?.addEventListener('click', () => {
    const hidden = archivedSection.classList.toggle('hidden');
    toggleBtn.textContent = hidden ? 'Show archived accounts' : 'Hide archived accounts';
  });
}

// ── Account Form Modal ────────────────────────────────────────────────────────

function openForm(account) {
  const isEdit = !!account;
  const a = account || {};

  showModal({
    title: isEdit ? 'Edit Account' : 'Add Account',
    size: 'lg',
    bodyHTML: formHTML(a),
    confirmLabel: isEdit ? 'Save Changes' : 'Add Account',
    onConfirm: () => submitForm(isEdit, a),
  });

  // Show/hide liquidity field based on classification
  const classSelect = document.getElementById('f-classification');
  const liquidityRow = document.getElementById('f-liquidity-row');
  function toggleLiquidity() {
    liquidityRow.classList.toggle('hidden', classSelect.value === 'Liability');
  }
  classSelect?.addEventListener('change', toggleLiquidity);
  toggleLiquidity();
}

function formHTML(a) {
  const typeOptions = CONFIG.ACCOUNT_TYPES.map(t =>
    `<option value="${t}" ${a.accountType === t ? 'selected' : ''}>${t}</option>`
  ).join('');
  const currencyOptions = CONFIG.CURRENCIES.map(c =>
    `<option value="${c}" ${(a.currency || CONFIG.BASE_CURRENCY) === c ? 'selected' : ''}>${c}</option>`
  ).join('');

  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Account Name -->
      <div class="sm:col-span-2">
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Account Name <span class="text-red-500">*</span></label>
        <input id="f-name" type="text" value="${a.name || ''}" placeholder="e.g. Fidelity Brokerage"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <!-- Account Type -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Account Type <span class="text-red-500">*</span></label>
        <select id="f-type"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">— Select type —</option>
          ${typeOptions}
        </select>
      </div>

      <!-- Classification -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Classification <span class="text-red-500">*</span></label>
        <select id="f-classification"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="Asset"     ${(a.classification||'Asset') === 'Asset'     ? 'selected':''}>Asset</option>
          <option value="Liability" ${a.classification === 'Liability' ? 'selected':''}>Liability</option>
        </select>
      </div>

      <!-- Balance -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Balance <span class="text-red-500">*</span></label>
        <input id="f-balance" type="number" step="0.01" min="0" value="${a.balance || ''}" placeholder="0.00"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <!-- Currency -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Currency</label>
        <select id="f-currency"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          ${currencyOptions}
        </select>
      </div>

      <!-- Liquidity (hidden for liabilities) -->
      <div id="f-liquidity-row">
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Liquidity</label>
        <select id="f-liquidity"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="Liquid"      ${(a.liquidity||'Liquid') === 'Liquid'      ? 'selected':''}>Liquid</option>
          <option value="Semi-liquid" ${a.liquidity === 'Semi-liquid' ? 'selected':''}>Semi-liquid</option>
          <option value="Illiquid"    ${a.liquidity === 'Illiquid'    ? 'selected':''}>Illiquid</option>
        </select>
      </div>

      <!-- Institution -->
      <div>
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Institution</label>
        <input id="f-institution" type="text" value="${a.institution || ''}" placeholder="e.g. Chase, Fidelity"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <!-- Notes -->
      <div class="sm:col-span-2">
        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
        <textarea id="f-notes" rows="2" placeholder="Optional notes…"
          class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700
                 text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        >${a.notes || ''}</textarea>
      </div>
    </div>
  `;
}

async function submitForm(isEdit, original) {
  const name    = document.getElementById('f-name')?.value.trim();
  const type    = document.getElementById('f-type')?.value;
  const classif = document.getElementById('f-classification')?.value;
  const balance = document.getElementById('f-balance')?.value;
  const currency= document.getElementById('f-currency')?.value;
  const liquid  = document.getElementById('f-liquidity')?.value;
  const inst    = document.getElementById('f-institution')?.value.trim();
  const notes   = document.getElementById('f-notes')?.value.trim();

  if (!name) { showToast('Account name is required', 'error'); return false; }
  if (!type) { showToast('Account type is required', 'error'); return false; }
  if (balance === '' || isNaN(parseFloat(balance))) { showToast('Balance is required', 'error'); return false; }

  const now = new Date().toISOString();
  const account = {
    id:             isEdit ? original.id : crypto.randomUUID(),
    name,
    accountType:    type,
    classification: classif,
    liquidity:      classif === 'Liability' ? '' : (liquid || 'Liquid'),
    balance:        parseFloat(balance),
    currency:       currency || CONFIG.BASE_CURRENCY,
    institution:    inst,
    notes,
    isArchived:     isEdit ? original.isArchived : 'FALSE',
    createdAt:      isEdit ? original.createdAt : now,
    updatedAt:      now,
    updatedBy:      store.user.email,
  };

  try {
    if (isEdit) {
      await updateAccount(account);
      showToast('Account updated', 'success');
    } else {
      await saveAccount(account);
      showToast('Account added', 'success');
    }
    // Re-render the view
    const { navigate } = await import('../router.js');
    navigate('#accounts');
  } catch (err) {
    showToast(`Save failed: ${err.message}`, 'error');
    return false;
  }
}

async function confirmArchive(id) {
  const account = store.accounts.find(a => a.id === id);
  if (!account) return;
  showModal({
    title: 'Archive Account',
    bodyHTML: `
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Archive <strong>${account.name}</strong>? The account and its history will be preserved but hidden from active views.
      </p>
    `,
    confirmLabel: 'Archive',
    danger: true,
    onConfirm: async () => {
      try {
        await archiveAccount(id);
        showToast(`${account.name} archived`, 'success');
        const { navigate } = await import('../router.js');
        navigate('#accounts');
      } catch (err) {
        showToast(`Archive failed: ${err.message}`, 'error');
        return false;
      }
    },
  });
}
