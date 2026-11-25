import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/renderWithRouter.jsx';
import formContextSource from './FormContext.jsx?raw';
import inputFieldSource from './InputField.jsx?raw';
import appealFormSource from './AppealForm.jsx?raw';

const form = () => screen.getByRole('form', { name: /file an appeal/i });
const field = (label) => within(form()).getByLabelText(label);
const submit = (user) => user.click(within(form()).getByRole('button', { name: /submit appeal/i }));
const inspector = () => screen.getByRole('region', { name: /data inspector/i });

/** The parsed JSON shown in the data inspector. */
const inspected = () => JSON.parse(within(inspector()).getByTestId('inspector-json').textContent);

async function fillValid(user) {
  await user.type(field(/full name/i), 'Trần Thị B');
  await user.type(field(/email/i), 'manager@example.test');
  await user.selectOptions(field(/grounds/i), 'proportionality');
  await user.type(field(/statement/i), 'The second ban doubles the rulebook tariff for the same offence.');
}

describe('appeal form fields', () => {
  it('labels every field and starts with none marked invalid', () => {
    renderApp('/dossier/himass');

    for (const label of [/full name/i, /email/i, /grounds/i, /evidence link/i, /statement/i]) {
      const input = field(label);
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input.id).not.toBe('');
    }
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an error in the same render as the invalid keystroke, wired by aria-describedby', async () => {
    const user = userEvent.setup();
    renderApp('/dossier/himass');
    const email = field(/email/i);

    await user.type(email, 'abc');

    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription(/valid email/i);
    const errorId = email.getAttribute('aria-describedby').split(' ').find((id) => id.endsWith('error'));
    expect(document.getElementById(errorId)).toHaveTextContent(/valid email/i);

    await user.type(email, '@example.test');

    expect(email).toHaveAttribute('aria-invalid', 'false');
    expect(email).not.toHaveAccessibleDescription(/valid email/i);
  });

  it('keeps the hint in the description alongside the error', async () => {
    const user = userEvent.setup();
    renderApp('/dossier/himass');
    const statement = field(/statement/i);

    await user.type(statement, 'short');

    expect(statement).toHaveAccessibleDescription(/40 characters.*at least 40/i);
  });
});

describe('submitting', () => {
  it('an empty submit announces an error summary and focuses the first invalid field', async () => {
    const user = userEvent.setup();
    renderApp('/dossier/himass');

    await submit(user);

    const summary = screen.getByRole('alert');
    expect(summary).toHaveTextContent(/4 problems/i);
    const links = within(summary).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      `#${field(/full name/i).id}`,
      `#${field(/email/i).id}`,
      `#${field(/grounds/i).id}`,
      `#${field(/statement/i).id}`,
    ]);
    expect(field(/full name/i)).toHaveFocus();
    expect(field(/full name/i)).toHaveAttribute('aria-invalid', 'true');
    expect(field(/evidence link/i)).toHaveAttribute('aria-invalid', 'false');
  });

  it('a valid submit confirms receipt for the case and shows no errors', async () => {
    const user = userEvent.setup();
    renderApp('/dossier/himass');

    await fillValid(user);
    await submit(user);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(/appeal received for FP-2026-014/i)).toHaveAttribute('role', 'status');
  });
});

describe('cross-field rule', () => {
  it('requires the evidence link only while grounds is new evidence', async () => {
    const user = userEvent.setup();
    renderApp('/dossier/himass');
    await fillValid(user);
    const evidence = field(/evidence link/i);

    await user.selectOptions(field(/grounds/i), 'new-evidence');
    await submit(user);

    expect(evidence).toHaveAttribute('aria-invalid', 'true');
    expect(evidence).toHaveAccessibleDescription(/required.*new evidence/i);
    expect(evidence).toBeRequired();

    await user.selectOptions(field(/grounds/i), 'procedural');

    expect(evidence).toHaveAttribute('aria-invalid', 'false');
    expect(evidence).not.toBeRequired();
  });
});

describe('data inspector', () => {
  it('mirrors the current values, errors and validity as you type', async () => {
    const user = userEvent.setup();
    renderApp('/dossier/himass');

    expect(inspected()).toMatchObject({ isValid: false, submitAttempted: false });

    await user.type(field(/full name/i), 'Vy');

    expect(inspected().values.fullName).toBe('Vy');
    expect(inspected().errors.fullName).toBeUndefined();
    expect(inspected().errors.email).toMatch(/email/i);
  });

  it('reports a valid form once every rule passes', async () => {
    const user = userEvent.setup();
    renderApp('/dossier/himass');

    await fillValid(user);

    expect(inspected()).toMatchObject({ isValid: true, errors: {} });
  });
});

describe('per-dossier state', () => {
  it('starts a fresh form when switching dossier', async () => {
    const user = userEvent.setup();
    renderApp('/dossier/himass');
    await user.type(field(/full name/i), 'Vy');

    await user.click(screen.getByRole('link', { name: 'TanVuu' }));

    expect(form()).toHaveAccessibleName(/FP-2026-022/);
    expect(field(/full name/i)).toHaveValue('');
  });
});

describe('project rule: validation is derived, not effected', () => {
  it.each([
    ['FormContext.jsx', formContextSource],
    ['InputField.jsx', inputFieldSource],
    ['AppealForm.jsx', appealFormSource],
  ])('%s does not use useEffect', (_, source) => {
    expect(source).not.toMatch(/useEffect/);
  });
});
