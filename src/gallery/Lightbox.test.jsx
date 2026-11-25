import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentParams, renderApp } from '../test/renderWithRouter.jsx';
import { PHOTOS } from './photos.js';

const photo = (id) => PHOTOS.find((p) => p.id === id);

// Closed dialogs are display:none, so look them up with { hidden: true }.
const lightbox = () => screen.getByRole('dialog', { hidden: true });

function expectOpenWith(p) {
  const dialog = lightbox();
  expect(dialog).toHaveAttribute('open');
  expect(screen.getByRole('dialog', { name: p.title })).toBe(dialog);
  expect(within(dialog).getByRole('img', { name: p.alt })).toHaveAttribute('src', p.src);
}

function expectClosed() {
  expect(lightbox()).not.toHaveAttribute('open');
}

describe('lightbox (?photoId=<id>)', () => {
  it('opens a modal <dialog> for the photo in the URL', () => {
    renderApp('/gallery?photoId=p2');

    expectOpenWith(photo('p2'));
  });

  it('stays closed without a photoId', () => {
    renderApp('/gallery?category=matches');

    expectClosed();
  });

  it('stays closed for an unknown photoId and still shows the filtered grid', () => {
    renderApp('/gallery?category=evidence&photoId=does-not-exist');

    expectClosed();
    const grid = screen.getByRole('list', { name: /photos/i });
    expect(within(grid).getAllByRole('listitem')).toHaveLength(3);
  });

  it('clicking a thumbnail adds photoId to the URL and keeps the category', async () => {
    const user = userEvent.setup();
    renderApp('/gallery?category=matches');
    const p5 = photo('p5');

    const grid = screen.getByRole('list', { name: /photos/i });
    await user.click(within(grid).getByRole('link', { name: p5.alt }));

    expect(currentParams().get('photoId')).toBe('p5');
    expect(currentParams().get('category')).toBe('matches');
    expectOpenWith(p5);
  });

  describe.each([
    ['the Close button', async (user) => user.click(within(lightbox()).getByRole('button', { name: /close/i }))],
    ['the Escape key', async (user) => user.keyboard('{Escape}')],
    ['a backdrop click', async (user) => user.click(lightbox())],
  ])('closing via %s', (_, close) => {
    it('closes the dialog, removes photoId and keeps category', async () => {
      const user = userEvent.setup();
      renderApp('/gallery?category=community&photoId=p8');
      expectOpenWith(photo('p8'));

      await close(user);

      expectClosed();
      expect(currentParams().has('photoId')).toBe(false);
      expect(currentParams().get('category')).toBe('community');
    });
  });

  it('clicking inside the photo does not close the dialog', async () => {
    const user = userEvent.setup();
    renderApp('/gallery?photoId=p1');

    await user.click(within(lightbox()).getByRole('img', { name: photo('p1').alt }));

    expectOpenWith(photo('p1'));
    expect(currentParams().get('photoId')).toBe('p1');
  });
});
