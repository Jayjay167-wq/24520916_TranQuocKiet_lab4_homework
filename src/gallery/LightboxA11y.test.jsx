import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentParams, renderApp } from '../test/renderWithRouter.jsx';
import { PHOTOS } from './photos.js';

const photo = (id) => PHOTOS.find((p) => p.id === id);
const lightbox = () => screen.getByRole('dialog', { hidden: true });
const grid = () => screen.getByRole('list', { name: /photos/i });
const thumbnail = (p) => within(grid()).getByRole('link', { name: p.alt });

const closers = [
  ['the Close button', async (user) => user.click(within(lightbox()).getByRole('button', { name: /close/i }))],
  ['the Escape key', async (user) => user.keyboard('{Escape}')],
  ['a backdrop click', async (user) => user.click(lightbox())],
];

describe('category nav visual state', () => {
  it('styles only the selected category link as active', () => {
    renderApp('/gallery?category=evidence');

    const nav = screen.getByRole('navigation', { name: /photo categories/i });
    const active = within(nav)
      .getAllByRole('link')
      .filter((link) => link.classList.contains('active'))
      .map((link) => link.textContent);
    expect(active).toEqual(['Evidence']);
  });
});

describe('lightbox accessibility', () => {
  it('has an accessible name from the photo title and a named Close button', () => {
    renderApp('/gallery?photoId=p3');

    const dialog = screen.getByRole('dialog', { name: photo('p3').title });
    expect(within(dialog).getByRole('heading', { name: photo('p3').title })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('opens from the keyboard and moves focus into the dialog', async () => {
    const user = userEvent.setup();
    renderApp('/gallery?category=community');
    const p7 = photo('p7');

    thumbnail(p7).focus();
    await user.keyboard('{Enter}');

    expect(currentParams().get('photoId')).toBe('p7');
    expect(lightbox()).toHaveAttribute('open');
    expect(lightbox()).toContainElement(document.activeElement);
  });

  describe.each(closers)('closing via %s', (_, close) => {
    it('returns focus to the thumbnail that opened it', async () => {
      const user = userEvent.setup();
      renderApp('/gallery?category=matches');
      const p5 = photo('p5');

      thumbnail(p5).focus();
      await user.keyboard('{Enter}');
      await close(user);

      expect(lightbox()).not.toHaveAttribute('open');
      expect(thumbnail(p5)).toHaveFocus();
    });
  });

  it('focuses the matching thumbnail when a deep-linked photo is closed', async () => {
    const user = userEvent.setup();
    renderApp('/gallery?photoId=p2');

    await user.keyboard('{Escape}');

    expect(thumbnail(photo('p2'))).toHaveFocus();
  });
});
