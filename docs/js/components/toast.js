export function showToast(message, type = 'info', durationMs = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span style="flex:1">${message}</span>
    <button class="toast-close" aria-label="Dismiss">✕</button>
  `;

  const close = () => {
    clearTimeout(timer);
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.18s';
    setTimeout(() => toast.remove(), 180);
  };
  toast.querySelector('.toast-close').addEventListener('click', close);
  const timer = setTimeout(close, durationMs);
  container.appendChild(toast);
}
