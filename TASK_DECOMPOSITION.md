# Task Decomposition — Lab 4 Homework (React Router v7 SPA)

Each row runs the loop in `project-rules.md` §6: **contract → failing test → implement → refactor**, with at least one conventional commit per stage.

Tracks:
- **G** — Photo & Evidence Gallery (`useSearchParams` deep links, native `<dialog>` lightbox)
- **S** — SwipeDeck "Hẹn Hò Nhưng Không Yêu" + Express/Mongoose 8 API
- **T** — Esports Fair-Play Appeal Tribunal (Himass & TanVuu dossiers, appeal form, SLA timer)

Status: ☐ todo · ◐ in progress · ☑ done

| ID | Task | Contract | Failing test (Vitest) | Commit scope | Status |
|----|------|----------|-----------------------|--------------|--------|
| **G1** | Gallery layout & routes | `<PhotoGalleryLayout>` at `/gallery` with nested `<Outlet />`; `<NavLink>` per category | Renders gallery heading and category links inside `MemoryRouter` | `gallery` | ☑ |
| **G2** | Category filter deep link | `?category=<slug>` read via `useSearchParams`; list is derived in render | `/gallery?category=evidence` shows only evidence photos; clicking a filter updates the URL | `gallery` | ☑ |
| **G3** | `<dialog>` lightbox from URL | `?photoId=<id>` opens `<dialog>` via `showModal()`; `onClose` clears the param | `/gallery?photoId=p1` opens dialog with p1; closing removes `photoId` | `gallery` | ☑ |
| **G4** | Lightbox a11y | Dialog has accessible name; Esc closes; focus returns to triggering thumbnail | Keyboard open/close test; `toHaveFocus()` on trigger after close | `gallery` | ☑ |
| **S1** | Swipe history, LIFO undo & derived score (logic only) | `src/swipe/deck.js`: `Profile` type; `DeckState = { history }` is the only state; `swipe(deck, id, action)`, `undo(deck)` pops last, `currentProfile(profiles, deck)`, `scoreOf(history)` = Σ(LIKE +10, other −5) | Order kept; undo is LIFO; undo on empty is a no-op; score follows undo | `swipe` | ☑ |
| **S2** | Keyboard & pointer input | `<SwipeDeck profiles onSwipe?>`: focusable card; ArrowLeft=NOPE, ArrowRight=LIKE, ArrowUp=SUPERLIKE, Backspace=undo; pointer drag `dx > 50` / `< -50`, `dy < -50`; `role="status"` announcements | Each key and pointer drag swipes; short drags do nothing; announcements read out | `swipe` | ☑ |
| **S3** | Express + Mongoose 8 server (`/server`) | Fail fast without `MONGODB_URI`; `mongoose.connect(uri)` with no deprecated flags; `GET /api/profiles` (`.lean()`), `POST /api/swipe` → 201 / 400 `{ error }`; `DELETE /api/swipe/:id` → 204 / 400 / 404 (undo) | Supertest with mocked models: 201 on valid body, 400 on invalid; startup throws when env var is empty | `swipe` | ☑ |
| **S4** | Wire deck to API | `useProfiles()` fetches with `AbortController` (loading / error / ready); each swipe POSTs to `/api/swipe` before it enters history; undo DELETEs it before it leaves | Mocked `fetch`: profiles render; error state; POST sent on swipe; failed save shows an error and leaves the deck unchanged | `swipe` | ☑ |
| **T1** | Dossier routing | `/dossier` layout: `<NavLink>` sidebar + `<Outlet />`; `/dossier/:playerID` → `<DossierView>` for `himass`, `tanvuu` with a `<dl>` of case facts; unknown id → `role="alert"` not-found panel | Both dossiers render by URL and from the sidebar; active link has `aria-current`; `/dossier/unknown` shows the alert inside the layout | `tribunal` | ☑ |
| **T2** | Appeal form engine | `AppealFormProvider` context holds values; errors = `validateAppeal(values)` in render (no `useEffect`); `<InputField>` uses `useId`, `aria-invalid`, `aria-describedby`; cross-field rule: evidence URL required when grounds = new evidence; error summary `role="alert"` on submit; data inspector panel | Typing invalid value shows error in same render; labels resolve via `getByLabelText`; cross-field rule; inspector mirrors values | `tribunal` | ☐ |
| **T3** | Zero-drift SLA timer | `useAppealSlaTimer(deadlineMs)` returns remaining ms from `deadline - Date.now()` on every tick; resyncs on `visibilitychange`; clamps at 0 and stops; cleans up | Fake timers: no drift after simulated hidden tab; clamp at 0; listener and interval removed on unmount | `tribunal` | ☐ |
| **T4** | Disproportionality matrix | `computeMatrix(dossier)` pure function; `<DisproportionalityMatrix>` uses `useMemo(() => computeMatrix(dossier), [dossier])` | Unit tests for `computeMatrix` on fixture data; recomputes only when the dossier changes | `tribunal` | ☐ |

## Commit log plan

| Order | Commit |
|-------|--------|
| 0 | `docs: add project rules and task plan` |
| G1–T4 | per row: `test(<scope>): …` → `feat(<scope>): …` → `refactor(<scope>): …` (refactor optional when nothing to clean) |

## Deliverables at repo root

- `project-rules.md`
- `TASK_DECOMPOSITION.md`
- `AI_FAILURE_AUDIT.md` (filled in as AI mistakes are caught)
- `.env.example`
