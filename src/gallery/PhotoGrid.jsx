import { PHOTOS } from './photos.js';
import { useCategoryParam } from './useCategoryParam.js';

/** Index route of /gallery: photos filtered by `?category=`, derived during render. */
export default function PhotoGrid() {
  const category = useCategoryParam();
  const photos = category ? PHOTOS.filter((p) => p.category === category) : PHOTOS;

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
