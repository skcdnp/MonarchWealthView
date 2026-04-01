let _onEscape = null;

export function showModal({ title, bodyHTML, confirmLabel = 'Save', danger = false, onConfirm, onCancel }) {
  closeModal();

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal-panel">
        <div class="modal-header">
          <span class="modal-title">${title}</span>
          <button class="btn-icon" id="modal-close">✕</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="modal-cancel">Cancel</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm">${confirmLabel}</button>
        </div>
      </div>
    </div>
  `;

  const dismiss = () => { onCancel?.(); closeModal(); };
  document.getElementById('modal-backdrop').addEventListener('click', e => { if (e.target.id === 'modal-backdrop') dismiss(); });
  document.getElementById('modal-close').addEventListener('click', dismiss);
  document.getElementById('modal-cancel').addEventListener('click', dismiss);

  document.getElementById('modal-confirm').addEventListener('click', async () => {
    const btn = document.getElementById('modal-confirm');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      const result = await onConfirm?.();
      if (result !== false) closeModal();
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = confirmLabel; }
      throw err;
    }
  });

  _onEscape = e => { if (e.key === 'Escape') dismiss(); };
  document.addEventListener('keydown', _onEscape);
}

export function closeModal() {
  const c = document.getElementById('modal-container');
  if (c) c.innerHTML = '';
  if (_onEscape) { document.removeEventListener('keydown', _onEscape); _onEscape = null; }
}
