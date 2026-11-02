"""
Portfolio regression suite (Playwright, Python).

Usage:
    python tests/portfolio_regression.py [base_url]

Checks the rendered application (not the source) at desktop and mobile
viewports: layout grid alignment, animation lifecycle (start/pause/resume/
stress/resize), device-pixel-ratio rendering, reduced-motion behavior,
OS motion-preference changes, three reloads, navigation, links, images,
keyboard focus, and console errors. Exit code 0 only when every check passes.

The layout/animation/DPR sections encode the regression tests for the
section-gutter repair and the animation lifecycle repair. When a check
fails, run the focused probe scripts separately before editing code.

Requires: playwright (python). Local server must be running at base_url.
"""
import base64
import io
import json
import pathlib
import sys

from playwright.sync_api import sync_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "http://127.0.0.1:3000"
SHOTS = pathlib.Path("reports/screenshots")

failures = []
console_errors = []

RAF_TRACKER = """
(() => {
  const R = window.requestAnimationFrame.bind(window);
  const C = window.cancelAnimationFrame.bind(window);
  const pending = new Map();
  let nextId = 0;
  window.__rafTotal = 0;
  window.requestAnimationFrame = (cb) => {
    window.__rafTotal += 1;
    const trackerId = nextId;
    nextId += 1;
    const real = R((t) => {
      pending.delete(trackerId);
      cb(t);
    });
    pending.set(trackerId, real);
    return trackerId;
  };
  window.cancelAnimationFrame = (key) => {
    const real = pending.get(key);
    if (real != null) { pending.delete(key); C(real); } else { C(key); }
  };
  window.__rafPendingCount = () => pending.size;
})();
"""


def check(name, ok, detail=""):
    print(("PASS" if ok else "FAIL"), name, detail)
    if not ok:
        failures.append(name)


def new_page(browser, width, height, dpr=1, reduced=False, touch=False, mobile=False):
    ctx = browser.new_context(
        viewport={"width": width, "height": height},
        device_scale_factor=dpr,
        reduced_motion="reduce" if reduced else "no-preference",
        has_touch=touch,
        is_mobile=mobile,
    )
    ctx.add_init_script(RAF_TRACKER)
    page = ctx.new_page()
    page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: console_errors.append(str(e)))
    return ctx, page


ROI_JS = """
() => {
  const c = document.getElementById('orbital-canvas');
  if (!c) return null;
  const rect = c.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const logical = Math.min(rect.width, rect.height);
  const ctx2 = c.getContext('2d');
  const sampleRow = (x, y, n) => {
    let maxA = 0;
    for (let i = 0; i <= n; i++) {
      const py = Math.round((y - n / 2 + i) * dpr);
      if (py < 0 || py >= c.height) continue;
      maxA = Math.max(maxA, ctx2.getImageData(Math.round(x * dpr), py, 1, 1).data[3]);
    }
    return maxA;
  };
  return {
    canvasW: c.width, canvasH: c.height,
    clientW: Math.round(rect.width), clientH: Math.round(rect.height),
    dpr,
    centerA: sampleRow(rect.width / 2, rect.height / 2, 3),
    ringRightA: sampleRow(rect.width / 2 + logical * 0.36, rect.height / 2, 6),
    styleW: Math.round(parseFloat(c.style.width || '0')),
    styleH: Math.round(parseFloat(c.style.height || '0'))
  };
}
"""

MOTION_STATE_JS = """
() => {
  const btn = document.getElementById('motion-toggle');
  return {
    bodyPaused: document.body.classList.contains('motion-paused'),
    aria: btn ? btn.getAttribute('aria-label') : null,
    pending: window.__rafPendingCount(),
    rafTotal: window.__rafTotal
  };
}
"""

MOTION_SAMPLE_JS = """
async () => {
  const snap = () => document.getElementById('orbital-canvas').toDataURL();
  const a = snap();
  await new Promise((r) => setTimeout(r, 700));
  const b = snap();
  const t0 = window.__rafTotal;
  await new Promise((r) => setTimeout(r, 400));
  const scheduled = window.__rafTotal - t0;
  return { changed: a !== b, scheduled };
}
"""

MOTION_PNG_JS = "() => document.getElementById('orbital-canvas').toDataURL()"


