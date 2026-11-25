import { useMemo } from 'react';
import { TOLERANCE, computeMatrix } from './computeMatrix.js';

const VERDICT_LABEL = { proportionate: 'Proportionate', excessive: 'Excessive', lenient: 'Lenient' };

const formatDelta = (n) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');
const formatRatio = (r) => (r === null ? '—' : `${r.toFixed(2)}×`);

/**
 * Per-dossier comparison of imposed sanctions against the rulebook tariff.
 * The matrix is derived from the dossier and memoised on it, so re-renders
 * from elsewhere (parent state, form typing) reuse the same result.
 * @param {{ dossier: import('./dossiers.js').Dossier }} props
 */
export default function DisproportionalityMatrix({ dossier }) {
  const { rows, totals } = useMemo(() => computeMatrix(dossier), [dossier]);

  return (
    <section className="matrix">
      <table>
        <caption>
          Disproportionality Derived Matrix
          <span className="matrix-note">
            Imposed matches vs. rulebook baseline. Within ±{TOLERANCE * 100}% is proportionate.
          </span>
        </caption>
        <thead>
          <tr>
            <th scope="col">Incident</th>
            <th scope="col">Severity</th>
            <th scope="col">Rulebook baseline</th>
            <th scope="col">Imposed</th>
            <th scope="col">Difference</th>
            <th scope="col">Ratio</th>
            <th scope="col">Verdict</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <th scope="row">{row.label}</th>
              <td>{row.severity}</td>
              <td>{row.baseline}</td>
              <td>{row.imposed}</td>
              <td>{formatDelta(row.delta)}</td>
              <td>{formatRatio(row.ratio)}</td>
              <td data-verdict={row.verdict}>{VERDICT_LABEL[row.verdict]}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td />
            <td>{totals.baseline}</td>
            <td>{totals.imposed}</td>
            <td>{formatDelta(totals.delta)}</td>
            <td>{formatRatio(totals.ratio)}</td>
            <td data-verdict={totals.verdict ?? undefined}>
              {totals.verdict ? VERDICT_LABEL[totals.verdict] : 'No incidents'}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
