import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('verify instance details and settings', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');

  // Wait for the instance to be loaded from the real filesystem (we created it earlier)
  // Or at least wait for the loading to finish
  await page.waitForTimeout(2000);

  // Check if "Test Instance" is visible
  const instanceCard = page.locator('text=Test Instance');
  await expect(instanceCard).toBeVisible();

  // Click on the instance card
  await instanceCard.click();

  // Verify we are on the instance detail view
  await expect(page.locator('h1:has-text("Test Instance")')).toBeVisible();

  // Verify Play button and Settings button are present
  const playButton = page.locator('button:has-text("Играть"), button:has-text("Play")');
  await expect(playButton).toBeVisible();

  const settingsButton = page.locator('button.bg-secondary'); // The settings button we added
  await expect(settingsButton).toBeVisible();

  // Take screenshot of detail view
  await page.screenshot({ path: 'verification/screenshots/instance_detail.png' });

  // Open Instance Settings
  await settingsButton.click();

  // Verify Modal is open
  await expect(page.locator('text=Настройки сборки'), page.locator('text=Instance Settings')).toBeVisible();

  // Verify Memory tab
  await page.locator('text=Память, text=Memory').click();
  await expect(page.locator('input[type="range"]')).toBeVisible();

  // Take screenshot of instance settings
  await page.screenshot({ path: 'verification/screenshots/instance_settings_modal.png' });

  // Close modal by clicking outside (on the backdrop)
  // The backdrop is the first div child of the Portal/fixed overlay
  await page.mouse.click(10, 10);

  // Verify Modal is closed
  await expect(page.locator('text=Настройки сборки')).not.toBeVisible();
});
