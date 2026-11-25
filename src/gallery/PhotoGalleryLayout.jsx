import { NavLink, Outlet } from 'react-router';
import { CATEGORIES } from './photos.js';
import { useCategoryParam } from './useCategoryParam.js';
import './gallery.css';

const FILTERS = [{ slug: null, label: 'All' }, ...CATEGORIES];

/** Layout for `/gallery`: heading + category nav, child route renders in <Outlet />. */
export default function PhotoGalleryLayout() {
  const activeCategory = useCategoryParam();

  return (
    <section className="gallery">
      <h1>Photo &amp; Evidence Gallery</h1>
      <nav aria-label="Photo categories">
        <ul className="gallery-categories">
          {FILTERS.map(({ slug, label }) => {
            const isSelected = slug === activeCategory;
            return (
              <li key={label}>
                {/* NavLink only matches pathname, which is /gallery for every filter,
                    so "current" is decided by the search param instead. */}
                <NavLink
                  to={{ pathname: '/gallery', search: slug ? `?category=${slug}` : '' }}
                  aria-current={isSelected ? 'page' : 'false'}
                  className={isSelected ? 'active' : undefined}
                >
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      <Outlet />
    </section>
  );
}
