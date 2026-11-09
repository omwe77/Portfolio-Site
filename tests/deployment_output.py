"""Verify generated production or preview metadata and static routing files."""
import os
import pathlib
import sys
import xml.etree.ElementTree as ET

PUBLIC_ORIGIN = os.environ["PUBLIC_ORIGIN"].rstrip("/")
PREVIEW = len(sys.argv) > 1 and sys.argv[1] == "preview"
DIST = pathlib.Path("dist")
SLUGS = ["hamigenz", "arena", "subscription", "ecomart", "medstore", "spam"]
checks = []

def check(name, passed):
    checks.append(bool(passed))
    print(f"{'PASS' if passed else 'FAIL'} {name}")

check("built output directory exists", DIST.is_dir())
check("unrendered public case-study template is absent", not (DIST / "case-study.html").exists())
check("404 document is present", (DIST / "404.html").is_file())

pages = [("homepage", DIST / "index.html", f"{PUBLIC_ORIGIN}/")]
pages += [(slug, DIST / "projects" / slug / "index.html", f"{PUBLIC_ORIGIN}/projects/{slug}/") for slug in SLUGS]
for name, path, canonical in pages:
    html = path.read_text(encoding="utf-8") if path.exists() else ""
    check(f"{name} generated", bool(html))
    check(f"{name} canonical and og:url use PUBLIC_ORIGIN", f'<link rel="canonical" href="{canonical}">' in html and f'<meta property="og:url" content="{canonical}">' in html)
    check(f"{name} Open Graph image is absolute", f'<meta property="og:image" content="{PUBLIC_ORIGIN}/og-image.svg">' in html)
    check(f"{name} has no unresolved template tokens", "{{PUBLIC_ORIGIN}}" not in html and "{{canonical}}" not in html and "{{ogImage}}" not in html)
    check(f"{name} robots metadata matches build mode", ('<meta name="robots" content="noindex, nofollow">' in html) == PREVIEW)

sitemap_path = DIST / "sitemap.xml"
sitemap = ET.parse(sitemap_path).getroot() if sitemap_path.exists() else None
ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
locations = [node.text for node in sitemap.findall("sm:url/sm:loc", ns)] if sitemap is not None else []
expected = [f"{PUBLIC_ORIGIN}/"] + [f"{PUBLIC_ORIGIN}/projects/{slug}/" for slug in SLUGS]
check("sitemap is valid XML and lists seven canonical URLs", locations == expected)

robots_path = DIST / "robots.txt"
robots = robots_path.read_text(encoding="utf-8") if robots_path.exists() else ""
if PREVIEW:
    check("preview robots allows reading noindex and omits sitemap", "Allow: /" in robots and "Sitemap:" not in robots)
else:
    check("production robots sitemap uses PUBLIC_ORIGIN", f"Sitemap: {PUBLIC_ORIGIN}/sitemap.xml" in robots)

passed = sum(checks)
failed = len(checks) - passed
print(f"\nRESULT {passed} passed, {failed} failed, {len(checks)} checks")
sys.exit(1 if failed else 0)
