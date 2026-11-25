import { useEffect, useId, useRef } from 'react';

/**
 * Native modal <dialog> showing one photo. Open state is driven entirely by
 * the `photo` prop; the dialog's own `close` event (Esc, Close button,
 * backdrop click, or `photo` becoming null) is reported through `onClose`
 * together with the photo that was showing, so the caller can return focus.
 *
 * @param {{
 *   photo: import('./photos.js').Photo | null,
 *   onClose: (closed: import('./photos.js').Photo | null) => void,
 * }} props
 */
export default function Lightbox({ photo, onClose }) {
  const dialogRef = useRef(/** @type {HTMLDialogElement | null} */ (null));
  const shownRef = useRef(/** @type {import('./photos.js').Photo | null} */ (null));
  const titleId = useId();

  // Sync with the DOM: showModal()/close() are imperative-only APIs.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (photo) shownRef.current = photo;
    if (photo && !dialog.open) dialog.showModal();
    else if (!photo && dialog.open) dialog.close();
  }, [photo]);

  function handleClose() {
    const closed = shownRef.current;
    shownRef.current = null;
    onClose(closed);
  }

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
      onClose={handleClose}
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
