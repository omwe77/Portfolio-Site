# Om Dangol — Portfolio V2

A responsive portfolio with project filters, six individual case-study routes, keyboard-accessible navigation, reduced-motion support, and a client-side email draft form. The site uses HTML, CSS, JavaScript, and a small Node.js build/preview server. It has no application runtime dependencies.

## Production origin

The confirmed production origin is `https://portfolio-gamma-coral-47.vercel.app/`. `PUBLIC_ORIGIN` is the source used by the build for canonical links, Open Graph URLs and images, the sitemap, and `robots.txt`. The value is defined in `vercel.json` for Vercel builds and must be set explicitly for local builds.

## Run locally

Use Node.js 22.x, as specified in `package.json`:

```powershell
$env:PUBLIC_ORIGIN = 'http://127.0.0.1:3000'
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. The development server renders the six `/projects/{slug}/` pages from `templates/case-study.html`. That template is outside the publicly served `public/` directory.

## Build and preview

```powershell
$env:PUBLIC_ORIGIN = 'https://portfolio-gamma-coral-47.vercel.app'
npm ci
npm run build
npm run preview
```

The build output is `dist/`. It contains the homepage, assets, sitemap, robots file, 404 page, and six generated case-study routes. It does not contain the unrendered template. Vercel uses the build command, install command, Node version, output directory, confirmed `PUBLIC_ORIGIN`, and trailing-slash handling in `vercel.json`.

Vercel preview builds receive `noindex, nofollow` metadata. Their `robots.txt` omits the sitemap so crawlers can read the page metadata without being directed to preview URLs. Builds running in CI/Vercel fail closed if `VERCEL_ENV` is unavailable.

## Project routes

- `/projects/hamigenz/`
- `/projects/arena/`
- `/projects/subscription/`
- `/projects/ecomart/`
- `/projects/medstore/`
- `/projects/spam/`

Case-study copy is maintained in `case-studies.js`; the private HTML template is `templates/case-study.html`. Genuine portrait and verified hamiGenZ/Arena_Core screenshots are in `public/`.

## Contact and profile links

The contact form creates an email draft using `mailto:` and opens the visitor's email application. It does not send messages to a server. The footer links to GitHub and the LinkedIn profile URL carried in the earlier project README: `https://www.linkedin.com/in/om-dangol-0a39243a7/`. LinkedIn limits automated HTTP checks, so the profile destination still needs a manual click-through check.

## Regression suite

`tests/portfolio_regression.py` runs with Python Playwright and a local Chromium install. It covers the four required viewport widths, filters and project routes, canonical/OG/sitemap/robots output, private-template 404, navigation/menu ARIA state, contact form, reduced motion, images, overflow, keyboard focus, and runtime errors. Set `EXPECT_PREVIEW=1` when testing a preview build.

The site does not include a contact backend. A future backend form would need an API endpoint, provider credentials stored as server secrets, server validation, spam/rate controls, privacy and retention rules, and delivery monitoring.
