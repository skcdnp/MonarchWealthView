import { store } from '../store.js';
import { saveProfile } from '../sheets.js';
import { showToast } from '../components/toast.js';

export async function render(container) {
  const p    = store.profile;
  const user = store.user;

  const initials = (store.profile?.displayName || user?.name || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const currencyOpts = CONFIG.CURRENCIES.map(c =>
    `<option value="${c}" ${(p?.baseCurrency || CONFIG.BASE_CURRENCY) === c ? 'selected' : ''}>${c}</option>`
  ).join('');
  const dateOpts = CONFIG.DATE_FORMATS.map(f =>
    `<option value="${f}" ${(p?.dateFormat || 'MM/DD/YYYY') === f ? 'selected' : ''}>${f}</option>`
  ).join('');

  container.innerHTML = `
    <div style="max-width:520px">
      <div class="card">

        <!-- Avatar row -->
        <div style="display:flex;align-items:center;gap:16px;padding-bottom:16px;margin-bottom:16px;border-bottom:0.5px solid var(--border-light)">
          <div style="width:60px;height:60px;border-radius:50%;background:var(--color-primary-bg);color:var(--color-primary);font-size:22px;font-weight:500;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            ${user?.picture
              ? `<img src="${user.picture}" style="width:60px;height:60px;border-radius:50%;object-fit:cover" referrerpolicy="no-referrer">`
              : initials
            }
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-size:16px;font-weight:500;color:var(--text-primary)">${p?.displayName || user?.name || ''}</div>
            <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px">
              Member since ${p?.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'just now'}
            </div>
            <div style="font-size:12px;color:var(--text-tertiary)">${user?.email || ''}</div>
          </div>
        </div>

        <!-- Preferences form -->
        <form id="profile-form">
          <div class="form-grid">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label" for="p-name">Display Name</label>
              <input class="form-input" id="p-name" type="text" value="${p?.displayName || user?.name || ''}" />
            </div>
            <div class="form-group">
              <label class="form-label" for="p-currency">Base Currency</label>
              <select class="form-select" id="p-currency">${currencyOpts}</select>
              <span style="font-size:11px;color:var(--text-tertiary);margin-top:3px">All totals display in this currency</span>
            </div>
            <div class="form-group">
              <label class="form-label" for="p-date">Date Format</label>
              <select class="form-select" id="p-date">${dateOpts}</select>
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:16px">
            <button type="submit" class="btn btn-primary" id="profile-save-btn">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.getElementById('profile-form').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('profile-save-btn');
    btn.disabled = true; btn.textContent = 'Saving…';

    const profile = {
      email:        store.user.email,
      displayName:  document.getElementById('p-name').value.trim() || store.user.name,
      baseCurrency: document.getElementById('p-currency').value,
      dateFormat:   document.getElementById('p-date').value,
      createdAt:    store.profile?.createdAt || new Date().toISOString(),
    };

    try {
      await saveProfile(profile);
      showToast('Preferences saved', 'success');
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Save Changes';
    }
  });
}
