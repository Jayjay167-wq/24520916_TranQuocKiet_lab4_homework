/**
 * Fictional rulebook tariff: matches banned for one incident at each severity.
 * @type {Readonly<Record<1 | 2 | 3 | 4 | 5, number>>}
 */
export const BASELINE_MATCHES = Object.freeze({ 1: 1, 2: 2, 3: 4, 4: 6, 5: 10 });

/** A sanction within ±25% of the tariff (inclusive) is proportionate. */
export const TOLERANCE = 0.25;

/** @typedef {'proportionate' | 'excessive' | 'lenient'} Verdict */

/**
 * @typedef {object} MatrixRow
 * @property {string} id
 * @property {string} label
 * @property {number} severity
 * @property {number} baseline   Tariff for this severity.
 * @property {number} imposed    Matches actually banned.
 * @property {number} delta      imposed − baseline.
 * @property {number} ratio      imposed / baseline, 2 decimals.
 * @property {Verdict} verdict
 */

/**
 * @typedef {object} MatrixTotals
 * @property {number} baseline
 * @property {number} imposed
 * @property {number} delta
 * @property {number | null} ratio     null when there are no incidents.
 * @property {Verdict | null} verdict
 */

const round2 = (n) => Math.round(n * 100) / 100;

/** @returns {Verdict} */
function verdictFor(ratio) {
  if (ratio > 1 + TOLERANCE) return 'excessive';
  if (ratio < 1 - TOLERANCE) return 'lenient';
  return 'proportionate';
}

/**
 * Compare each incident's sanction with the rulebook tariff. Pure: no I/O, no
 * mutation, same output for the same dossier.
 * @param {Pick<import('./dossiers.js').Dossier, 'incidents'>} dossier
 * @returns {{ rows: MatrixRow[], totals: MatrixTotals }}
 */
export function computeMatrix(dossier) {
  const rows = dossier.incidents.map(({ id, label, severity, imposedMatches }) => {
    if (!Number.isInteger(severity) || !Object.hasOwn(BASELINE_MATCHES, severity)) {
      throw new RangeError(`Incident ${id}: severity must be an integer 1–5, got ${JSON.stringify(severity)}`);
    }
    const baseline = BASELINE_MATCHES[severity];
    const ratio = imposedMatches / baseline;
    return {
      id,
      label,
      severity,
      baseline,
      imposed: imposedMatches,
      delta: imposedMatches - baseline,
      ratio: round2(ratio),
      verdict: verdictFor(ratio),
    };
  });

  const baseline = rows.reduce((sum, row) => sum + row.baseline, 0);
  const imposed = rows.reduce((sum, row) => sum + row.imposed, 0);
  const ratio = baseline === 0 ? null : imposed / baseline;

  return {
    rows,
    totals: {
      baseline,
      imposed,
      delta: imposed - baseline,
      ratio: ratio === null ? null : round2(ratio),
      verdict: ratio === null ? null : verdictFor(ratio),
    },
  };
}
