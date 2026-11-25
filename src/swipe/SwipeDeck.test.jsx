import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SwipeDeck from './SwipeDeck.jsx';

/** @type {import('./deck.js').Profile[]} */
const PROFILES = [
  { id: 'a', name: 'An', age: 22, bio: 'Thích trà sữa.' },
  { id: 'b', name: 'Bình', age: 24, bio: 'Chạy bộ mỗi sáng.' },
];

const card = () => screen.getByRole('group', { name: /^(An|Bình), \d+$|no more profiles/i });
const status = () => screen.getByRole('status');
const score = () => screen.getByText(/^score:/i);

/** Simulate a single-pointer drag on `el` by (dx, dy) pixels. */
function drag(el, dx, dy) {
  const start = { clientX: 200, clientY: 300, pointerId: 1, pointerType: 'mouse', button: 0 };
  const end = { ...start, clientX: start.clientX + dx, clientY: start.clientY + dy };
  fireEvent.pointerDown(el, start);
  fireEvent.pointerMove(el, end);
  fireEvent.pointerUp(el, end);
}

function setup() {
  const user = userEvent.setup();
  render(<SwipeDeck profiles={PROFILES} />);
  card().focus();
  return user;
}

describe('SwipeDeck card', () => {
  it('shows the top profile as a focusable, named card', () => {
    render(<SwipeDeck profiles={PROFILES} />);

    const top = screen.getByRole('group', { name: 'An, 22' });
    expect(top).toHaveAttribute('tabindex', '0');
    expect(top).toHaveAttribute('aria-roledescription', 'profile card');
    expect(top).toHaveTextContent('Thích trà sữa.');
    expect(score()).toHaveTextContent('Score: 0');
  });

  it('tells keyboard users which keys to press', () => {
    render(<SwipeDeck profiles={PROFILES} />);

    expect(card()).toHaveAttribute('aria-keyshortcuts', 'ArrowLeft ArrowRight ArrowUp Backspace');
    expect(card()).toHaveAccessibleDescription(/arrow.*backspace/i);
  });
});

describe('keyboard input', () => {
  it.each([
    ['{ArrowRight}', 'Liked An', 'Score: 10'],
    ['{ArrowLeft}', 'Passed on An', 'Score: -5'],
    ['{ArrowUp}', 'Super liked An', 'Score: -5'],
  ])('%s swipes the top card', async (key, announcement, expectedScore) => {
    const user = setup();

    await user.keyboard(key);

    expect(screen.getByRole('group', { name: 'Bình, 24' })).toBeInTheDocument();
    expect(score()).toHaveTextContent(expectedScore);
    expect(status()).toHaveTextContent(announcement);
  });

  it('keeps focus on the card so the next key swipes the next profile', async () => {
    const user = setup();

    await user.keyboard('{ArrowRight}');
    expect(card()).toHaveFocus();
    await user.keyboard('{ArrowRight}');

    expect(card()).toHaveAccessibleName(/no more profiles/i);
    expect(card()).toHaveFocus();
    expect(score()).toHaveTextContent('Score: 20');
  });

  it('Backspace undoes the last swipe (LIFO)', async () => {
    const user = setup();

    await user.keyboard('{ArrowRight}{ArrowLeft}{Backspace}');

    expect(screen.getByRole('group', { name: 'Bình, 24' })).toBeInTheDocument();
    expect(score()).toHaveTextContent('Score: 10');
    expect(status()).toHaveTextContent('Undid pass on Bình');
  });

  it('Backspace with nothing to undo announces it and changes nothing', async () => {
    const user = setup();

    await user.keyboard('{Backspace}');

    expect(screen.getByRole('group', { name: 'An, 22' })).toBeInTheDocument();
    expect(status()).toHaveTextContent('Nothing to undo');
  });

  it('ignores other keys', async () => {
    const user = setup();

    await user.keyboard('{ArrowDown}a{Enter}');

    expect(screen.getByRole('group', { name: 'An, 22' })).toBeInTheDocument();
    expect(status()).toBeEmptyDOMElement();
  });

  it('arrow keys do nothing once the deck is empty', async () => {
    const user = setup();

    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}');

    expect(score()).toHaveTextContent('Score: 20');
  });
});

describe('pointer drag', () => {
  it.each([
    ['right', 60, 0, 'Liked An'],
    ['left', -60, 0, 'Passed on An'],
    ['up', 0, -60, 'Super liked An'],
  ])('a drag %s past 50px swipes', (_, dx, dy, announcement) => {
    render(<SwipeDeck profiles={PROFILES} />);

    drag(card(), dx, dy);

    expect(screen.getByRole('group', { name: 'Bình, 24' })).toBeInTheDocument();
    expect(status()).toHaveTextContent(announcement);
  });

  it.each([
    ['40px right', 40, 0],
    ['exactly 50px right', 50, 0],
    ['50px left', -50, 0],
    ['45px up', 0, -45],
    ['80px down', 0, 80],
  ])('a drag of %s snaps back without swiping', (_, dx, dy) => {
    render(<SwipeDeck profiles={PROFILES} />);

    drag(card(), dx, dy);

    expect(screen.getByRole('group', { name: 'An, 22' })).toBeInTheDocument();
    expect(score()).toHaveTextContent('Score: 0');
  });

  it('uses the dominant axis for a diagonal drag', () => {
    render(<SwipeDeck profiles={PROFILES} />);

    drag(card(), 55, -90);

    expect(status()).toHaveTextContent('Super liked An');
  });

  it('a cancelled pointer does not swipe', () => {
    render(<SwipeDeck profiles={PROFILES} />);
    const el = card();

    fireEvent.pointerDown(el, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 120, clientY: 0, pointerId: 1 });
    fireEvent.pointerCancel(el, { pointerId: 1 });
    fireEvent.pointerUp(el, { clientX: 120, clientY: 0, pointerId: 1 });

    expect(score()).toHaveTextContent('Score: 0');
  });
});

describe('button alternative to dragging (WCAG 2.5.7)', () => {
  it('Like, Nope, Super like and Undo buttons drive the same deck', async () => {
    const user = userEvent.setup();
    render(<SwipeDeck profiles={PROFILES} />);
    const undo = screen.getByRole('button', { name: /undo/i });
    expect(undo).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /^like$/i }));
    await user.click(screen.getByRole('button', { name: /nope/i }));
    expect(score()).toHaveTextContent('Score: 5');
    expect(screen.getByRole('button', { name: /super like/i })).toBeDisabled();

    await user.click(undo);
    expect(screen.getByRole('group', { name: 'Bình, 24' })).toBeInTheDocument();
  });
});
