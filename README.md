# Om's Portfolio

A motion-rich single-page portfolio redesigned with a warm ivory/cream editorial
system — deep navy and ink typography, electric blue / coral / mint accents, a
Playfair Display serif heading system, a custom interactive 3D orbital network
in the hero, and a dark navy footer. Built with plain HTML, CSS, and
JavaScript; no runtime dependencies.

## Public deployment

**Live website:** https://portfolio-gamma-coral-47.vercel.app

The site is automatically deployed to Vercel from the `main` branch on GitHub.
When you push changes, Vercel rebuilds and updates the production site within a
few minutes.

## Run locally

From this folder, run `node server.mjs`. The server binds to `127.0.0.1:3000`
(or the port in the `PORT` environment variable) and serves the site's
`public/` directory.

## Responsive UI and motion

- The sticky header keeps the full section navigation on wider screens and switches to a keyboard-operable mobile disclosure menu on smaller screens. The menu closes on Escape, outside click, or choosing a destination.
- The hero keeps its editorial two-column desktop composition and stacks cleanly on narrow screens, with the five core skills presented as a semantic list.
- A slim scroll-progress indicator tracks reading position. The project screenshots use a short, one-time reveal, while the orbital canvas has an explicit pause/resume control.
- The page honors the operating system's reduced-motion preference and provides visible, accessible motion-control feedback. The site remains plain HTML, CSS, and JavaScript with no added runtime dependencies.

## Featured project evidence

- **hamiGenZ:** [live demo](https://hamegenz.vercel.app/) · [source code](https://github.com/omwe77/hamiGenZ). `public/hami-evidence-workspace-live.png` is a genuine screenshot of the online example workspace and its cited sample notice.
- **Arena_Core:** [live demo](https://lemon-ocean-06aede400.5.azurestaticapps.net/) · [source code](https://github.com/omwe77/Arena_Core). `public/arena-core-home-live.png` and `public/arena-core-world-cup-live.png` are genuine screenshots of the public application and FIFA World Cup 2026 simulator.

## Quick start

The fastest way to get the site running locally:

```bash
node server.mjs
```

Open http://127.0.0.1:3000 in your browser. The server serves `public/` and
supports SPA routing for all internal anchors.

## Personalize before launch

Edit `public/index.html` to adjust Om's profile, project copy, and links. The
orbital canvas, reduced-motion control, and scroll progress are in
`public/main.js`; the full visual system (typography, colours, glass effects,
responsive grids) is in `public/styles.css`. The two case studies use the
screenshot assets in `public/portfolio/`.

## Design system

The redesign follows the approved visual reference:

- **Background:** warm ivory / cream (`#faf8f5`) for page content.
- **Typography:** Playfair Display (serif) for headings, Inter (sans-serif) for
  body text.
- **Accents:** electric blue (`#3b82f6`), restrained coral (`#f59e0b`), mint
  (`#b8eadb`).
- **Hero:** greeting + large serif "Om Dangol" treatment, skill/category badges,
  dual CTA ("Explore My Work" / "Get in Touch"), and the animated orbital
  network canvas.
- **Sections:** Featured Work, Approach (3-step), Education, Skills, and a dark
  navy contact/footer section.
- **Decor:** restrained glass-morphism effects, soft gradients, subtle shadows,
  rounded cards, and a paused/playing motion control.

## Contact

- **Email:** omdangol68@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/om-dangol-0a39243a7/
- **GitHub:** https://github.com/omwe77
- **Location:** Kathmandu, Nepal

## Footer

Practical software. Continuous learning.
