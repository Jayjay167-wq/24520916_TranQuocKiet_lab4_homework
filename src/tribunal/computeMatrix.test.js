import { BASELINE_MATCHES, computeMatrix } from './computeMatrix.js';
import { DOSSIERS } from './dossiers.js';

/** Minimal dossier fixture: only `incidents` matters to the matrix. */
const dossierWith = (...incidents) => ({
  incidents: incidents.map(([severity, imposedMatches], i) => ({
    id: `i${i + 1}`,
    label: `Incident ${i + 1}`,
    severity,
    imposedMatches,
  })),
});

describe('computeMatrix', () => {
  it('uses the rulebook baseline for each severity tier', () => {
    expect(BASELINE_MATCHES).toEqual({ 1: 1, 2: 2, 3: 4, 4: 6, 5: 10 });
  });

  it('derives one row per incident with baseline, delta, ratio and verdict', () => {
    const { rows } = computeMatrix(dossierWith([2, 2], [2, 4], [3, 2]));

    expect(rows).toEqual([
      { id: 'i1', label: 'Incident 1', severity: 2, baseline: 2, imposed: 2, delta: 0, ratio: 1, verdict: 'proportionate' },
      { id: 'i2', label: 'Incident 2', severity: 2, baseline: 2, imposed: 4, delta: 2, ratio: 2, verdict: 'excessive' },
      { id: 'i3', label: 'Incident 3', severity: 3, baseline: 4, imposed: 2, delta: -2, ratio: 0.5, verdict: 'lenient' },
    ]);
  });

  it('totals the columns and judges the overall sanction from the totals', () => {
    const { totals } = computeMatrix(dossierWith([2, 2], [2, 4], [3, 2]));

    expect(totals).toEqual({ baseline: 8, imposed: 8, delta: 0, ratio: 1, verdict: 'proportionate' });
  });

  it.each([
    [4, 5, 'proportionate'], // ratio 1.25: on the upper edge, still within tolerance
    [4, 3, 'proportionate'], // ratio 0.75: on the lower edge
    [5, 13, 'excessive'], // 1.3
    [5, 7, 'lenient'], // 0.7
  ])('severity %i with %i matches imposed is %s (±25%% tolerance, inclusive)', (severity, imposed, verdict) => {
    expect(computeMatrix(dossierWith([severity, imposed])).rows[0].verdict).toBe(verdict);
  });

  it('rounds ratios to two decimals', () => {
    expect(computeMatrix(dossierWith([3, 1], [2, 1], [1, 1])).totals.ratio).toBe(0.43); // 3 / 7
  });

  it('handles a dossier with no incidents', () => {
    expect(computeMatrix(dossierWith())).toEqual({
      rows: [],
      totals: { baseline: 0, imposed: 0, delta: 0, ratio: null, verdict: null },
    });
  });

  it.each([0, 6, 2.5, '3'])('rejects severity %j', (severity) => {
    expect(() => computeMatrix(dossierWith([severity, 1]))).toThrow(RangeError);
  });

  it('is pure: same input, equal output, input untouched', () => {
    const dossier = dossierWith([2, 4]);
    const snapshot = structuredClone(dossier);

    expect(computeMatrix(dossier)).toEqual(computeMatrix(dossier));
    expect(dossier).toEqual(snapshot);
  });

  describe('on the real dossiers', () => {
    it('Himass: second match ban doubles the tariff, overall excessive', () => {
      const { rows, totals } = computeMatrix(DOSSIERS.himass);

      expect(rows.map((r) => r.verdict)).toEqual(['proportionate', 'excessive']);
      expect(totals).toEqual({ baseline: 4, imposed: 6, delta: 2, ratio: 1.5, verdict: 'excessive' });
    });

    it('TanVuu: mixed rows that net out as proportionate', () => {
      const { rows, totals } = computeMatrix(DOSSIERS.tanvuu);

      expect(rows.map((r) => r.verdict)).toEqual(['proportionate', 'lenient', 'excessive']);
      expect(totals).toEqual({ baseline: 7, imposed: 6, delta: -1, ratio: 0.86, verdict: 'proportionate' });
    });
  });
});
