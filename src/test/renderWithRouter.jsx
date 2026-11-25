import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import App from '../App.jsx';

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}

/** Render the full app at `path`, with a probe exposing the current URL. */
export function renderApp(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
      <LocationProbe />
    </MemoryRouter>,
  );
}

/** Current router URL as `pathname + search`. */
export function currentUrl() {
  return screen.getByTestId('location').textContent;
}

/** Current search params of the router URL. */
export function currentParams() {
  return new URL(currentUrl(), 'http://test').searchParams;
}
