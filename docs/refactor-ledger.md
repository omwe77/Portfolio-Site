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
