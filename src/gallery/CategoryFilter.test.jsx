import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentParams, renderApp } from '../test/renderWithRouter.jsx';
import { PHOTOS } from './photos.js';

const altsIn = (slug) => PHOTOS.filter((p) => p.category === slug).map((p) => p.alt);

function gridAlts() {
  const grid = screen.getByRole('list', { name: /photos/i });
  return within(grid)
    .getAllByRole('img')
    .map((img) => img.getAttribute('alt'));
}

const categoryNav = () => screen.getByRole('navigation', { name: /photo categories/i });

describe('category filter (?category=<slug>)', () => {
  it('shows only photos of the category in the URL', () => {
    renderApp('/gallery?category=evidence');

    expect(gridAlts()).toEqual(altsIn('evidence'));
  });

  it('marks only the selected category link as current', () => {
    renderApp('/gallery?category=matches');

    const nav = categoryNav();
    expect(within(nav).getByRole('link', { name: 'Matches' })).toHaveAttribute('aria-current', 'page');
    for (const name of ['All', 'Evidence', 'Community']) {
      expect(within(nav).getByRole('link', { name })).not.toHaveAttribute('aria-current', 'page');
    }
  });

  it('clicking a category link updates the URL and the grid', async () => {
    const user = userEvent.setup();
    renderApp('/gallery');

    await user.click(within(categoryNav()).getByRole('link', { name: 'Community' }));

    expect(currentParams().get('category')).toBe('community');
    expect(gridAlts()).toEqual(altsIn('community'));

    await user.click(within(categoryNav()).getByRole('link', { name: 'All' }));

    expect(currentParams().has('category')).toBe(false);
    expect(gridAlts()).toHaveLength(PHOTOS.length);
  });

  it('shows all photos and marks "All" current for an unknown category', () => {
    renderApp('/gallery?category=not-a-category');

    expect(gridAlts()).toHaveLength(PHOTOS.length);
    expect(within(categoryNav()).getByRole('link', { name: 'All' })).toHaveAttribute('aria-current', 'page');
  });
});
