from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:5173")
    page.wait_for_timeout(2000)

    # Verify Instance settings again
    instance_card = page.locator("text=Test Instance")
    if instance_card.is_visible():
        instance_card.click()
        page.wait_for_timeout(1000)

        settings_btn = page.locator("button:has(svg.size-7)")
        if settings_btn.is_visible():
            settings_btn.click()
            page.wait_for_timeout(1000)
            page.get_by_text("Memory").click()
            page.wait_for_timeout(1000)
            page.screenshot(path="/home/jules/verification/screenshots/ram_settings_v3.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
