import { PHOTOS } from './photos.js';

/**
 * @param {{ photos?: readonly import('./photos.js').Photo[] }} props
 */
export default function PhotoGrid({ photos = PHOTOS }) {
  return (
    <ul className="photo-grid" aria-label="Photos">
      {photos.map((photo) => (
        <li key={photo.id}>
          <figure>
            <img
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              loading="lazy"
            />
            <figcaption>{photo.title}</figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
