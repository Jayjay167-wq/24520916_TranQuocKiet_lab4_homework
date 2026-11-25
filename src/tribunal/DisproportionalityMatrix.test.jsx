import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/renderWithRouter.jsx';
import { computeMatrix } from './computeMatrix.js';
import DisproportionalityMatrix from './DisproportionalityMatrix.jsx';
import { DOSSIERS } from './dossiers.js';

// Wrap the real function in a spy so memoisation can be counted.
vi.mock('./computeMatrix.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, computeMatrix: vi.fn(actual.computeMatrix) };
});

beforeEach(() => {
  computeMatrix.mockClear();
});

const table = () => screen.getByRole('table', { name: /disproportionality derived matrix/i });
const bodyRows = () => within(table()).getAllByRole('row').slice(1, -1); // drop header and totals
const cellTexts = (row) => within(row).getAllByRole('cell').map((c) => c.textContent);

describe('DisproportionalityMatrix', () => {
  it('renders a captioned table with column headers', () => {
    render(<DisproportionalityMatrix dossier={DOSSIERS.himass} />);

    const headers = within(table()).getAllByRole('columnheader').map((th) => th.textContent);
    expect(headers).toEqual(['Incident', 'Severity', 'Rulebook baseline', 'Imposed', 'Difference', 'Ratio', 'Verdict']);
  });

  it('shows one row per incident, with a row header and the verdict in words', () => {
    render(<DisproportionalityMatrix dossier={DOSSIERS.himass} />);

    const [first, second] = bodyRows();
    expect(within(second).getByRole('rowheader')).toHaveTextContent('Abusive all-chat, match 2');
    expect(cellTexts(first)).toEqual(['2', '2', '2', '0', '1.00×', 'Proportionate']);
    expect(cellTexts(second)).toEqual(['2', '2', '4', '+2', '2.00×', 'Excessive']);
  });

  it('shows the totals row with the overall verdict', () => {
    render(<DisproportionalityMatrix dossier={DOSSIERS.tanvuu} />);

    const totals = within(table()).getAllByRole('row').at(-1);
    expect(within(totals).getByRole('rowheader')).toHaveTextContent(/total/i);
    expect(cellTexts(totals)).toEqual(['', '7', '6', '−1', '0.86×', 'Proportionate']);
  });

  it('computes once per dossier object, not on every render', () => {
    const { rerender } = render(<DisproportionalityMatrix dossier={DOSSIERS.himass} />);
    rerender(<DisproportionalityMatrix dossier={DOSSIERS.himass} />);
    rerender(<DisproportionalityMatrix dossier={DOSSIERS.himass} />);

    expect(computeMatrix).toHaveBeenCalledTimes(1);

    rerender(<DisproportionalityMatrix dossier={DOSSIERS.tanvuu} />);

    expect(computeMatrix).toHaveBeenCalledTimes(2);
    expect(computeMatrix).toHaveBeenLastCalledWith(DOSSIERS.tanvuu);
  });
});

describe('matrix on the dossier page', () => {
  it('appears for each dossier and does not recompute while typing in the appeal form', async () => {
    const user = userEvent.setup();
    renderApp('/dossier/himass');
    expect(table()).toBeInTheDocument();
    const callsAfterMount = computeMatrix.mock.calls.length;

    await user.type(screen.getByLabelText(/full name/i), 'Vy');

    expect(computeMatrix.mock.calls.length).toBe(callsAfterMount);
  });
});
