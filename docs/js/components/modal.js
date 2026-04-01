// modal.js — generic modal dialog.

let activeModal = null;

/**
 * Show a modal dialog.
 * @param {object} options
 * @param {string}   options.title
 * @param {string}   options.bodyHTML     Inner HTML for the modal body
 * @param {string}   options.confirmLabel Label for the confirm button (default 'Save')
 * @param {string}   options.confirmClass Tailwind classes for confirm button
 * @param {boolean}  options.danger       If true, confirm button is red
 * @param {function} options.onConfirm    Called when confirm is clicked; return false to keep open
 * @param {string}   options.size         'sm' | 'md' (default) | 'lg'
 */
export function showModal({
  title,
  bodyHTML,
  confirmLabel = 'Save',
  danger = false,
  onConfirm,
  onCancel,
  size = 'md',
}) {
  closeModal();

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  const confirmBtnClass = danger
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  const container = document.getElementById('modal-container');
  container.innerHTML = `
    <div class="modal-backdrop fixed inset-0 z-40 flex items-center justify-center p-4"
         style="background:rgba(0,0,0,0.5)">
      <div class="modal-panel bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${widths[size] || widths.md}
                  border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 class="text-base font-semibold text-gray-800 dark:text-white">${title}</h3>
          <button id="modal-close-btn"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
            aria-label="Close">✕</button>
        </div>
        <!-- Body -->
        <div class="px-6 py-5 overflow-y-auto flex-1">
          ${bodyHTML}
        </div>
        <!-- Footer -->
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button id="modal-cancel-btn"
            class="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600
                   text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button id="modal-confirm-btn"
            class="px-4 py-2 text-sm rounded-lg font-medium ${confirmBtnClass}">
            ${confirmLabel}
          </button>
        </div>
      </div>
    </div>
  `;

  activeModal = container.querySelector('.modal-backdrop');

  // Close on backdrop click
  activeModal.addEventListener('click', (e) => {
    if (e.target === activeModal) { onCancel?.(); closeModal(); }
  });

  document.getElementById('modal-close-btn').addEventListener('click', () => {
    onCancel?.(); closeModal();
  });

  document.getElementById('modal-cancel-btn').addEventListener('click', () => {
    onCancel?.(); closeModal();
  });

  document.getElementById('modal-confirm-btn').addEventListener('click', async () => {
    const btn = document.getElementById('modal-confirm-btn');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    try {
      const result = await onConfirm?.();
      if (result !== false) closeModal();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = confirmLabel;
      throw err;
    }
  });

  // Trap focus: close on Escape
  document.addEventListener('keydown', _onEscape);
}

export function closeModal() {
  const container = document.getElementById('modal-container');
  if (container) container.innerHTML = '';
  activeModal = null;
  document.removeEventListener('keydown', _onEscape);
}

function _onEscape(e) {
  if (e.key === 'Escape') closeModal();
}
