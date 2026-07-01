from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173")
    page.wait_for_timeout(3000)
    # Check what is rendered
    page.screenshot(path="/home/jules/verification/screenshots/debug_render.png")
    print("Body content:", page.inner_text("body")[:200])
    browser.close()
