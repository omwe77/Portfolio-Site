# Portfolio V2 — Release Blocker Remediation Report

## Final assessment

**PASS — Portfolio V2 replaced the production code on `main` and is serving at the confirmed production origin.** The normal merge, push, Vercel deployment check, production URL, and 318-check live browser regression all passed. No repository, history, Vercel project, or local backup was deleted.

Remaining follow-up: verify the LinkedIn profile by manual click-through (automated requests are blocked by LinkedIn). Vercel Root Directory was manually confirmed as `./` before merge.

- Project: `C:\Users\LENOVO\OneDrive - London Metropolitan University\Documents\my_projects\Portfolio-Site-v2`
- Branch: `rebuild/immersive-reference`
- Base commit at start: `2c1bd42`
- Canonical origin / `PUBLIC_ORIGIN`: `https://portfolio-gamma-coral-47.vercel.app`

## Original defects discovered and remediated

| Finding | Resolution | Evidence |
| --- | --- | --- |
| `public/case-study.html` exposed the unrendered page template. | Moved it to `templates/case-study.html`; build and preview server use the private template. | `dist/case-study.html` is absent; `/case-study.html` returned 404 at all four viewport checks; all six project pages render. |
| Vercel build/output settings were implicit and deployment builds could vary. | Added `vercel.json` with `npm ci --ignore-scripts`, `npm run build`, Node 22.x, `dist`, trailing-slash handling, and the confirmed `PUBLIC_ORIGIN`. Added lockfile. | Production and preview builds completed; each `tests/deployment_output.py` run passed 40/40 checks. |
| SEO origin values were inconsistent and preview output could be indexable. | `PUBLIC_ORIGIN` is required and is used for homepage/project canonicals, OG URLs/images, sitemap, and robots. Preview builds add `noindex, nofollow`; preview robots allows metadata fetching and omits the sitemap. | Production and preview static output checks passed; browser checked canonical/OG values at all viewports and every route. |
| Preview server converted binary files to UTF-8 while applying preview metadata, corrupting images despite HTTP 200. | Apply preview metadata transformation only to HTML responses. | Before fix, all three images had `naturalWidth: 0`; after fix, portrait and both project screenshots loaded at all four viewport widths. |
| Project routes were served with an incorrect generic MIME type by the preview server. | Set project-route response type to HTML; added XML and plain-text MIME mappings. | All six route HTTP/render checks pass; sitemap and robots MIME checks pass. |
| Door colors/text had weak contrast and microcopy was hard to read. | Darkened only the four door gradient colors and made targeted label/title sizing, spacing, and line-height adjustments while retaining the visual treatment. | Browser-computed contrast ratios are 5.87:1, 6.96:1, 6.32:1, and 6.32:1 at desktop/tablet/mobile/narrow mobile. |
| Mobile navigation could retain stale accessible state after following a link. | Synchronize `aria-expanded` and `aria-label` on toggle, Escape, and link navigation; add regression assertions. | Menu open, Escape close, and navigation-link close assertions pass at 390 and 360 px. |
| Documentation described deleted legacy files and did not reflect the current build/contact model. | Rewrote README and TODO for the V2 implementation, confirmed domain, preview indexing, routes, and mailto-only form. | Reviewed current files; README points to the correct private template and generated output. |

## Verification results

| Check | Result | Evidence |
| --- | --- | --- |
| Production build | PASS | `npm run build` generated the static homepage and six routes under `dist`. |
| Production deployment output | PASS | 40 passed, 0 failed. No public template, all canonical/OG values use `PUBLIC_ORIGIN`, seven sitemap URLs, production robots sitemap. |
| Preview deployment output | PASS | 40 passed, 0 failed. All seven HTML pages include `noindex, nofollow`; preview robots omits production sitemap. |
| Browser regression | PASS | 318 passed, 0 failed, 318 checks across 1440, 1024, 390, and 360 px. |
| Case studies | PASS | All six route pages return 200, render server-side, contain Problem, Approach, Architecture & technologies, Results, Challenges & limitations, SEO metadata, and repository link. |
| Project links | PASS | All six GitHub API repository URLs and the hamiGenZ and Arena_Core demo URLs returned HTTP 200 in the network-enabled link check. |
| Canonical / sitemap / robots / OG | PASS | Homepage and all six routes use the confirmed production origin; OG image URLs are absolute; sitemap has seven absolute URLs. |
| Images | PASS | Portrait and two genuine project screenshots load at all four widths. |
| Responsive and interactions | PASS | Six cards, four category doors, filters, deep links, theme toggle, mobile navigation, reduced motion, keyboard skip/focus, form validation, and no horizontal overflow. |
| Runtime | PASS | Zero console errors and zero uncaught browser errors in final suite. |
| Node syntax | PASS | Six source files pass `node --check`. |
| `git diff --check` | Pending | Must be rerun after final report and before commit. |
| Accessibility heuristic | PARTIAL | Contrast is verified in rendered browser; remaining heuristic warnings are detailed below. |
| LinkedIn profile destination | PARTIAL | Destination standardized to the full profile URL from the previous project README. LinkedIn returned HTTP 999 to automated requests, so the account destination needs manual confirmation. |
| Production deployment | BLOCKED by instruction | No deployment, merge, production setting change, or `main` change was made. |

