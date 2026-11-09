import asyncio
import json
import os
from playwright.async_api import async_playwright

PUBLIC_ORIGIN = os.environ["PUBLIC_ORIGIN"].rstrip("/")

async def inspect():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto(PUBLIC_ORIGIN, wait_until="networkidle")
        await page.screenshot(path="prod_full.png", full_page=True)
        
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text()) if msg.type() == "error" else None)
        
        body = await page.evaluate("() => ({
            scrollWidth: document.body.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            scrollHeight: document.body.scrollHeight
        })")
        print("Body dimensions:", json.dumps(body, indent=2))
        print("Console errors:", console_errors)
        
        await browser.close()

asyncio.run(inspect())
