import { useEffect, useId, useRef } from 'react';

/**
 * Native modal <dialog> showing one photo. Open state is driven entirely by
 * the `photo` prop; the dialog's own `close` event (Esc, Close button,
 * backdrop click) is reported through `onClose`.
 *
 * @param {{
 *   photo: import('./photos.js').Photo | null,
 *   onClose: () => void,
 * }} props
 */
export default function Lightbox({ photo, onClose }) {
  const dialogRef = useRef(/** @type {HTMLDialogElement | null} */ (null));
  const titleId = useId();

  // Sync with the DOM: showModal()/close() are imperative-only APIs.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (photo && !dialog.open) dialog.showModal();
    else if (!photo && dialog.open) dialog.close();
  }, [photo]);

  function handleClick(event) {
    // The body fills the dialog's box, so a click whose target is the
    // <dialog> itself landed on the ::backdrop.
    if (event.target === event.currentTarget) event.currentTarget.close();
  }

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-labelledby={photo ? titleId : undefined}
      onClose={onClose}
      onClick={handleClick}
    >
      {photo && (
        <div className="lightbox-body">
          <button type="button" className="lightbox-close" onClick={() => dialogRef.current?.close()}>
            Close
          </button>
          <h2 id={titleId}>{photo.title}</h2>
          <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} />
        </div>
      )}
    </dialog>
  );
}
