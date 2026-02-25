import { test, expect } from "@playwright/test";
import { loadTestState } from "../test-state";

test.describe("Applications", () => {
  test("should load and display applications in the sidebar", async ({
    page,
  }) => {
    await page.goto("/");

    // Wait for the app to initialize and load applications
    // The sidebar has a "SELECT APPLICATION" label above the app selector
    await expect(page.getByText("SELECT APPLICATION")).toBeVisible({
      timeout: 15_000,
    });

    // The seeded application should appear in the selector or be auto-selected
    const state = loadTestState();

    // Open the app selector dropdown
    // Fallback: find by the "SELECT APPLICATION" label and click the button near it
    const selectorTrigger = page
      .getByText("SELECT APPLICATION")
      .locator("..")
      .locator("button")
      .first();
    await selectorTrigger.click();

    // The dropdown should show our test app
    await expect(page.getByText(state.applicationName)).toBeVisible();
  });

  test("should select an application and navigate", async ({ page }) => {
    const state = loadTestState();
    await page.goto("/");

    // Wait for apps to load
    await expect(page.getByText("SELECT APPLICATION")).toBeVisible({
      timeout: 15_000,
    });

    // Open selector and click our test app
    const selectorTrigger = page
      .getByText("SELECT APPLICATION")
      .locator("..")
      .locator("button")
      .first();
    await selectorTrigger.click();
    await page.getByText(state.applicationName).click();

    // Should navigate to the application's page
    await expect(page).toHaveURL(
      new RegExp(`/applications/${state.applicationId}`)
    );
  });
});