## Browser evidence and screenshots

Final Playwright run: **318 passed, 0 failed, 318 checks**. It includes the production-mode canonical/OG/robots policy; `/case-study.html` 404; all six route metadata/content checks; filters and cards; theme, menu state, keyboard focus, reduced motion; contact form validation and encoded mailto; images; overflow; console/runtime errors.

Fresh full-page Chromium captures were visually inspected after the final image fix:

- Desktop 1440 px: `reports/screenshots/v2-1440.png`
- Tablet 1024 px: `reports/screenshots/v2-1024.png`
- Mobile 390 px: `reports/screenshots/v2-390.png`
- Narrow mobile 360 px: `reports/screenshots/v2-360.png`

Observed layouts retain the four colorful door cards and use a two-column door grid and single-column project list on mobile. No horizontal overflow was seen. The actual images render correctly. The large heading and small metadata still follow the existing visual hierarchy; no global font-size change was made.

## Accessibility findings and limitations

- Rendered door text exceeds WCAG AA 4.5:1 contrast at all four viewport widths (measured ratios above). Door label minimums are 12 px at desktop/tablet and 11 px on mobile; title minimums are 20 px and 17 px respectively.
- Visible keyboard focus and skip link pass at all four widths. Mobile menu ARIA state updates after toggling, Escape, and link navigation. Reduced-motion behavior passes.
- `impeccable detect --json public/index.html public/qa.js` reports 15 heuristic findings: four small-text flags (10–11 px microcopy), five flush-boundary/padding flags, three tight letter-spacing flags, one body overflow clipping flag, one font-popularity flag, and one colored-glow flag. It no longer reports the original door contrast issue. Some padding/overflow/font/glow findings are design heuristics or intentional; 10–11 px small labels remain less comfortable than body copy and are an accessibility polish follow-up. No screen-reader or assistive-technology manual audit was performed.
- The form uses `mailto:` to open the visitor’s external email application; it does not send server-side email. A future backend requires an API endpoint, server-held provider credentials, server-side validation, rate limiting/anti-spam controls, privacy/retention policy, and delivery/error monitoring.
- Project descriptions avoid unsupported performance claims. hamiGenZ has no independent accuracy/user benchmark; Arena_Core is a simulation; token counts are approximate; EcoMart is a prototype without real transactions; MedStore uses local-file persistence; the spam classifier has no evaluation benchmark.

## Changed files

- `.gitignore` — ignore generated output and local environment files.
- `README.md`, `TODO.md` — replace obsolete V1 documentation with V2 build, SEO, contact, and release facts.
- `IMPLEMENTATION_REPORT.md` — this evidence report.
- `PRODUCT.md` — implementation facts and project limits.
- `package.json`, `package-lock.json` — deterministic Node 22 build/runtime metadata and lockfile.
- `vercel.json` — Vercel build command, install command, output directory, trailing slash, and canonical origin.
- `site-config.js` — required origin and preview noindex policy.
- `case-studies.js` — six evidence-based project case studies and SEO rendering.
- `server.mjs` — HTML routes, template access, correct MIME types, and binary-safe preview behavior.
- `scripts/build.mjs`, `scripts/preview.mjs` — static generation and local preview.
- `templates/case-study.html` — private template moved from `public/case-study.html`.
- `public/index.html` — current V2 homepage, SEO placeholders, targeted door readability, and verified profile URL.
- `public/qa.js` — interaction/accessibility behavior and mobile menu state.
- `public/robots.txt`, `public/sitemap.xml` — origin placeholders and production/preview crawler policy.
- `public/main.js`, `public/styles.css` — obsolete legacy files removed by the pre-existing V2 replacement.
- `inspect_prod.py` — production inspection uses `PUBLIC_ORIGIN` rather than a hardcoded origin.
- `tests/portfolio_regression.py` — 318-check Playwright suite and screenshot capture.
- `tests/deployment_output.py` — static production/preview output assertions.
- `reports/screenshots/v2-1440.png`, `v2-1024.png`, `v2-390.png`, `v2-360.png` — fresh visual evidence. Earlier desktop/mobile captures remain in the report folder but are superseded.

