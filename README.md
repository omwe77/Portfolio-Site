# Om Dangol — Portfolio

Responsive personal portfolio for Om Dangol, a Computing with Artificial Intelligence student. It presents six projects, individual case-study pages, education, skills, and contact links.

**Live site:** [portfolio-gamma-coral-47.vercel.app](https://portfolio-gamma-coral-47.vercel.app/)

## Stack and structure

- Static HTML, CSS, and JavaScript; no application runtime dependencies.
- Node.js 22.x build and local preview server.
- `public/index.html` contains the homepage, interactions, project dialog links, and declarative image loading hints.
- `case-studies.js` holds case-study content; `templates/case-study.html` is a private build template outside the public directory.
- `scripts/build.mjs` writes the homepage, assets, SEO files, 404 page, and six project routes to `dist/`.
- Vercel builds from the repository root (`./`) and publishes `dist/`, as configured in `vercel.json`.

## Run locally

Install Node.js 22.x, then run:

```powershell
$env:PUBLIC_ORIGIN = 'https://portfolio-gamma-coral-47.vercel.app'
npm.cmd ci
npm.cmd run dev
```

Open `http://127.0.0.1:3000`. The local server renders the six project routes from the private template.

To build and preview the production output, use a second terminal:

```powershell
$env:PUBLIC_ORIGIN = 'https://portfolio-gamma-coral-47.vercel.app'
npm.cmd run build
$env:PORT = '3001'
npm.cmd run preview
```

Open `http://127.0.0.1:3001`. `PUBLIC_ORIGIN` is required by all builds. Vercel sets the confirmed production origin in `vercel.json`; preview deployments receive `noindex, nofollow` metadata and do not publish a sitemap URL in `robots.txt`.

## Project pages

- `/projects/hamigenz/`
- `/projects/arena/`
- `/projects/subscription/`
- `/projects/ecomart/`
- `/projects/medstore/`
- `/projects/spam/`

Homepage category filters, project dialogs, theme switching, mobile navigation, and motion preferences are implemented in the existing page. The four discipline cards draw their small route diagrams on hover or keyboard focus, and keep the selected discipline visible after filtering. Each project page has a canonical URL and links to its recorded repository; Arena_Core and hamiGenZ also link to their recorded demos.

## Contact behavior

**Email Om** opens an addressed compose draft in Gmail. The visitor chooses whether to send it. The contact section also provides a `mailto:` address for other email applications. There is no contact form or server-side email delivery.

Om's public profile links are [GitHub](https://github.com/omwe77) and [LinkedIn](https://www.linkedin.com/in/om-dangol-0a39243a7/). The LinkedIn URL is present on the site, but its account identity still needs manual confirmation.

## Verification

The Python regression suite uses Playwright and Chromium. Install its test-only tools with:

```powershell
python -m pip install playwright
python -m playwright install chromium
```

Start the local server as described above, then run in another terminal:

```powershell
$env:PUBLIC_ORIGIN = 'https://portfolio-gamma-coral-47.vercel.app'
python tests/portfolio_regression.py
python tests/deployment_output.py
```

To run the browser suite against another server, pass its URL, for example `python tests/portfolio_regression.py https://portfolio-gamma-coral-47.vercel.app`. To check preview metadata, build in preview mode and inspect it:

```powershell
$env:PUBLIC_ORIGIN = 'https://portfolio-gamma-coral-47.vercel.app'
$env:VERCEL_ENV = 'preview'
npm.cmd run build
python tests/deployment_output.py preview
```

Screenshots go to the system temporary directory by default; set `PORTFOLIO_SCREENSHOT_DIR` to choose another destination.

The GitHub `main` branch is connected to the existing Vercel project. Pushing a verified commit to `main` triggers the production deployment; feature branches create previews.
