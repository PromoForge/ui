import { test, expect } from "@playwright/test";

test.describe("Custom Effects", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/tools/custom-effects");
    await expect(
      page.getByRole("heading", { name: "Custom Effects" })
    ).toBeVisible({ timeout: 15_000 });
    // Wait for seeded effect to appear
    await expect(
      page.getByText("E2E Strikethrough Effect")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should display the custom effects list with seeded data", async ({
    page,
  }) => {
    await expect(page.getByText("E2E Strikethrough Effect")).toBeVisible();
    await expect(page.getByText("E2E Editable Effect")).toBeVisible();

    // Verify table columns
    const table = page.locator("table");
    await expect(table.getByText("ID")).toBeVisible();
    await expect(table.getByText("Title")).toBeVisible();
    await expect(table.getByText("Applications")).toBeVisible();
    await expect(table.getByText("Scope")).toBeVisible();

    // Verify scope display
    await expect(table.getByText("Item").first()).toBeVisible();
    await expect(table.getByText("Cart (Session)").first()).toBeVisible();

    // Verify API name appears as secondary text
    await expect(table.getByText("e2e_strikethrough")).toBeVisible();
  });

  test("should filter custom effects by search", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Name or Description");
    await searchInput.fill("Strikethrough");

    await expect(page.getByText("E2E Strikethrough Effect")).toBeVisible();

    // Clear and search for nonexistent
    await searchInput.clear();
    await searchInput.fill("nonexistent-effect-xyz");
    await expect(page.getByText("No custom effects found.")).toBeVisible();
  });

  test("should create a new custom effect", async ({ page }) => {
    await page.getByRole("link", { name: "Create Custom Effect" }).click();
    await expect(page).toHaveURL(/\/custom-effects\/new/, { timeout: 10_000 });

    // Verify warning banner
    await expect(
      page.getByText("The custom effect scope cannot be changed")
    ).toBeVisible();

    // Fill API name
    await page.getByLabel("API name").fill("e2e_created_effect");

    // Fill Rule Builder name
    await page.getByLabel("Rule Builder name").fill("E2E Created Effect");

    // Fill description
    await page.getByLabel("Custom effect description").fill("Created by E2E test");

    // Select the test application (click the unselected app in the dropdown)
    const appButton = page.locator("button").filter({ hasText: /^e2e-test-app-/ });
    await appButton.click();

    // Type a valid JSON payload into CodeMirror
    const cmEditor = page.locator(".cm-content");
    await cmEditor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.type('{"created": true}');

    // Submit and wait for successful response
    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/custom_effects") &&
        res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Create", exact: true }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Should navigate back to list
    await expect(page).toHaveURL(/\/custom-effects$/, { timeout: 10_000 });
    await expect(page.getByText("E2E Created Effect")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should delete a custom effect", async ({ page }) => {
    await page.getByText("E2E Editable Effect").first().click();
    await expect(page).toHaveURL(/\/custom-effects\/\d+/, { timeout: 10_000 });

    // Click Delete
    await page.getByRole("button", { name: "Delete Custom Effect" }).click();

    // Confirm in dialog
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/custom_effects/") &&
        res.request().method() === "DELETE"
    );

    await dialog
      .getByRole("button", { name: "Delete Custom Effect" })
      .click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Should navigate back to list
    await expect(page).toHaveURL(/\/custom-effects$/, { timeout: 10_000 });
    await expect(page.getByText("E2E Editable Effect")).toBeHidden({
      timeout: 10_000,
    });
  });

  test("should edit a custom effect", async ({ page }) => {
    await page.getByText("E2E Strikethrough Effect").first().click();
    await expect(page).toHaveURL(/\/custom-effects\/\d+/, { timeout: 10_000 });

    // Verify breadcrumb
    const breadcrumb = page.locator("nav");
    await expect(breadcrumb.getByText("Custom Effects")).toBeVisible();

    // Change Rule Builder name
    const nameInput = page.getByLabel("Rule Builder name");
    await nameInput.clear();
    await nameInput.fill("Updated Strikethrough");

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/v1/custom_effects/") &&
        res.request().method() === "PUT"
    );

    await page.getByRole("button", { name: "Save", exact: true }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(200);

    // Navigate back and verify
    await page.goto("/settings/tools/custom-effects");
    await expect(page.getByText("Updated Strikethrough")).toBeVisible({
      timeout: 10_000,
    });
  });
});