Generated `dist/` is ignored build output.

## Commands run and actual outcomes

Commands are listed in execution order; temporary exploratory failures are included.

| Command / action | Actual result |
| --- | --- |
| `npm.cmd install --package-lock-only --ignore-scripts --no-audit --no-fund` | PASS; generated lockfile. |
| `npm.cmd ci --ignore-scripts --no-audit --no-fund` | PASS; npm warned that local Node 24 differs from project’s Node 22.x requirement. Vercel config selects Node 22.x. |
| `npm run build` with `PUBLIC_ORIGIN=https://portfolio-gamma-coral-47.vercel.app`, `VERCEL_ENV=production` | PASS; generated homepage and six route folders in `dist`. |
| `tests/deployment_output.py production` (before final preview-server-only correction) | PASS; 40 passed, 0 failed. |
| Initial browser regression on stale/occupied preview port | FAIL; first run encountered stale route metadata/MIME conditions. Rerun on a fresh server isolated a binary image corruption defect. |
| Browser diagnostics on port 3210 | FAIL as expected before fix: all three image requests returned 200, but images decoded to `naturalWidth: 0`. Response bytes had been UTF-8 transformed. |
| `npm run build` with `VERCEL_ENV=preview` | PASS; generated preview output. |
| `tests/deployment_output.py preview` | PASS; 40 passed, 0 failed. |
| `node --check server.mjs`, `site-config.js`, `case-studies.js`, `scripts/build.mjs`, `scripts/preview.mjs`, `public/qa.js` | PASS; six syntax checks. |
| `impeccable detect --json public/index.html public/qa.js` | PARTIAL; remaining heuristic findings noted above; door contrast warnings are resolved. |
| `curl.exe` checks for six GitHub API repository URLs and two live demos (first sandbox attempt, then approved network retry) | First attempt: network blocked, all 000. Approved retry: all eight URLs returned HTTP 200. |
| Full Playwright regression against corrected source preview server, port 3211 | PASS; 318 passed, 0 failed. |
| Full Playwright regression against generated production `dist` served through `scripts/preview.mjs`, port 3212 | PASS; 318 passed, 0 failed. Captured and visually inspected the four fresh screenshots listed above. |
| Production build after preview-output audit | PASS; `dist/` restored to production mode. |
| Final `tests/deployment_output.py production` against restored `dist` | PASS; 40 passed, 0 failed. |
| `git diff --check` | PASS; no whitespace errors. Git emitted LF-to-CRLF working-copy notices for README, TODO, homepage, robots, sitemap, and the Python test. |
| `git status --short`, `git diff --stat`, `git branch --show-current`, `git remote -v` | PASS; confirmed branch `rebuild/immersive-reference`, origin `https://github.com/omwe77/Portfolio-Site.git`, and preserved all dirty V2 files for the release commit. |
| `git push origin rebuild/immersive-reference` (sandbox attempt) | BLOCKED; sandbox could not connect to GitHub port 443. |
| `git push origin rebuild/immersive-reference` (approved network retry) | PASS; pushed new remote feature branch only. GitHub returned the feature-branch pull-request URL. |
| `git fetch origin` (first sandbox attempt, then approved retry) | First attempt: blocked by sandbox networking. Approved retry: PASS; fetched current main and feature refs with no new main commits. |
| `git switch main` | PASS; local `main` matched `origin/main` at `2c1bd42f61843884fd08e4db84ee73070b41739c`. |
| `git merge --no-ff rebuild/immersive-reference -m "Merge Portfolio V2 production replacement"` | PASS; normal ort merge, no conflicts. Created production merge commit `13ed169d0f56a447dbe6fabb157b27e8df90cf7b`. |
| `npm run build` after merge with production `PUBLIC_ORIGIN` and `VERCEL_ENV` | PASS; generated the homepage and all six static case-study routes. |
| `tests/deployment_output.py production` after merge | PASS; 40 passed, 0 failed. |
| `git push origin main` | PASS; origin/main advanced from `2c1bd42` to `13ed169`, no force push. |
| `gh api repos/omwe77/Portfolio-Site/commits/13ed169d0f56a447dbe6fabb157b27e8df90cf7b/status` | PASS; Vercel context state `success`, description `Deployment has completed`, deployment detail URL recorded above. |
| `gh api .../commits/{sha}/deployments` exploratory lookup | Returned HTTP 422 because this is not the GitHub deployments endpoint; it did not create or alter a deployment. The Vercel commit status above is the deployment evidence. |
| Production `tests/portfolio_regression.py https://portfolio-gamma-coral-47.vercel.app/` | PASS; 318 passed, 0 failed, including all six routes, images, navigation, theme, and zero console/runtime errors. |
| `gh api repos/omwe77/Portfolio-Site/commits/343d674/status` | PASS; follow-up report/screenshot commit also received Vercel state `success`, description `Deployment has completed`. |
| Production URL `curl.exe` smoke checks after `343d674` deployment (homepage, six project routes, three image assets) | PASS; all ten URLs returned HTTP 200. |

