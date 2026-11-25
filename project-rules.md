# Project Rules — Lab 4 Multi-Route SPA

These rules apply to every task in `TASK_DECOMPOSITION.md`, whether the code is written by hand or with an AI assistant. AI output that breaks a rule is rejected and logged in `AI_FAILURE_AUDIT.md`.

## 1. Stack

- Vite + React 19, tests with Vitest + React Testing Library (jsdom).
- Routing: **React Router v7** only.
- Backend (S track): Express + Mongoose 8, `async/await` only.

## 2. Routing — React Router v7

- Import everything from `'react-router'`:
  ```js
  import { Routes, Route, NavLink, Outlet, useParams, useSearchParams } from 'react-router';
  ```
- Do **not** import from `'react-router-dom'` and do not add it as a dependency.
- No v5 APIs: no `<Switch>`, `component=`/`render=` props, `useHistory`, `withRouter`, or `exact`.
- Nested layouts use `<Outlet />`; navigation links use `<NavLink>`.
- Unknown route params (e.g. `/dossier/:playerId` with no match) render an explicit not-found state, never a crash.

## 3. State & validation

- **No `useEffect` for validation or derived values.** Errors, scores, filters and matrices are computed during render from current state (`const errors = validate(values)`), memoised with `useMemo` only when the cost is measured.
- No `useEffect` chains that `setState` in response to other state.
- `useEffect` is reserved for real side effects: syncing with the DOM (`<dialog>.showModal()`), subscriptions (`visibilitychange`), and fetches — each with cleanup (`AbortController`, `removeEventListener`).
- URL is the source of truth for shareable UI state (filters, open photo) via `useSearchParams`.

## 4. Secrets & configuration

- No secrets in source, tests, commits, or prompt logs. No hardcoded connection strings.
- Server reads `process.env.MONGODB_URI` and fails fast if it is missing:
  ```js
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
  ```
- `.env` is gitignored; `.env.example` lists keys with **empty** values only.
- Mongoose 8: `mongoose.connect(uri)` with no deprecated options (`useNewUrlParser`, `useUnifiedTopology`) and no callbacks.

## 5. Accessibility (WCAG 2.2 AA)

- Every input has a programmatic label (`useId()` + `htmlFor`), `aria-invalid`, and `aria-describedby` pointing at its error text.
- Icon-only buttons have an accessible name.
- Modals use native `<dialog>` with focus returned to the trigger on close.
- All interactions work by keyboard.

## 6. Workflow — Contract → Failing test → Implement → Refactor

Every task follows the same four stages, in order:

1. **Contract** — write the interface first: component props, hook return shape, route paths, or API request/response. Recorded in the task row.
2. **Failing test** — write a Vitest test against the contract and confirm it fails (red).
3. **Implement** — minimal code to make the test pass (green).
4. **Refactor** — clean up while all tests stay green.

No implementation is committed before its failing test exists.

## 7. Commits — Conventional Commits

- Format: `<type>(<optional scope>): <imperative summary>`
- Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `style`, `perf`.
- One task stage per commit, isolated scope. Typical sequence per task:
  ```
  test(gallery): add failing test for photoId deep link
  feat(gallery): open dialog from photoId search param
  refactor(gallery): extract usePhotoParam hook
  ```
- `npm run test:run` must pass before any `feat`, `fix`, or `refactor` commit.
- Never commit `.env`, `node_modules`, or build output.
