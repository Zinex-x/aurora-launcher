from playwright.sync_api import sync_playwright
import os

def run_cuj(page):
    page.goto("http://localhost:5173")
    page.wait_for_timeout(2000)

    # 1. Verify Home View and Auth Enforcement (Guest state)
    page.screenshot(path="/home/jules/verification/screenshots/home_guest.png")

    # Try to quick play
    # Find first instance card play button
    play_btn = page.locator("button:has-text('Quick Play')").first
    if play_btn.is_visible():
        play_btn.click()
        page.wait_for_timeout(1000)
        # Should open settings/auth modal
        page.screenshot(path="/home/jules/verification/screenshots/auth_modal_triggered.png")

    # 2. Verify Instance Detail and Mods
    # Navigate to an instance (assuming one exists from previous step)
    instance_card = page.locator("text=Test Instance")
    if instance_card.is_visible():
        instance_card.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/screenshots/instance_detail_with_mods.png")

        # Open Mods Folder button check
        mods_folder_btn = page.get_by_text("Open Mods Folder")
        if mods_folder_btn.is_visible():
            mods_folder_btn.highlight()
            page.wait_for_timeout(500)

    # 3. Verify Instance Settings RAM Slider
    settings_btn = page.locator("button.bg-secondary, button:has(svg.size-7)") # Settings button in DetailView
    if settings_btn.is_visible():
        settings_btn.click()
        page.wait_for_timeout(1000)
        page.get_by_text("Memory").click()
        page.wait_for_timeout(1000)
        page.screenshot(path="/home/jules/verification/screenshots/ram_slider_active.png")

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
