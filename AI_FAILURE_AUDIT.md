# AI Failure Audit

Mistakes in AI-generated code that were caught, how they were caught, and the fix.

| # | Task | What the AI got wrong | How it was caught | Fix | Commit |
|---|------|----------------------|-------------------|-----|--------|
| 1 | G2 | Passed `className={isSelected ? 'active' : undefined}` to `<NavLink>`. With a **string** `className`, React Router v7 adds its own `active` class whenever the pathname matches. Every filter link points at `/gallery`, so all four category pills were styled as selected. `aria-current` was correct, so the G2 tests (which only checked `aria-current`) passed. | Lighthouse screenshot during G4. Lighthouse's own a11y audits did not flag it. | Pass `className` as a function. Added a regression test that only the selected link has `active`. | G4 |
| 2 | G3 | Added an `// eslint-disable-next-line jsx-a11y/...` comment, but the project has no ESLint. | Self-review before commit. | Removed before commit. | G3 (never committed) |
