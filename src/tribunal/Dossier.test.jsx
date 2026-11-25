import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { currentUrl, renderApp } from '../test/renderWithRouter.jsx';

const sidebar = () => screen.getByRole('navigation', { name: /dossiers/i });

// <dl> has no ARIA role, so the facts are found through their labelled region.
const factsRegion = () => screen.getByRole('region', { name: /case facts/i });

/** The <dd> paired with the <dt> labelled `term` inside the case-facts <dl>. */
function fact(term) {
  const list = factsRegion().querySelector('dl');
  expect(list).not.toBeNull();
  const dt = within(list).getByText(term, { selector: 'dt' });
  const dd = dt.nextElementSibling;
  expect(dd?.tagName).toBe('DD');
  return dd;
}

describe('tribunal layout', () => {
  it('renders a sidebar with a NavLink per player and the child route in the outlet', () => {
    renderApp('/dossier');

    expect(screen.getByRole('heading', { level: 1, name: /fair-play appeal tribunal/i })).toBeInTheDocument();
    const links = within(sidebar()).getAllByRole('link');
    expect(links.map((a) => a.textContent)).toEqual(['Himass', 'TanVuu']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/dossier/himass', '/dossier/tanvuu']);
    expect(screen.getByText(/choose a dossier/i)).toBeInTheDocument();
  });

  it('marks only the open dossier link as current', () => {
    renderApp('/dossier/tanvuu');

    expect(within(sidebar()).getByRole('link', { name: 'TanVuu' })).toHaveAttribute('aria-current', 'page');
    expect(within(sidebar()).getByRole('link', { name: 'Himass' })).not.toHaveAttribute('aria-current');
  });

  it('navigates between dossiers from the sidebar without leaving the layout', async () => {
    const user = userEvent.setup();
    renderApp('/dossier/himass');

    await user.click(within(sidebar()).getByRole('link', { name: 'TanVuu' }));

    expect(currentUrl()).toBe('/dossier/tanvuu');
    expect(screen.getByRole('heading', { level: 2, name: 'TanVuu' })).toBeInTheDocument();
    expect(sidebar()).toBeInTheDocument();
  });
});

describe('dossier view', () => {
  it('shows the Himass dossier facts in a description list', () => {
    renderApp('/dossier/himass');

    expect(screen.getByRole('heading', { level: 2, name: 'Himass' })).toBeInTheDocument();
    expect(fact('Case')).toHaveTextContent('FP-2026-014');
    expect(fact('Team')).toHaveTextContent('Lab Cup Wolves');
    expect(fact('Role')).toHaveTextContent('Mid');
    expect(fact('Ruling')).toHaveTextContent(/abusive chat/i);
    expect(fact('Matches banned')).toHaveTextContent('6');
    expect(fact('Ruled on')).toContainElement(screen.getByText('20 Nov 2026'));
  });

  it('shows the TanVuu dossier facts', () => {
    renderApp('/dossier/tanvuu');

    expect(fact('Case')).toHaveTextContent('FP-2026-022');
    expect(fact('Team')).toHaveTextContent('Night Owls Academy');
    expect(fact('Matches banned')).toHaveTextContent('6');
  });

  it('puts the ruling date in a machine-readable <time>', () => {
    renderApp('/dossier/himass');

    expect(fact('Ruled on').querySelector('time')).toHaveAttribute('datetime', '2026-11-20');
  });

  it('says the case files are fictional', () => {
    renderApp('/dossier/himass');

    expect(screen.getByText(/fictional/i)).toBeInTheDocument();
  });
});

describe('unknown player', () => {
  it('renders a role="alert" not-found panel inside the layout instead of crashing', () => {
    renderApp('/dossier/faker');

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/no dossier/i);
    expect(alert).toHaveTextContent('faker');
    expect(within(alert).getByRole('link', { name: /himass/i })).toHaveAttribute('href', '/dossier/himass');
    expect(sidebar()).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /case facts/i })).not.toBeInTheDocument();
    expect(document.querySelector('dl')).toBeNull();
  });

  it('does not match on a different case', () => {
    renderApp('/dossier/HIMASS');

    expect(screen.getByRole('alert')).toHaveTextContent('HIMASS');
  });
});
