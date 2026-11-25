/**
 * @typedef {object} Profile
 * @property {string} id    Stable id; sent to the API as `profileId`.
 * @property {string} name
 * @property {number} age
 * @property {string} bio
 */

/** @typedef {'LIKE' | 'NOPE' | 'SUPERLIKE'} SwipeAction */

/**
 * @typedef {object} SwipeEntry
 * @property {string} profileId
 * @property {SwipeAction} action
 */

/**
 * The whole deck state. History is the only stored value: the current
 * profile and the score are both derived from it.
 * @typedef {object} DeckState
 * @property {readonly SwipeEntry[]} history  Oldest first; undo pops the end.
 */

export const ACTIONS = Object.freeze({
  LIKE: 'LIKE',
  NOPE: 'NOPE',
  SUPERLIKE: 'SUPERLIKE',
});

const VALID_ACTIONS = new Set(Object.values(ACTIONS));

export const LIKE_POINTS = 10;
export const OTHER_POINTS = -5;

/** @returns {DeckState} */
export function createDeck() {
  return { history: [] };
}

/**
 * Push a swipe onto the history. A profile can only be swiped once, so a
 * repeat returns the same deck unchanged.
 * @param {DeckState} deck
 * @param {string} profileId
 * @param {SwipeAction} action
 * @returns {DeckState}
 */
export function swipe(deck, profileId, action) {
  if (!VALID_ACTIONS.has(action)) throw new TypeError(`Unknown swipe action: ${action}`);
  if (deck.history.some((entry) => entry.profileId === profileId)) return deck;
  return { history: [...deck.history, { profileId, action }] };
}

/**
 * Remove the most recent swipe (LIFO). Empty history returns the same deck.
 * @param {DeckState} deck
 * @returns {DeckState}
 */
export function undo(deck) {
  if (deck.history.length === 0) return deck;
  return { history: deck.history.slice(0, -1) };
}

/**
 * The first profile that has not been swiped yet, or null when none are left.
 * @param {readonly Profile[]} profiles
 * @param {DeckState} deck
 * @returns {Profile | null}
 */
export function currentProfile(profiles, deck) {
  const swiped = new Set(deck.history.map((entry) => entry.profileId));
  return profiles.find((profile) => !swiped.has(profile.id)) ?? null;
}

/**
 * LIKE scores +10, every other action −5.
 * @param {readonly SwipeEntry[]} history
 * @returns {number}
 */
export function scoreOf(history) {
  return history.reduce(
    (total, entry) => total + (entry.action === ACTIONS.LIKE ? LIKE_POINTS : OTHER_POINTS),
    0,
  );
}