def dataurl_alpha_mean(png1_b64, png2_b64, target_w=480):
    """Mean alpha difference between two canvas dataURLs after normalizing size."""
    from PIL import Image, ImageChops
    im1 = Image.open(io.BytesIO(base64.b64decode(png1_b64))).convert("RGBA")
    im2 = Image.open(io.BytesIO(base64.b64decode(png2_b64))).convert("RGBA")
    h = max(int(im1.height * target_w / im1.width), 1)
    im1 = im1.resize((target_w, h))
    im2 = im2.resize((target_w, h))
    diff = ImageChops.difference(im1, im2)
    alpha = diff.split()[3]
    hist = alpha.histogram()
    total = sum(hist)
    weighted = sum(i * n for i, n in enumerate(hist))
    return weighted / max(total, 1)


def follow_anchor(page, selector, target_id):
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(400)
    page.click(selector)
    page.wait_for_timeout(2500)
    return page.evaluate(
        """(t) => {
            const el = document.getElementById(t);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return { top: Math.round(r.top), inView: r.top >= -50 && r.top < 300,
                     scrollY: Math.round(window.scrollY) };
        }""",
        target_id,
    )


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ---------- LAYOUT ----------
        print("== Layout ==")
        for w, h in [(1440, 900), (1024, 800), (375, 844)]:
            ctx, page = new_page(browser, w, h)
            page.goto(BASE_URL, wait_until="networkidle")
            page.wait_for_timeout(1000)
            d = page.evaluate(
                """() => ({
                    header: Math.round(document.querySelector('.header-inner').getBoundingClientRect().left),
                    works: ['#work .section-shell', '#education .section-shell', '#skills .section-shell',
                            '#contact .contact-copy', 'footer.site-footer'].map(s => {
                        const el = document.querySelector(s);
                        return el ? Math.round(el.getBoundingClientRect().left) : null;
                    }),
                    approachH2: Math.round(document.querySelector('#approach h2').getBoundingClientRect().left),
                    overflow: document.body.scrollWidth > document.documentElement.clientWidth
                })"""
            )
            aligned = all(v is not None and abs(v - d["header"]) <= 2 for v in d["works"])
            check(f"[{w}] all sections aligned to grid", aligned, str(d["works"]))
            check(f"[{w}] approach aligned to grid", abs(d["approachH2"] - d["header"]) <= 2, str(d["approachH2"]))
            check(f"[{w}] gutters not flush", d["header"] >= 12, "")
            check(f"[{w}] no horizontal overflow", not d["overflow"], "")
            ctx.close()

        # ---------- ANIMATION LIFECYCLE ----------
        print("== Animation lifecycle (DPR 1) ==")
        ctx, page = new_page(browser, 1440, 900)
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(1500)

        st = page.evaluate(MOTION_STATE_JS)
        check("initial: toggle label 'Pause motion'", st["aria"] == "Pause motion", str(st["aria"]))
        check("initial: body not motion-paused", not st["bodyPaused"], "")
        check("initial: exactly one active frame chain", st["pending"] == 1,
              f"pending={st['pending']} total={st['rafTotal']}")

        sample = page.evaluate(MOTION_SAMPLE_JS)
        check("initial: canvas artwork animates", sample["changed"],
              f"changed={sample['changed']} scheduled={sample['scheduled']}")
        check("initial: frames scheduled continuously", 15 <= sample["scheduled"] <= 90,
              str(sample["scheduled"]))

        page.click("#motion-toggle")
        page.wait_for_timeout(250)
        st = page.evaluate(MOTION_STATE_JS)
        check("paused: aria 'Resume motion'", st["aria"] == "Resume motion", "")
        check("paused: body has motion-paused", st["bodyPaused"], "")
        check("paused: zero active frame chains", st["pending"] == 0, f"pending={st['pending']}")
        page.wait_for_timeout(600)
        st = page.evaluate(MOTION_STATE_JS)
        check("paused: still zero chains after >1s", st["pending"] == 0, "")
        sample = page.evaluate(MOTION_SAMPLE_JS)
        check("paused: canvas pixels frozen", not sample["changed"], "")
        check("paused: no frames scheduled while frozen", sample["scheduled"] == 0, str(sample["scheduled"]))

        page.click("#motion-toggle")
        page.wait_for_timeout(250)
        st = page.evaluate(MOTION_STATE_JS)
        check("resumed: aria 'Pause motion'", st["aria"] == "Pause motion", "")
        check("resumed: exactly one chain", st["pending"] == 1, f"pending={st['pending']}")
        sample = page.evaluate(MOTION_SAMPLE_JS)
        check("resumed: canvas animates", sample["changed"], "")

        for _ in range(4):
            for _ in range(2):
                page.click("#motion-toggle")
                page.wait_for_timeout(100)
            page.click("#motion-toggle")  # end paused
            page.wait_for_timeout(300)
            page.click("#motion-toggle")  # end running
            page.wait_for_timeout(300)
        st = page.evaluate(MOTION_STATE_JS)
        check("stress: still exactly one chain after 24 toggles", st["pending"] == 1, f"pending={st['pending']}")

        page.set_viewport_size({"width": 1200, "height": 800})
        page.wait_for_timeout(400)
        geo = page.evaluate(ROI_JS)
        check("resize: canvas backing matches CSS size * dpr",
              geo["canvasW"] == round(geo["clientW"] * geo["dpr"]),
              f"{geo['canvasW']} vs {geo['clientW']}*{geo['dpr']}")
        check("resize: style size updated", geo["styleW"] == geo["clientW"], "")
        st = page.evaluate(MOTION_STATE_JS)
        check("resize: still exactly one chain", st["pending"] == 1, f"pending={st['pending']}")
        ctx.close()

        # ---------- DPR RENDERING (normalized canvas diff, reduced motion) ----------
        print("== DPR rendering ==")
        pngs = {}
        for dpr in (1, 2):
            ctx, page = new_page(browser, 1440, 900, dpr=dpr, reduced=True)
            page.goto(BASE_URL, wait_until="networkidle")
            page.wait_for_timeout(1500)
            geo = page.evaluate(ROI_JS)
            check(f"dpr{dpr}: backing == client*dpr",
                  geo["canvasW"] == round(geo["clientW"] * dpr) and geo["canvasH"] == round(geo["clientH"] * dpr),
                  "")
            check(f"dpr{dpr}: central sphere rendered", geo["centerA"] > 0, str(geo["centerA"]))
            pngs[dpr] = page.evaluate(MOTION_PNG_JS)
            ctx.close()
        mean_diff = dataurl_alpha_mean(pngs[1], pngs[2])
        check("dpr1 vs dpr2: normalized renders match (mean alpha diff < 3)",
              mean_diff < 3.0, f"diff={mean_diff:.3f}")

        # ---------- REDUCED MOTION ----------
        print("== Reduced motion ==")
        ctx, page = new_page(browser, 1440, 900, reduced=True)
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(1500)
        st = page.evaluate(MOTION_STATE_JS)
        check("reduced initial: motion disabled", st["aria"] == "Resume motion" and st["pending"] == 0, str(st))
        geo = page.evaluate(ROI_JS)
        check("reduced initial: static artwork still rendered", geo["centerA"] > 0, str(geo["centerA"]))
        sample = page.evaluate(MOTION_SAMPLE_JS)
        check("reduced initial: canvas frozen, no frames scheduled",
              not sample["changed"] and sample["scheduled"] == 0, str(sample))

        page.emulate_media(reduced_motion="no-preference")
        page.wait_for_timeout(400)
        st = page.evaluate(MOTION_STATE_JS)
        check("OS reduce removed: motion enabled", st["aria"] == "Pause motion" and st["pending"] == 1, str(st))
        page.emulate_media(reduced_motion="reduce")
        page.wait_for_timeout(400)
        st = page.evaluate(MOTION_STATE_JS)
        check("OS reduce restored: motion disabled", st["aria"] == "Resume motion" and st["pending"] == 0, str(st))
        page.click("#motion-toggle")
        page.wait_for_timeout(200)
        st = page.evaluate(MOTION_STATE_JS)
        check("manual resume after OS reduce: one chain", st["pending"] == 1, "")
        ctx.close()

        # ---------- RELOAD x3 ----------
        print("== Reload x3 ==")
        ctx, page = new_page(browser, 1440, 900)
        for i in range(3):
            page.goto(BASE_URL, wait_until="networkidle")
            page.wait_for_timeout(1200)
            st = page.evaluate(MOTION_STATE_JS)
            check(f"reload {i + 1}: one chain, running, no paused state",
                  st["pending"] == 1 and not st["bodyPaused"], "")
        ctx.close()

        # ---------- NAVIGATION / LINKS / FOCUS / IMAGES ----------
        print("== Navigation, links, focus ==")
        ctx, page = new_page(browser, 1440, 900)
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(1000)

        for label, target in [("Work", "work"), ("Approach", "approach"), ("Education", "education"),
                              ("Skills", "skills")]:
            res = follow_anchor(page, f".site-nav a[href='#{target}']", target)
            check(f"nav '{label}' reaches #{target}", bool(res and res["inView"]), str(res))

        res = follow_anchor(page, ".hero-actions a[href='#contact']", "contact")
        check("hero 'Get in Touch' reaches #contact", bool(res and res["inView"]), str(res))

        nav_mail = page.get_attribute(".site-nav .nav-contact", "href")
        check("header 'Contact' is mailto action (opens mail client)", nav_mail.startswith("mailto:"), nav_mail)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(800)
        page.click(".back-to-top")
        page.wait_for_timeout(2500)
        check("back-to-top returns to top", page.evaluate("window.scrollY") < 5,
              f"scrollY={page.evaluate('window.scrollY')}")

        hrefs = page.evaluate(
            """() => ({
                hero: [...document.querySelectorAll('.hero-actions a')].map(a => a.getAttribute('href')),
                projects: [...document.querySelectorAll('.project-action')].map(a => a.getAttribute('href')),
                contactBtn: document.querySelector('.contact-actions a')?.getAttribute('href') || null,
                social: [...document.querySelectorAll('.contact-social a')].map(a => a.getAttribute('href'))
            })"""
        )
        check("hero CTAs target #work/#contact", hrefs["hero"] == ["#work", "#contact"], str(hrefs["hero"]))
        # ARENA_CORE source per project README evidence (omwe77/Arena_Core, HTTP 200
        # confirmed) - the previously linked ARENA-CORE returned HTTP 404.
        check("project links point to documented destinations",
              hrefs["projects"] == ["https://github.com/omwe77/hamiGenZ", "https://hamegenz.vercel.app",
                                    "https://github.com/omwe77/Arena_Core", "https://lemon-ocean-06aede400.5.azurestaticapps.net"],
              str(hrefs["projects"]))
        check("contact action is mailto", (hrefs["contactBtn"] or "").startswith("mailto:"), str(hrefs["contactBtn"]))
        check("social links present", "github.com/omwe77" in " ".join(hrefs["social"]) and "linkedin.com" in " ".join(hrefs["social"]),
              str(hrefs["social"]))

        imgs = page.evaluate(
            """() => [...document.images].map(i => ({src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0}))
               .filter(i => !i.ok)"""
        )
        check("all images load", not imgs, str(imgs))

        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(400)
        page.keyboard.press("Tab")
        foc = page.evaluate(
            """() => {
                const el = document.activeElement;
                const cs = getComputedStyle(el);
                return {cls: el.className, outlineWidth: cs.outlineWidth};
            }"""
        )
        check("keyboard focus lands on skip link with visible outline",
              "skip-link" in foc["cls"] and foc["outlineWidth"] not in ("0px", "none"), str(foc))

        ctx.close()

        # ---------- MOBILE (coarse pointer device, 360px) ----------
        print("== Mobile 360 ==")
        galaxy = p.devices["Galaxy S9"]
        ctx = browser.new_context(**galaxy)
        ctx.add_init_script(RAF_TRACKER)
        page = ctx.new_page()
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(str(e)))
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(1200)
        m = page.evaluate(
            """() => {
                const vw = document.documentElement.clientWidth;
                return {
                    overflow: document.body.scrollWidth > vw,
                    navLinks: [...document.querySelectorAll('.site-nav a')].map(a => {
                        const r = a.getBoundingClientRect();
                        return {text: a.textContent.trim(), h: Math.round(r.height),
                                inside: r.left >= -1 && r.right <= vw + 1};
                    }),
                    contactVisible: !!document.querySelector('.contact-actions .button-light')
                };
            }"""
        )
        check("[360] no horizontal overflow", not m["overflow"], "")
        check("[360] nav links inside viewport and tap-sized (>= 40px)",
              all(li["inside"] and li["h"] >= 40 for li in m["navLinks"]), str(m["navLinks"]))
        check("[360] contact action present", m["contactVisible"], "")
        page.screenshot(path=str(SHOTS / "mobile_360.png"))
        ctx.close()

        # ---------- RECORD SHOTS ----------
        ctx, page = new_page(browser, 1440, 900)
        page.goto(BASE_URL, wait_until="networkidle")
        page.wait_for_timeout(1600)
        page.screenshot(path=str(SHOTS / "desktop_1440.png"))
        page.evaluate("document.getElementById('work').scrollIntoView()")
        page.wait_for_timeout(1400)
        page.screenshot(path=str(SHOTS / "desktop_work.png"))
        ctx.close()

        browser.close()

    check("no console/page errors across all suites", not console_errors,
          "; ".join(console_errors[:6]))

    print(json.dumps({"url": BASE_URL, "failed": failures, "console_errors": console_errors}, indent=2))
    return 1 if failures or console_errors else 0


if __name__ == "__main__":
    SHOTS.mkdir(parents=True, exist_ok=True)
    sys.exit(run())
