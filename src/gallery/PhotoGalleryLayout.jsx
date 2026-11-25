import { NavLink, Outlet } from 'react-router';
import { CATEGORIES } from './photos.js';
import './gallery.css';

/** Layout for `/gallery`: heading + category nav, child route renders in <Outlet />. */
export default function PhotoGalleryLayout() {
  return (
    <section className="gallery">
      <h1>Photo &amp; Evidence Gallery</h1>
      <nav aria-label="Photo categories">
        <ul className="gallery-categories">
          {CATEGORIES.map(({ slug, label }) => (
            <li key={slug}>
              <NavLink to={{ pathname: '/gallery', search: `?category=${slug}` }}>{label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet />
    </section>
  );
}
