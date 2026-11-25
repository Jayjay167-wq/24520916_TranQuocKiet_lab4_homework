import '@testing-library/jest-dom/vitest';

// jsdom has <dialog> but not showModal()/close(). This shim mirrors the browser
// behaviour our components rely on: `open` attribute, focus moves inside,
// Escape fires a cancelable `cancel` then closes, and close() fires `close`.
// It only installs when the real methods are missing.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const escHandlers = new WeakMap();

  HTMLDialogElement.prototype.showModal = function showModal() {
    if (this.open) throw new DOMException('Dialog is already open', 'InvalidStateError');
    this.setAttribute('open', '');

    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      const cancel = new Event('cancel', { cancelable: true });
      if (this.dispatchEvent(cancel)) this.close();
    };
    escHandlers.set(this, onKeyDown);
    this.addEventListener('keydown', onKeyDown);

    (this.querySelector('[autofocus]') ?? this.querySelector(FOCUSABLE))?.focus();
  };

  HTMLDialogElement.prototype.close = function close(returnValue) {
    if (!this.open) return;
    this.removeAttribute('open');
    this.removeEventListener('keydown', escHandlers.get(this));
    escHandlers.delete(this);
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.dispatchEvent(new Event('close'));
  };
}
