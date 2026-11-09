# Portfolio V2 — Release Checklist

## Completed in this release-hardening pass

- [x] Move the case-study template to `templates/case-study.html`, outside `public/`.
- [x] Build all six shareable project routes into `dist/`; keep `/case-study.html` unavailable.
- [x] Add deterministic Vercel install/build/output settings, lockfile, and Node 22.x requirement.
- [x] Use the confirmed `PUBLIC_ORIGIN=https://portfolio-gamma-coral-47.vercel.app` for canonical, Open Graph, sitemap, and robots output.
- [x] Mark Vercel preview HTML `noindex, nofollow`; preview robots output omits the production sitemap.
- [x] Correct project card/filter microtype and door-card contrast without changing the V2 composition.
- [x] Synchronize mobile menu `aria-expanded` and `aria-label` when toggled, dismissed with Escape, or closed by a navigation link.
- [x] Add XML and plain-text MIME mappings to the local server.
- [x] Replace obsolete site documentation with V2 architecture, build, test, contact, and deployment guidance.

## Remaining before production release

- [ ] Manually open the LinkedIn profile link. The full profile URL was taken from the prior README; automated LinkedIn requests returned HTTP 999, so account identity was not independently verified.
- [ ] Review the final implementation report, browser screenshots, and remaining accessibility heuristic warnings.
- [ ] Confirm the Vercel project uses the repository root as its root directory. No production settings were inspected or changed.
- [ ] Obtain release approval before merging or deploying.

## Known product limits

- The contact form uses `mailto:` and has no server-side email delivery.
- hamiGenZ has no independent accuracy or user benchmark; Arena_Core is a simulation; subscription token counts are approximate; EcoMart is a non-transactional prototype; Spam Email Classifier has no benchmark evaluation; MedStore uses local file persistence.
- No production deployment was performed in this task.
