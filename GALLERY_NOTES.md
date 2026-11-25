# Gallery Notes — Accessibility & Lighthouse (G4)

## Lighthouse results

Lighthouse 13.6.0, Chrome headless, run against the **production build** served by `vite preview`
(`npm run build && npx vite preview --port 4173`). Runs finished 2026-11-25 17:01–17:02 UTC.
Full reports: [`docs/lighthouse/`](docs/lighthouse/).

| Page | Form factor | Performance | Accessibility | Best Practices | SEO |
|------|-------------|:-----------:|:-------------:|:--------------:|:---:|
| `/gallery` | Mobile | 100 | **100** | 100 | 92 |
| `/gallery` | Desktop | 100 | **100** | 100 | 92 |
| `/gallery?category=evidence&photoId=p1` (lightbox open) | Mobile | 100 | **100** | 100 | 91 |
| `/gallery?category=evidence&photoId=p1` (lightbox open) | Desktop | 100 | **100** | 100 | 91 |

Lighthouse 13 also reports an experimental "Agentic Browsing" category, which scored 50 on every run.
It fails because there is no `llms-txt` file and no structured data (`ard-schema`). Neither is part of this task.

### Core Web Vitals (lab)

| Page | Form factor | FCP | LCP | TBT | CLS | Speed Index |
|------|-------------|-----|-----|-----|-----|-------------|
| `/gallery` | Mobile | 0.8 s | 1.6 s | 40 ms | 0 | 0.8 s |
| `/gallery` | Desktop | 0.2 s | 0.4 s | 0 ms | 0 | 0.2 s |
| lightbox open | Mobile | 0.8 s | 1.7 s | 20 ms | 0 | 0.8 s |
| lightbox open | Desktop | 0.2 s | 0.4 s | 0 ms | 0 | 0.3 s |

### Remaining non-passing audits

- **`robots-txt` (SEO 92/91).** There is no `robots.txt`, so `vite preview` falls back to serving `index.html` for it, and Lighthouse cannot parse that.
  Adding `public/robots.txt` would fix it. This is out of scope for the a11y pass.
- **`unused-javascript`.** Lighthouse estimates 44 KiB of unused JavaScript, mostly React Router code this page doesn't use. It is informational only: the performance score is still 100.
- **Mobile `largest-contentful-paint`.** At 1.6–1.7 s the LCP audit's own score falls just below full marks, but the performance category is still 100.

### First run (before fixes in this commit)

The first Lighthouse pass (desktop) scored Accessibility 100, Best Practices 96 and SEO 83/82.
- Best Practices lost points because `/favicon.ico` returned 404. Fixed by adding `public/favicon.svg`.
- SEO lost points because there was no meta description. Fixed in `index.html`.

That run's screenshot also showed a bug Lighthouse doesn't check for: **all four category pills were styled as selected**.
- Cause: `<NavLink>` appends its own `active` class when `className` is a string, and every filter link points at the same `/gallery` path.
- Fix: pass `className` as a function. A regression test now covers this.

## WCAG 2.2 AA checklist

| Criterion | How it is met | Verified by |
|-----------|---------------|-------------|
| 1.1.1 Non-text content | Every photo has alt text describing what is actually drawn. The same alt is used in the grid and the lightbox. | `Gallery.test.jsx` (alt length/placeholder check); Lighthouse `image-alt` |
| 1.3.1 Info & relationships | Grid is a `<ul aria-label="Photos">` of `<figure>`/`<figcaption>`. Category nav is `<nav aria-label="Photo categories">`. Headings go h1 → h2. | RTL role queries; Lighthouse `list`, `listitem`, `heading-order` |
| 1.4.1 Use of colour | The selected category is shown by a filled background, bold text and `aria-current="page"`, not by colour alone. | `LightboxA11y.test.jsx` (only selected link has `active`); `CategoryFilter.test.jsx` (`aria-current`) |
| 1.4.3 Contrast (text) | Text pairs computed: `#1f2937`/white 14.68:1, `#4b5563`/white 7.56:1, `#1d4ed8`/white 6.70:1, white/`#1d4ed8` 6.70:1, `#1f2937`/`#f3f4f6` 13.34:1. | Lighthouse `color-contrast` |
| 1.4.11 Non-text contrast | Focus ring and pill borders `#1d4ed8` on white: 6.70:1 (needs 3:1). | Computed; see `gallery.css` header comment |
| 2.1.1 Keyboard | Thumbnails are real links (Enter opens). In the dialog, Esc or the Close button closes it. Native `<dialog>` keeps focus inside while modal. | `LightboxA11y.test.jsx` (Enter to open, Esc to close) |
| 2.4.3 Focus order | Opening moves focus to the dialog's first control (Close). Closing returns focus to the thumbnail that opened it, or to the matching thumbnail for a deep link. | `LightboxA11y.test.jsx`: focus return via button, Esc, backdrop and deep link |
| 2.4.7 Focus visible | 3px `#1d4ed8` `:focus-visible` outline on all links and buttons. | Visible in the Lighthouse lightbox screenshot (ring on Close) |
| 2.5.8 Target size (minimum) | Category pills and Close button are at least 44×44 CSS px. Thumbnails are about 220 px wide. | Lighthouse `target-size` |
| 4.1.2 Name, role, value | Dialog is named by its `<h2>` via `aria-labelledby`. Close is a text `<button>`. Links are named by their image alt. | `LightboxA11y.test.jsx` (dialog name, button name); Lighthouse `button-name`, `link-name` |

### Not verified

A 100 Accessibility score only covers the automated axe checks: 18 audits on `/gallery` and 12 with the modal open.
When the modal is open, the page behind it is inert, so axe checks less of it.
Lighthouse lists 10 more items as manual checks (`logical-tab-order`, `focus-traps`, `managed-focus`, and others).
These are only partly covered:

- Focus behaviour is tested in jsdom with a `<dialog>` shim (`src/test/setup.js`), not in a real browser.
  The Lighthouse screenshot confirms that a real Chrome opens the dialog and focuses Close.
- No screen-reader pass (NVDA, VoiceOver) has been done.
- No manual check of 200% zoom or 320 px reflow (1.4.10) has been done. The grid uses `auto-fill`/`minmax(220px, 1fr)` and the pills wrap, so it should reflow.

## Re-running

```sh
npm run build
npx vite preview --port 4173 --strictPort   # in another terminal
npx lighthouse@13.6.0 "http://localhost:4173/gallery" --chrome-flags="--headless=new" --view
npx lighthouse@13.6.0 "http://localhost:4173/gallery?category=evidence&photoId=p1" --chrome-flags="--headless=new" --preset=desktop --view
```
