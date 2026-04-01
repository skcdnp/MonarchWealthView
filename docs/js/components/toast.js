// toast.js — lightweight toast notification system.

/**
 * Show a toast message.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 * @param {number} durationMs  Auto-dismiss after this many ms (default 3500)
 */
export function showToast(message, type = 'info', durationMs = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colors = {
    success: 'bg-green-600 text-white',
    error:   'bg-red-600 text-white',
    info:    'bg-gray-800 text-white dark:bg-gray-700',
  };
  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  const toast = document.createElement('div');
  toast.className = [
    'toast-enter pointer-events-auto flex items-center gap-3',
    'px-4 py-3 rounded-lg shadow-lg text-sm max-w-xs',
    colors[type] || colors.info,
  ].join(' ');

  toast.innerHTML = `
    <span class="font-bold text-base leading-none">${icons[type] || 'ℹ'}</span>
    <span class="flex-1">${message}</span>
    <button class="opacity-70 hover:opacity-100 text-base leading-none ml-1" aria-label="Dismiss">✕</button>
  `;

  toast.querySelector('button').addEventListener('click', () => dismiss(toast));
  container.appendChild(toast);

  const timer = setTimeout(() => dismiss(toast), durationMs);
  toast._timer = timer;
}

function dismiss(toast) {
  clearTimeout(toast._timer);
  toast.style.transition = 'opacity 0.2s';
  toast.style.opacity = '0';
  setTimeout(() => toast.remove(), 200);
}
