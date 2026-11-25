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
| **G4** | Lightbox a11y | Dialog has accessible name; Esc closes; focus returns to triggering thumbnail | Keyboard open/close test; `toHaveFocus()` on trigger after close | `gallery` | ☐ |
| **S1** | Swipe gestures | `<SwipeDeck>` keyboard: ArrowLeft=left, ArrowRight=right, ArrowUp=up, Backspace=undo; pointer `dx > 50` / `< -50` | Each key and pointer drag calls `swipe(direction)` | `swipe` | ☐ |
| **S2** | LIFO undo & derived score | `history` array is the only state; `undoLastSwipe` pops last; `score` = Σ(LIKE +10, other −5) computed in render | Swipe ×3 then undo → history length 2, score matches formula | `swipe` | ☐ |
| **S3** | Express + Mongoose 8 server | Fail fast without `MONGODB_URI`; `mongoose.connect(uri)` with no deprecated flags; `GET /api/profiles` (`.lean()`), `POST /api/swipe` → 201 / 400 `{ error }` | Supertest with mocked models: 201 on valid body, 400 on invalid; startup throws when env var is empty | `api` | ☐ |
| **S4** | Wire deck to API | `useProfiles()` hook fetches with `AbortController`; swipe POSTs to `/api/swipe` | Mocked `fetch`: profiles render; unmount aborts; POST sent on swipe | `swipe` | ☐ |
| **T1** | Dossier routing | `/dossier/:playerId` → `<DossierView>` for `himass`, `tanvuu`; unknown id → not-found panel | Both dossiers render by URL; `/dossier/unknown` shows not-found | `tribunal` | ☐ |
| **T2** | Appeal form engine | `FormContext` holds values; errors derived synchronously in render (no `useEffect`); `<InputField>` uses `useId`, `aria-invalid`, `aria-describedby` | Typing invalid value shows error in same render; labels resolve via `getByLabelText` | `tribunal` | ☐ |
| **T3** | Disproportionality matrix | `computeMatrix(dossierData)` pure function; portal uses `useMemo(() => computeMatrix(...), [dossierData])` | Unit tests for `computeMatrix` on fixture data | `tribunal` | ☐ |
| **T4** | Zero-drift SLA timer | `useAppealSlaTimer(deadlineMs)` returns remaining ms from `deadline - Date.now()`; resyncs on `visibilitychange` | Fake timers: no drift after simulated hidden tab; listener removed on unmount | `tribunal` | ☐ |

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
