import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from '../App.jsx';
import { CATEGORIES, PHOTOS } from './photos.js';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('photo data', () => {
  it('has 9 photos spread over 3 categories with unique ids and real alt text', () => {
    expect(CATEGORIES).toHaveLength(3);
    expect(PHOTOS).toHaveLength(9);

    const ids = new Set(PHOTOS.map((p) => p.id));
    expect(ids.size).toBe(PHOTOS.length);

    const slugs = CATEGORIES.map((c) => c.slug);
    for (const slug of slugs) {
      expect(PHOTOS.filter((p) => p.category === slug)).toHaveLength(3);
    }

    for (const photo of PHOTOS) {
      expect(slugs).toContain(photo.category);
      expect(photo.src).toMatch(/^\/photos\/.+\.svg$/);
      // Real descriptions, not placeholders like "image" or the file name.
      expect(photo.alt.length).toBeGreaterThan(20);
      expect(photo.alt).not.toMatch(/^(image|photo|picture)\b/i);
    }
  });
});

describe('<PhotoGalleryLayout> at /gallery', () => {
  it('renders the gallery heading and a link per category', () => {
    renderAt('/gallery');

    expect(screen.getByRole('heading', { level: 1, name: /gallery/i })).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: /photo categories/i });
    for (const { label } of CATEGORIES) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('renders every photo in the grid through the nested <Outlet />', () => {
    renderAt('/gallery');

    const grid = screen.getByRole('list', { name: /photos/i });
    const items = within(grid).getAllByRole('listitem');
    expect(items).toHaveLength(PHOTOS.length);

    for (const photo of PHOTOS) {
      const img = within(grid).getByRole('img', { name: photo.alt });
      expect(img).toHaveAttribute('src', photo.src);
    }
  });
});
