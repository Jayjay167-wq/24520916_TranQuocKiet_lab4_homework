/**
 * Fictional case files for Lab 4 coursework. The handles are placeholders;
 * no real tournament, ruling or sanction is described here.
 */

/** @typedef {'himass' | 'tanvuu'} PlayerID */

/**
 * @typedef {object} Incident
 * @property {string} id
 * @property {string} label           What happened, in one line.
 * @property {1 | 2 | 3 | 4 | 5} severity  Rulebook severity tier.
 * @property {number} imposedMatches  Matches banned for this incident.
 */

/**
 * @typedef {object} Dossier
 * @property {PlayerID} id       URL segment in `/dossier/:playerID`.
 * @property {string} handle     Display name.
 * @property {string} team
 * @property {string} role
 * @property {string} region
 * @property {string} caseId
 * @property {string} ruling     Summary of the original decision.
 * @property {string} ruledOn    ISO date (YYYY-MM-DD).
 * @property {string} appealDeadline  ISO date-time with offset; absolute.
 * @property {number} fineUsd
 * @property {readonly Incident[]} incidents
 */

/** @type {Readonly<Record<PlayerID, Dossier>>} */
export const DOSSIERS = Object.freeze({
  himass: {
    id: 'himass',
    handle: 'Himass',
    team: 'Lab Cup Wolves',
    role: 'Mid',
    region: 'VN',
    caseId: 'FP-2026-014',
    ruling: 'Abusive chat towards an opponent in two group-stage matches.',
    ruledOn: '2026-11-20',
    appealDeadline: '2026-12-04T17:00:00+07:00',
    fineUsd: 300,
    incidents: [
      { id: 'h1', label: 'Abusive all-chat, match 1', severity: 2, imposedMatches: 2 },
      { id: 'h2', label: 'Abusive all-chat, match 2', severity: 2, imposedMatches: 4 },
    ],
  },
  tanvuu: {
    id: 'tanvuu',
    handle: 'TanVuu',
    team: 'Night Owls Academy',
    role: 'Jungle',
    region: 'VN',
    caseId: 'FP-2026-022',
    ruling: 'Late check-in, a deliberate disconnect and an unsporting remake request.',
    ruledOn: '2026-11-23',
    appealDeadline: '2026-12-07T17:00:00+07:00',
    fineUsd: 150,
    incidents: [
      { id: 't1', label: 'Late to match check-in', severity: 1, imposedMatches: 1 },
      { id: 't2', label: 'Deliberate disconnect to force a pause', severity: 3, imposedMatches: 2 },
      { id: 't3', label: 'Unsporting remake request', severity: 2, imposedMatches: 3 },
    ],
  },
});

/** Ordered list for the sidebar. */
export const PLAYERS = Object.freeze(Object.values(DOSSIERS));

/**
 * Exact, case-sensitive lookup; anything else is "not found".
 * @param {string | undefined} playerID
 * @returns {Dossier | null}
 */
export function findDossier(playerID) {
  return Object.hasOwn(DOSSIERS, playerID ?? '') ? DOSSIERS[playerID] : null;
}

/** Total matches banned, derived from the incidents. */
export function totalMatchesBanned(dossier) {
  return dossier.incidents.reduce((sum, incident) => sum + incident.imposedMatches, 0);
}
