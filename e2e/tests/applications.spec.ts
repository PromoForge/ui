import { test, expect } from "@playwright/test";
import { loadTestState } from "../test-state";

test.describe("Applications", () => {
  test("should load and display applications in the sidebar", async ({
    page,
  }) => {
    const state = loadTestState();
    await page.goto("/");

    // Wait for the seeded application to appear (use first() since name appears in sidebar + app selector)
    await expect(page.getByText(state.applicationName).first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test("should select an application and navigate", async ({ page }) => {
    const state = loadTestState();
    await page.goto("/");

    // Wait for the app to appear
    await expect(page.getByText(state.applicationName).first()).toBeVisible({
      timeout: 30_000,
    });

    // Verify the app link exists
    await expect(
      page.locator(`a[href="/applications/${state.applicationId}"]`)
    ).toBeVisible({ timeout: 10_000 });

    // Navigate to the application's page
    await page.goto(`/applications/${state.applicationId}`);

    // Should load the application detail page
    await expect(page).toHaveURL(
      new RegExp(`/applications/${state.applicationId}`),
      { timeout: 10_000 }
    );
  });
});
