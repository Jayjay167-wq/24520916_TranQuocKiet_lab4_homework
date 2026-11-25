import { ACTIONS, createDeck, currentProfile, scoreOf, swipe, undo } from './deck.js';

/** @type {import('./deck.js').Profile[]} */
const PROFILES = [
  { id: 'a', name: 'An', age: 22, bio: 'Thích trà sữa.' },
  { id: 'b', name: 'Bình', age: 24, bio: 'Chạy bộ mỗi sáng.' },
  { id: 'c', name: 'Chi', age: 23, bio: 'Mê mèo.' },
];

const swipeAll = (deck, entries) =>
  entries.reduce((d, [profileId, action]) => swipe(d, profileId, action), deck);

describe('swipe history', () => {
  it('starts empty, with the first profile on top', () => {
    const deck = createDeck();

    expect(deck.history).toEqual([]);
    expect(currentProfile(PROFILES, deck)).toBe(PROFILES[0]);
  });

  it('records swipes in the order they happen', () => {
    const deck = swipeAll(createDeck(), [
      ['a', ACTIONS.LIKE],
      ['b', ACTIONS.NOPE],
      ['c', ACTIONS.SUPERLIKE],
    ]);

    expect(deck.history).toEqual([
      { profileId: 'a', action: 'LIKE' },
      { profileId: 'b', action: 'NOPE' },
      { profileId: 'c', action: 'SUPERLIKE' },
    ]);
  });

  it('moves to the next profile after each swipe and ends with null', () => {
    let deck = swipe(createDeck(), 'a', ACTIONS.LIKE);
    expect(currentProfile(PROFILES, deck)).toBe(PROFILES[1]);

    deck = swipeAll(deck, [['b', ACTIONS.NOPE], ['c', ACTIONS.NOPE]]);
    expect(currentProfile(PROFILES, deck)).toBeNull();
  });

  it('does not mutate the previous deck', () => {
    const before = createDeck();
    const after = swipe(before, 'a', ACTIONS.LIKE);

    expect(before.history).toEqual([]);
    expect(after).not.toBe(before);
  });

  it('ignores a second swipe on the same profile', () => {
    const once = swipe(createDeck(), 'a', ACTIONS.LIKE);

    expect(swipe(once, 'a', ACTIONS.NOPE)).toBe(once);
  });

  it('rejects an unknown action', () => {
    expect(() => swipe(createDeck(), 'a', 'MAYBE')).toThrow(/action/i);
  });
});

describe('LIFO undo', () => {
  it('removes only the most recent swipe', () => {
    const deck = swipeAll(createDeck(), [
      ['a', ACTIONS.LIKE],
      ['b', ACTIONS.NOPE],
      ['c', ACTIONS.SUPERLIKE],
    ]);

    const undone = undo(deck);

    expect(undone.history).toEqual([
      { profileId: 'a', action: 'LIKE' },
      { profileId: 'b', action: 'NOPE' },
    ]);
    expect(currentProfile(PROFILES, undone)).toBe(PROFILES[2]);
  });

  it('undoes in reverse order until the deck is back at the start', () => {
    let deck = swipeAll(createDeck(), [['a', ACTIONS.LIKE], ['b', ACTIONS.NOPE]]);

    deck = undo(deck);
    expect(currentProfile(PROFILES, deck)).toBe(PROFILES[1]);
    deck = undo(deck);
    expect(currentProfile(PROFILES, deck)).toBe(PROFILES[0]);
    expect(deck.history).toEqual([]);
  });

  it('is a no-op on an empty history and returns the same deck', () => {
    const deck = createDeck();

    expect(undo(deck)).toBe(deck);
    expect(undo(undo(deck)).history).toEqual([]);
  });
});

describe('score derived from history', () => {
  it('is 0 for no swipes', () => {
    expect(scoreOf([])).toBe(0);
  });

  it('adds 10 per LIKE and subtracts 5 for every other action', () => {
    const deck = swipeAll(createDeck(), [
      ['a', ACTIONS.LIKE],
      ['b', ACTIONS.NOPE],
      ['c', ACTIONS.SUPERLIKE],
    ]);

    expect(scoreOf(deck.history)).toBe(10 - 5 - 5);
  });

  it('follows undo, because it is recomputed from history', () => {
    const deck = swipeAll(createDeck(), [
      ['a', ACTIONS.LIKE],
      ['b', ACTIONS.LIKE],
      ['c', ACTIONS.NOPE],
    ]);
    expect(scoreOf(deck.history)).toBe(15);

    expect(scoreOf(undo(deck).history)).toBe(20);
    expect(scoreOf(undo(undo(deck)).history)).toBe(10);
  });

  it('is not stored on the deck', () => {
    expect(Object.keys(swipe(createDeck(), 'a', ACTIONS.LIKE))).toEqual(['history']);
  });
});