## Deployment configuration and blockers

`vercel.json` explicitly declares `npm ci --ignore-scripts`, `npm run build`, `dist`, Node `22.x` through `package.json`, trailing slash behavior, and `PUBLIC_ORIGIN=https://portfolio-gamma-coral-47.vercel.app`. Vercel’s system `VERCEL_ENV` controls production vs preview output. Preview pages are noindex and do not publish the production sitemap in `robots.txt`.

The user confirmed Vercel Root Directory is `./` before merge. `vercel.json` is at that repository root and sets `npm run build`, output directory `dist`, Node `22.x` through `package.json`, and the confirmed `PUBLIC_ORIGIN`.

## Production replacement and live verification

- Feature commit merged: `bab6a608c1ddc06160f449f35e30445483ff1f61`.
- Production merge commit on `main`: `13ed169d0f56a447dbe6fabb157b27e8df90cf7b` (`Merge Portfolio V2 production replacement`). It has parents `2c1bd42f61843884fd08e4db84ee73070b41739c` and `bab6a608c1ddc06160f449f35e30445483ff1f61`.
- Push: PASS, `main` updated from `2c1bd42` to `13ed169`; no force push.
- Production URL: https://portfolio-gamma-coral-47.vercel.app/
- Vercel status: **PASS — Ready/completed**. GitHub commit status for `13ed169…` has context `Vercel`, state `success`, description `Deployment has completed`, and target `https://vercel.com/omwe77/portfolio/EZjfe2EYXa1tmxgGQvGZ4VVUARS6` (recorded 2026-11-09 13:52:02 UTC).
- Build after merge: PASS. `npm run build` generated the homepage and six case-study routes.
- Static output after merge: PASS, 40 passed, 0 failed.
- Live Playwright smoke test against the production URL: **PASS, 318 passed, 0 failed**. All six routes return HTTP 200 and render the required case-study sections; homepage and route canonicals/OG metadata, all three images, category filters, navigation and menu ARIA, theme switching, responsive behavior at 1440/1024/390/360, keyboard focus, reduced motion, and zero browser console/runtime errors passed.
- The production test refreshed the full-page captures in `reports/screenshots/v2-1440.png`, `v2-1024.png`, `v2-390.png`, and `v2-360.png`; the 1440 and 360 images changed from the previous local captures.
- After the report/screenshot commit `343d6742157a2d51ec419f6b2194c02a438e3ad1` was pushed, Vercel also reported `success` / `Deployment has completed` for that commit, with detail target `https://vercel.com/omwe77/portfolio/8rCW7kN1Za13gpyPnK6eBoimjhYG` (2026-11-09 14:12:37 UTC).
- Final HTTP smoke checks after that latest deployment returned **200** for the homepage, all six project routes, the portrait, and both project screenshots. The 318-check browser suite was run against the code deployment commit `13ed169…`; `343d674…` only changed this report and the two refreshed screenshots.

The Vercel deployment status above is from the GitHub Vercel commit check; no Vercel dashboard settings were changed. LinkedIn profile identity remains unverified because automated LinkedIn requests are blocked.

**Git release details:** feature branch `rebuild/immersive-reference` remains on origin at `bab6a608c1ddc06160f449f35e30445483ff1f61`. Production replacement merge commit: `13ed169d0f56a447dbe6fabb157b27e8df90cf7b`. Follow-up report and screenshot commit: `343d6742157a2d51ec419f6b2194c02a438e3ad1`.
