"""Portfolio V2 release regression, desktop/tablet/mobile, using Chromium."""
import pathlib
import os
import sys
import tempfile
import xml.etree.ElementTree as ET
from playwright.sync_api import sync_playwright

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3000"
PUBLIC_ORIGIN = os.environ["PUBLIC_ORIGIN"].rstrip("/")
EXPECT_PREVIEW = os.environ.get("EXPECT_PREVIEW") == "1"
SCREENSHOTS = pathlib.Path(os.environ.get(
    "PORTFOLIO_SCREENSHOT_DIR",
    pathlib.Path(tempfile.gettempdir()) / "portfolio-v2-regression",
))
results = []
console_errors = []
page_errors = []

def check(name, passed, detail=""):
    results.append((name, bool(passed)))
    print(f"{'PASS' if passed else 'FAIL'} {name}" + (f": {detail}" if detail else ""))

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    for width, height, label in [(1440, 900, "1440"), (1024, 900, "1024"), (390, 844, "390"), (360, 800, "360")]:
        context = browser.new_context(viewport={"width": width, "height": height})
        page = context.new_page()
        page.on("console", lambda message: console_errors.append(f"{message.text} @ {message.location.get('url', 'unknown')}") if message.type == "error" else None)
        page.on("pageerror", lambda error: page_errors.append(str(error)))
        response = page.goto(BASE_URL, wait_until="networkidle")
        check(f"{label}px homepage HTTP 200", response.status == 200)
        check(f"{label}px homepage canonical and Open Graph URLs", page.locator("link[rel=canonical]").get_attribute("href") == f"{PUBLIC_ORIGIN}/" and page.locator("meta[property='og:url']").get_attribute("content") == f"{PUBLIC_ORIGIN}/" and page.locator("meta[property='og:image']").get_attribute("content") == f"{PUBLIC_ORIGIN}/og-image.svg")
        check(f"{label}px preview indexing policy", (page.locator("meta[name='robots']").get_attribute("content") == "noindex, nofollow") if EXPECT_PREVIEW else page.locator("meta[name='robots']").count() == 0)
        hidden_template = page.request.get(f"{BASE_URL}/case-study.html")
        check(f"{label}px private case-study template returns 404", hidden_template.status == 404)
        if width == 1440:
            sitemap_response = page.request.get(f"{BASE_URL}/sitemap.xml")
            robots_response = page.request.get(f"{BASE_URL}/robots.txt")
            sitemap_root = ET.fromstring(sitemap_response.text())
            locations = [node.text for node in sitemap_root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
            expected_locations = [f"{PUBLIC_ORIGIN}/"] + [f"{PUBLIC_ORIGIN}/projects/{slug}/" for slug in ["hamigenz", "arena", "subscription", "ecomart", "medstore", "spam"]]
            check("sitemap is valid XML with seven canonical URLs", sitemap_response.status == 200 and sitemap_response.headers.get("content-type", "").startswith("application/xml") and locations == expected_locations)
            robots_text = robots_response.text()
            if EXPECT_PREVIEW:
                check("preview robots permits reading noindex metadata and has no sitemap", robots_response.status == 200 and "Allow: /" in robots_text and "Sitemap:" not in robots_text)
            else:
                check("robots sitemap URL uses PUBLIC_ORIGIN", robots_response.status == 200 and robots_response.headers.get("content-type", "").startswith("text/plain") and f"Sitemap: {PUBLIC_ORIGIN}/sitemap.xml" in robots_text)
            check("LinkedIn destination matches the existing profile record", page.locator("a[href^='https://www.linkedin.com/in/']").count() == 1 and page.locator("a[href^='https://www.linkedin.com/in/']").get_attribute("href") == "https://www.linkedin.com/in/om-dangol-0a39243a7/")
        check(f"{label}px no horizontal overflow", page.evaluate("document.documentElement.scrollWidth === document.documentElement.clientWidth"))
        text_boxes = page.locator(".hero h1,.intro,.heading h2,.copy h3").evaluate_all("els => els.map(e => ({text:e.innerText, client:e.clientWidth, scroll:e.scrollWidth, right:e.getBoundingClientRect().right}))")
        check(f"{label}px key text fits its box", all(e["scroll"] <= e["client"] + 1 and e["right"] <= width + 1 for e in text_boxes), str(text_boxes))
        if width == 1440:
            role_motion = page.locator(".role-words").evaluate("el => { const animation=el.getAnimations()[0]; const active=getComputedStyle(el).animationName==='role-scroll' && getComputedStyle(el).animationPlayState==='running'; if(!animation)return {active,moved:false,count:el.children.length}; animation.currentTime=3500; const moved=getComputedStyle(el).transform!=='none' && getComputedStyle(el).transform!=='matrix(1, 0, 0, 1, 0, 0)'; animation.currentTime=0; return {active,moved,count:el.children.length}; }")
            check("hero phrases scroll smoothly while visible", role_motion["active"] and role_motion["moved"] and role_motion["count"] == 5, str(role_motion))
            page.locator("#work").scroll_into_view_if_needed()
            page.wait_for_function("document.querySelector('.project.motion-reveal.is-visible') !== null")
            check("project cards reveal when scrolled into view", page.locator(".project.motion-reveal.is-visible").count() > 0)
            hovered = page.locator(".project").first
            hovered.hover()
            page.wait_for_timeout(250)
            hover_state = hovered.evaluate("e => ({card:getComputedStyle(e).transform, image:getComputedStyle(e.querySelector('.media img')).transform})")
            identity_transform = "matrix(1, 0, 0, 1, 0, 0)"
            check("project hover moves card and image", hover_state["card"] not in ("none", identity_transform) and hover_state["image"] not in ("none", identity_transform), str(hover_state))
            discipline_card = page.locator(".door").first
            discipline_card.hover()
            page.wait_for_timeout(500)
            discipline_motion = discipline_card.evaluate("e => ({card:getComputedStyle(e.querySelector('.door-in')).transform, trace:getComputedStyle(e.querySelector('.door-art .trace')).opacity, route:parseFloat(getComputedStyle(e.querySelector('.door-art .trace')).strokeDashoffset)})")
            check("discipline card hover draws its route", discipline_motion["card"] not in ("none", identity_transform) and discipline_motion["trace"] == "1" and discipline_motion["route"] == 0, str(discipline_motion))
            page.mouse.move(0, 0)
            anchor_targets = page.locator("a[href^='#']").evaluate_all("links => links.map(link => !!document.querySelector(link.getAttribute('href')))")
            check("all in-page links target existing sections", all(anchor_targets))
            for selector, action_label, target in [("a.button[href='#work']", "Explore my work", "#work"), (".hero .actions a[href='#contact']", "Get in touch", "#contact"), ("footer a[href='#top']", "Back to top", "#top")]:
                page.locator(selector).click()
                check(f"{action_label} button navigates to {target}", page.evaluate("target => location.hash === target && Boolean(document.querySelector(target))", target))
        check(f"{label}px all six projects present", page.locator(".project").count() == 6)
        check(f"{label}px all four category doors present", page.locator(".door").count() == 4)
        if width == 1440:
            check("education timeline shows 2025 and expects December 2028", "2025 · expected December 2028" in page.locator("#journey").inner_text() and "After Dashain" not in page.locator("#journey").inner_text() and "2024" not in page.locator("#journey").inner_text())
        page.locator("img").evaluate_all("images => images.forEach(image => { image.loading = 'eager'; })")
        page.wait_for_function("Array.from(document.images).every(image => image.complete)")
        door_audit = page.locator(".door").evaluate_all("doors => { const rgb=s=>{const v=s.match(/[\\d.]+/g).slice(0,3).map(Number);return s.startsWith('color(srgb')?v.map(n=>n*255):v}; const lum=c=>{const v=c.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2]}; const score=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}; const backgrounds=doors.map(d=>rgb(getComputedStyle(d.querySelector('.door-in')).backgroundColor)); return {ratios:doors.map((d,i)=>score(rgb(getComputedStyle(d.querySelector('strong')).color),backgrounds[i])),codeRatios:doors.map((d,i)=>score(rgb(getComputedStyle(d.querySelector('.door-code')).color),backgrounds[i])),countRatios:doors.map((d,i)=>score(rgb(getComputedStyle(d.querySelector('.door-count')).color),backgrounds[i])),small:Math.min(...doors.map(d=>parseFloat(getComputedStyle(d.querySelector('.door-count')).fontSize))),title:Math.min(...doors.map(d=>parseFloat(getComputedStyle(d.querySelector('strong')).fontSize))),artwork:doors.every(d=>d.querySelector('.door-art svg'))}; }")
        check(f"{label}px category cards meet contrast, type sizing and artwork checks", min(door_audit["ratios"] + door_audit["codeRatios"] + door_audit["countRatios"]) >= 4.5 and door_audit["small"] >= 12 and door_audit["title"] >= (17 if width <= 480 else 20) and door_audit["artwork"], str(door_audit))
        image_status = page.locator("img").evaluate_all("imgs => imgs.map(i => ({src: i.getAttribute('src'), currentSrc: i.currentSrc, complete: i.complete, naturalWidth: i.naturalWidth}))")
        check(f"{label}px portrait and screenshots load", len(image_status) == 6 and all(i["complete"] and i["naturalWidth"] > 0 for i in image_status), str(image_status))
        SCREENSHOTS.mkdir(parents=True, exist_ok=True)

        for category, count in [("AI & ML", 2), ("Web", 2), ("Software", 2), ("All", 6)]:
            page.locator(f".filter[data-filter='{category}']").click()
            check(f"{label}px {category} filter count {count}", page.locator(".project:not([hidden])").count() == count)
        for door, count in [(0, 2), (1, 2), (2, 2), (3, 2)]:
            selected_door = page.locator(".door").nth(door)
            selected_door.click()
            check(f"{label}px door {door + 1} filters projects", page.locator(".project:not([hidden])").count() == count)
            check(f"{label}px door {door + 1} exposes active filter state", selected_door.get_attribute("aria-pressed") == "true")

        project_data = [
            ("hamigenz", "hamiGenZ"), ("arena", "Arena_Core"),
            ("subscription", "AI Subscription Management"), ("ecomart", "EcoMart"),
            ("medstore", "MedStore"), ("spam", "Spam Email Classifier")
        ]
        for slug, title in project_data:
            page.locator(f"button[data-open='{slug}']").click()
            check(f"{label}px {title} dialog opens", page.locator("#dialog").evaluate("d => d.open"))
            route_link = page.locator("#dialog #case-route")
            check(f"{label}px {title} has deep link", route_link.get_attribute("href") == f"/projects/{slug}/")
            page.locator("#close").click()
            route_response = page.goto(f"{BASE_URL}/projects/{slug}/", wait_until="networkidle")
            check(f"{label}px {title} route HTTP 200", route_response.status == 200)
            check(f"{label}px {title} route has skip link", page.locator(".skip[href='#main']").count() == 1 and page.locator("main#main").count() == 1)
            headings = page.locator("h2").all_text_contents()
            check(f"{label}px {title} route server-rendered", page.locator("h1").inner_text() == title and all(section in headings for section in ["Problem", "Approach", "Architecture & technologies", "Results", "Challenges & limitations"]))
            section_copy = page.locator("h2 + p").all_text_contents()
            check(f"{label}px {title} has complete case-study detail", len(section_copy) == 5 and all(len(text.strip()) >= 45 for text in section_copy) and page.locator(".facts span").count() >= 3 and "{{" not in page.locator("main").inner_text())
            check(f"{label}px {title} SEO title and canonical", page.title() == f"{title} — Case Study | Om Dangol" and page.locator("link[rel=canonical]").get_attribute("href").endswith(f"/projects/{slug}/"))
            route_canonical = f"{PUBLIC_ORIGIN}/projects/{slug}/"
            check(f"{label}px {title} canonical and Open Graph URLs", page.locator("link[rel=canonical]").get_attribute("href") == route_canonical and page.locator("meta[property='og:url']").get_attribute("content") == route_canonical and page.locator("meta[property='og:image']").get_attribute("content") == f"{PUBLIC_ORIGIN}/og-image.svg")
            check(f"{label}px {title} preview noindex", (page.locator("meta[name='robots']").get_attribute("content") == "noindex, nofollow") if EXPECT_PREVIEW else page.locator("meta[name='robots']").count() == 0)
            check(f"{label}px {title} repository href present", page.locator("a[href^='https://github.com/omwe77/']").count() == 1)
            page.goto(BASE_URL, wait_until="networkidle")

        dark_surface = page.locator("body").evaluate("b => getComputedStyle(b).backgroundColor")
        page.locator("#theme").click()
        light_surface = page.locator("body").evaluate("b => getComputedStyle(b).backgroundColor")
        check(f"{label}px theme switches to light", page.locator("body").evaluate("b => b.classList.contains('light')") and dark_surface != light_surface)
        if width == 1440:
            page.screenshot(path=str(SCREENSHOTS / "light-1440.png"), full_page=True)
        page.locator("#theme").click()
        check(f"{label}px theme switches back to dark", not page.locator("body").evaluate("b => b.classList.contains('light')"))

        if width <= 800:
            page.locator("#menu").click()
            visible_menu = page.locator("#menu").evaluate("e => { const r=e.getBoundingClientRect(); return getComputedStyle(e).display !== 'none' && r.width >= 44 && r.height >= 44 }")
            check(f"{label}px mobile menu control is visible and touch-sized", visible_menu)
            menu_open = page.locator("#nav").evaluate("n => n.classList.contains('open')")
            menu_label = page.locator("#menu").get_attribute("aria-label")
            check(f"{label}px mobile menu opens", menu_open and menu_label == "Close navigation menu", f"open={menu_open}, label={menu_label}")
            page.keyboard.press("Escape")
            check(f"{label}px Escape closes mobile menu", not page.locator("#nav").evaluate("n => n.classList.contains('open')") and page.locator("#menu").get_attribute("aria-expanded") == "false" and page.locator("#menu").get_attribute("aria-label") == "Open navigation menu")
            page.locator("#menu").click()
            page.locator("#nav a[href='#work']").click()
            check(f"{label}px navigation link closes menu and resets ARIA state", not page.locator("#nav").evaluate("n => n.classList.contains('open')") and page.locator("#menu").get_attribute("aria-expanded") == "false" and page.locator("#menu").get_attribute("aria-label") == "Open navigation menu")
        page.goto(BASE_URL, wait_until="networkidle")
        page.keyboard.press("Tab")
        focus = page.evaluate("({skip: document.activeElement.classList.contains('skip'), outline: getComputedStyle(document.activeElement).outlineWidth})")
        check(f"{label}px keyboard skip link and visible focus", focus["skip"] and focus["outline"] == "3px")

        if width == 1440:
            email_link = page.locator("#contact .actions a.button.primary")
            email_href = email_link.get_attribute("href")
            check("Email Om opens a Gmail compose addressed to Om", email_href == "https://mail.google.com/mail/?view=cm&fs=1&to=omdangol68%40gmail.com" and email_link.get_attribute("target") == "_blank" and "noopener" in email_link.get_attribute("rel"))
            check("removed contact form has no button or dialog", page.locator("#form-open, #form-dialog, #form").count() == 0)
        # Scroll through the page so each viewport-aware reveal is exercised before capture.
        page.evaluate("""async () => { const step=Math.max(220,innerHeight*.7); for(let y=0;y<document.documentElement.scrollHeight;y+=step){scrollTo({top:y,behavior:'instant'});await new Promise(resolve=>setTimeout(resolve,60));} scrollTo({top:0,behavior:'instant'}); }""")
        page.wait_for_timeout(700)
        check(f"{label}px scroll reveals finish visibly", page.locator(".motion-reveal:not(.is-visible)").count() == 0)
        page.evaluate("document.activeElement instanceof HTMLElement && document.activeElement.blur()")
        check(f"{label}px project content remains visible without scroll scripting", page.locator(".project").first.evaluate("e => getComputedStyle(e).opacity") == "1")
        page.screenshot(path=str(SCREENSHOTS / f"v2-{label}.png"), full_page=True)
        context.close()

    reduced = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    page = reduced.new_page()
    page.goto(BASE_URL, wait_until="networkidle")
    role_state = page.locator(".role-window").evaluate("e => ({animation:getComputedStyle(e.querySelector('.role-words')).animationName,animations:e.querySelector('.role-words').getAnimations().length,visible:e.getBoundingClientRect().height>0})")
    page.wait_for_timeout(3300)
    check("reduced-motion disables auto-scrolling hero phrases", role_state["animation"] == "none" and role_state["animations"] == 0 and role_state["visible"])
    check("reduced-motion leaves reveal content visible", page.locator(".project").first.evaluate("e => getComputedStyle(e).opacity") == "1")
    reduced_door = page.locator(".door").first.evaluate("e => ({transition:getComputedStyle(e.querySelector('.door-in')).transitionDuration,trace:getComputedStyle(e.querySelector('.door-art .trace')).opacity})")
    check("reduced-motion removes card movement and keeps diagrams complete", reduced_door["transition"] == "0s" and reduced_door["trace"] == "1", str(reduced_door))
    reduced.close()
    browser.close()

check("no browser console errors", len(console_errors) == 0, "; ".join(console_errors[:4]))
check("no uncaught runtime errors", len(page_errors) == 0, "; ".join(page_errors[:4]))
passed = sum(ok for _, ok in results)
failed = len(results) - passed
print(f"\nRESULT {passed} passed, {failed} failed, {len(results)} checks")
sys.exit(1 if failed else 0)
