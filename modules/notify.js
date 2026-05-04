// Lightweight toast notifications. Stacks at the bottom of the viewport,
// auto-dismisses after a few seconds, and respects prefers-reduced-motion
// (no slide animation if the user has motion turned off).
//
// Usage: notify('Synced 12 new entries', 'success').
// Kinds: 'info' | 'success' | 'error'.

const HOST_ID = 'cm-toast-host';
const DISMISS_MS = 3600;

function host() {
  let el = document.getElementById(HOST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = HOST_ID;
    el.className = 'm-toast-host';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
  }
  return el;
}

export function notify(message, kind = 'info', { dismissMs = DISMISS_MS } = {}) {
  const root = host();
  const toast = document.createElement('div');
  toast.className = `m-toast m-toast--${kind}`;
  toast.textContent = message;
  root.appendChild(toast);

  // Trigger fade-in on next frame so the transition fires.
  requestAnimationFrame(() => toast.classList.add('is-shown'));

  const dismiss = () => {
    toast.classList.remove('is-shown');
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 240);
  };
  setTimeout(dismiss, dismissMs);
  toast.addEventListener('click', dismiss);
}
