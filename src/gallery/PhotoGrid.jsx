import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import Lightbox from './Lightbox.jsx';
import { PHOTOS, toCategorySlug } from './photos.js';

/**
 * Copy of `params` with `key` set (or removed when `value` is null),
 * so other params such as `category` survive.
 * @param {URLSearchParams} params
 * @param {string} key
 * @param {string | null} value
 */
function withParam(params, key, value) {
  const next = new URLSearchParams(params);
  if (value === null) next.delete(key);
  else next.set(key, value);
  return next;
}

/**
 * Index route of /gallery. Everything is derived from the URL during render:
 * `?category=` filters the grid, `?photoId=` opens the lightbox.
 */
export default function PhotoGrid() {
  const [searchParams, setSearchParams] = useSearchParams();
  const thumbRefs = useRef(/** @type {Map<string, HTMLAnchorElement>} */ (new Map()));

  const category = toCategorySlug(searchParams.get('category'));
  const photos = category ? PHOTOS.filter((p) => p.category === category) : PHOTOS;

  const photoId = searchParams.get('photoId');
  const openPhoto = PHOTOS.find((p) => p.id === photoId) ?? null;

  /** @param {import('./photos.js').Photo | null} closed */
  function handleLightboxClose(closed) {
    // Return focus to the thumbnail for the photo that was showing. This also
    // covers deep links, where no thumbnail was ever activated. If the photo is
    // filtered out of the grid, the browser's default focus restore applies.
    if (closed) thumbRefs.current.get(closed.id)?.focus();

    // The dialog also fires `close` when the URL drops photoId first
    // (e.g. browser Back); the URL is already right then.
    if (!searchParams.has('photoId')) return;
    setSearchParams((prev) => withParam(prev, 'photoId', null));
  }

  return (
    <>
      <ul className="photo-grid" aria-label="Photos">
        {photos.map((photo) => (
          <li key={photo.id}>
            <figure>
              <Link
                to={{ search: `?${withParam(searchParams, 'photoId', photo.id)}` }}
                ref={(el) => {
                  thumbRefs.current.set(photo.id, el);
                  return () => thumbRefs.current.delete(photo.id);
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  loading="lazy"
                />
              </Link>
              <figcaption>{photo.title}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
      <Lightbox photo={openPhoto} onClose={handleLightboxClose} />
    </>
  );
}
