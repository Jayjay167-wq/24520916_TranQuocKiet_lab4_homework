/**
 * @typedef {'evidence' | 'matches' | 'community'} CategorySlug
 */

/**
 * @typedef {object} Category
 * @property {CategorySlug} slug  URL-safe id, used in `?category=<slug>`.
 * @property {string} label       Human-readable link text.
 */

/**
 * @typedef {object} Photo
 * @property {string} id           Stable id, used in `?photoId=<id>`.
 * @property {CategorySlug} category
 * @property {string} title        Short caption shown under the thumbnail.
 * @property {string} src          Path under /public.
 * @property {string} alt          Describes what the image actually shows.
 * @property {number} width
 * @property {number} height
 */

/** @type {readonly Category[]} */
export const CATEGORIES = Object.freeze([
  { slug: 'evidence', label: 'Evidence' },
  { slug: 'matches', label: 'Matches' },
  { slug: 'community', label: 'Community' },
]);

/**
 * Narrow a raw `?category=` value to a known slug; anything else means "all".
 * @param {string | null} value
 * @returns {CategorySlug | null}
 */
export function toCategorySlug(value) {
  return CATEGORIES.some((c) => c.slug === value) ? /** @type {CategorySlug} */ (value) : null;
}

/** @type {readonly Photo[]} */
export const PHOTOS = Object.freeze([
  {
    id: 'p1',
    category: 'evidence',
    title: 'Flagged scoreboard',
    src: '/photos/evidence-scoreboard.svg',
    alt: 'Scoreboard reading Azure 13, Ember 7, with the Ember_Kite row (41 kills, 3 deaths) circled in red.',
    width: 400,
    height: 300,
  },
  {
    id: 'p2',
    category: 'evidence',
    title: 'Reaction-time spike',
    src: '/photos/evidence-reaction-chart.svg',
    alt: 'Line chart of reaction time per round; one round spikes far past the dashed 150 ms line and is marked with a red dot.',
    width: 400,
    height: 300,
  },
  {
    id: 'p3',
    category: 'evidence',
    title: 'Highlighted chat log',
    src: '/photos/evidence-chat-log.svg',
    alt: 'In-game chat log of four messages; the line "Kite: turn it on now" is highlighted in yellow.',
    width: 400,
    height: 300,
  },
  {
    id: 'p4',
    category: 'matches',
    title: 'Playoff bracket',
    src: '/photos/matches-bracket.svg',
    alt: 'Tournament bracket with lines from both sides converging on a gold trophy in the center.',
    width: 400,
    height: 300,
  },
  {
    id: 'p5',
    category: 'matches',
    title: 'Main stage',
    src: '/photos/matches-stage.svg',
    alt: 'Dark tournament stage with two columns of five glowing monitors facing each other under a blue spotlight.',
    width: 400,
    height: 300,
  },
  {
    id: 'p6',
    category: 'matches',
    title: 'Mid-game gold lead',
    src: '/photos/matches-gold-lead.svg',
    alt: 'Match timer at 24:15 above a gold bar showing Blue at 48.2k ahead of Red at 41.0k.',
    width: 400,
    height: 300,
  },
  {
    id: 'p7',
    category: 'community',
    title: 'Crowd lights',
    src: '/photos/community-crowd-lights.svg',
    alt: 'Silhouetted crowd holding up glowing phone screens in front of a purple-lit stage screen.',
    width: 400,
    height: 300,
  },
  {
    id: 'p8',
    category: 'community',
    title: 'GG WP banner',
    src: '/photos/community-gg-banner.svg',
    alt: 'Fan banner with the words "GG WP" in large bold white letters on a purple background inside a dashed border.',
    width: 400,
    height: 300,
  },
  {
    id: 'p9',
    category: 'community',
    title: 'Team in orange',
    src: '/photos/community-team-avatars.svg',
    alt: 'Five cartoon player figures standing in a row, all wearing matching orange jerseys.',
    width: 400,
    height: 300,
  },
]);
