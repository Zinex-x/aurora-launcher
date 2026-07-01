from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:5173")
    page.wait_for_timeout(2000)

    # Wait for the instance card and click it
    instance_card = page.locator("text=Test Instance")
    instance_card.wait_for(state="visible")
    instance_card.click()
    page.wait_for_timeout(1000)

    # Verify Detail View
    page.screenshot(path="/home/jules/verification/screenshots/instance_detail_v2.png")

    # Click Settings
    settings_btn = page.locator("button.bg-secondary")
    settings_btn.click()
    page.wait_for_timeout(1000)

    # Verify Settings Modal
    page.screenshot(path="/home/jules/verification/screenshots/instance_settings_modal_v2.png")

    # Click Memory Tab
    page.get_by_text("Память").click() # or Memory
    page.wait_for_timeout(1000)
    page.screenshot(path="/home/jules/verification/screenshots/instance_settings_memory_v2.png")

    # Close modal by clicking outside
    page.mouse.click(10, 10)
    page.wait_for_timeout(1000)

    # Verify Play/Close button toggle (Mocking launch)
    # Since I can't easily trigger the IPC in the browser without Electron,
    # I'll just verify the UI structure for now.
    # The logic is there in the code.

    page.wait_for_timeout(1000)

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
