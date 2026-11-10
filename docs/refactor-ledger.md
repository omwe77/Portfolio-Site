# Refactor ledger

## 2026-11-10 — Repository cleanup

**Mode:** Autonomous, requested cleanup. **Starting commit:** `0e0bc514c406ec8cbfb84183d225c586f4bf0c4f`.

**History window:** 90 days; 34 non-merge commits overall, 19 touching homepage/server/build/runtime/regression files, 7 touching docs or deployment configuration. Generated files and lockfiles were excluded from change-hotspot interpretation.

### Applied

- **R1 — Single interaction owner:** removed helper-script injection from build and preview paths; the existing homepage script owns interactions. Removed duplicate menu ARIA listeners, moved focus styling into CSS, put the case-study link in dialog markup, and declared lazy loading in HTML. Verified the static output and exercised the preview server.
- **R2 — Remove confirmed orphans:** removed the unused previous portrait, unused Arena screenshot and hamiGenZ SVG, old one-off inspection script and output, and unreferenced obsolete screenshots. Kept the current supplied portrait, active project images, and audit evidence cited by the report.
- **R3 — Keep verification artifacts out of Git:** regression screenshots now default to a system temporary directory, with `PORTFOLIO_SCREENSHOT_DIR` as an override.
- **R4 — Correct project documentation:** updated README, TODO, and product context to match the live V2 site, current routes, Windows commands, contact behavior, test setup, and remaining verification follow-ups.

### Verification

- Baseline and final `npm run build`: passed; six case-study routes generated.
- `tests/deployment_output.py`: production 43/43 and preview 43/43.
- Node syntax checks: five surviving JavaScript files passed. Python syntax compilation: two regression scripts passed. `git diff --check`: passed.
- Local Chromium smoke: 1440, 1024, 390, and 360 px; six images loaded at each width, no horizontal overflow, no injected helper script, and no console/runtime errors. Checked all six case-study routes, filters, dialog deep link, theme toggle, mobile menu state, and reduced-motion behavior.
- Full `tests/portfolio_regression.py` was not run: Python Playwright is not installed in this environment.

### Do not refactor

Keep the existing single-page portfolio, case-study renderer, verified content, and report-cited before/after screenshots. No architecture or dependency migration was warranted.

## 2026-11-10 — Interaction regression and documentation pass

**Mode:** Autonomous, requested cleanup and bug audit. **Starting commit:** `2338e1da8458aeadffbec896427d4ebda656cbf2`.

**History window:** 90 days; 36 non-merge commits overall, 22 touching `public/index.html`, `tests/portfolio_regression.py`, or `README.md`. The homepage is the frequent-change surface; its small inline script remains directly testable and has no runtime package dependencies.

### Applied

- **R1 — Make hover assertions measure the finished motion:** the regression suite now waits through the project/card transitions, rejects identity transforms, and verifies the discipline diagram's stroke reaches its end. This corrects an immediate-sampling false failure and a previous false-positive for an unchanged image transform.
- **R2 — Repair the case-study link locator:** the UI contains `#case-route`; the test used the nonexistent `.case-route` class and timed out. The test now selects the actual ID and confirms every dialog's deep link.
- **R3 — Improve console-error diagnosis:** browser console failures now include the source URL, which distinguishes app errors from blocked external resources.
- **R4 — Update README behavior notes:** document the discipline diagrams' hover/focus drawing and persistent selected state.

### Verification

- Baseline `npm run build` and `tests/deployment_output.py`: passed; six case-study routes generated and 43/43 output checks passed.
- Corrected browser suite passed **375/375** in the network-enabled run across 1440, 1024, 390, and 360 px, including buttons, filters, dialog links/routes, theme, mobile navigation, keyboard focus, reduced motion, images, and console/runtime checks.
- Sandbox-only browser run passed 374/375 because four Google Fonts requests were blocked by `ERR_NETWORK_ACCESS_DENIED`; the same suite passed with network access enabled.
- External links: six GitHub repositories, both recorded demos, and Gmail compose returned HTTP 200. LinkedIn returned HTTP 999, which blocks automated verification; its identity remains a manual check.
- No public assets or production runtime modules were removed: current assets are referenced by the site/build, and `npm ls --depth=0` reports no app dependencies. Unused-code removal was not justified by evidence.

### Do not refactor

Keep the current static architecture and small inline interaction script. The browser suite verifies all current button and animation paths; a larger framework or runtime split would add dependencies without solving an observed defect. Keep the LinkedIn identity follow-up until it can be confirmed manually.
