import { test, expect } from "@playwright/test";

test.describe("Webhooks", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/tools/webhooks");
    await expect(
      page.getByRole("heading", { name: "Webhooks" })
    ).toBeVisible({ timeout: 15_000 });
    // Wait for seeded webhook to appear
    await expect(page.getByText("E2E Test Webhook")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should display the webhooks page with seeded data", async ({
    page,
  }) => {
    await expect(page.getByText("E2E Test Webhook")).toBeVisible();
    await expect(page.getByText("E2E Editable Webhook")).toBeVisible();

    // Verify table columns
    const table = page.locator("table");
    await expect(table.getByText("Name")).toBeVisible();
    await expect(table.getByText("Verb")).toBeVisible();
    await expect(table.getByText("Applications")).toBeVisible();
    await expect(table.getByText("Copy")).toBeVisible();

    // Verify verb display
    await expect(table.getByText("POST").first()).toBeVisible();
  });

  test("should create a new webhook", async ({ page }) => {
    await page.getByRole("button", { name: "Create Webhook" }).click();

    // Verify sheet opened with intro text
    await expect(
      page.getByText("Create a webhook to send information")
    ).toBeVisible();

    // Fill name
    const nameInput = page
      .getByRole("dialog")
      .locator("input")
      .first();
    await nameInput.fill("E2E Created Webhook");

    // Fill URL
    const urlInput = page
      .getByRole("dialog")
      .locator('input[placeholder="https://example.com/webhook"]');
    await urlInput.fill("https://httpbin.org/post");

    // Submit
    const createPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/webhooks") && req.method() === "POST"
    );
    await page
      .getByRole("button", { name: "Create Webhook" })
      .last()
      .click();

    await createPromise;

    // Should appear in the table
    await expect(page.getByText("E2E Created Webhook")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should edit a webhook", async ({ page }) => {
    // Click webhook name to open edit sheet
    await page.getByText("E2E Editable Webhook").click();

    await expect(
      page.getByText("Edit the request details and payload")
    ).toBeVisible();

    const updatePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/webhooks/") && req.method() === "PUT"
    );

    // Change name
    const nameInput = page
      .getByRole("dialog")
      .locator("input")
      .first();
    await nameInput.clear();
    await nameInput.fill("Updated Webhook");

    await page.getByRole("button", { name: "Save" }).click();
    await updatePromise;

    await expect(page.getByText("Updated Webhook")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should copy a webhook", async ({ page }) => {
    // Find the row with "E2E Test Webhook" and click its copy button
    const row = page.locator("table tbody tr", {
      has: page.getByText("E2E Test Webhook"),
    });

    const copyPromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/webhooks") && req.method() === "POST"
    );

    await row.locator("button").last().click();
    await copyPromise;

    await expect(
      page.getByText("E2E Test Webhook (Copy)")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should delete a webhook", async ({ page }) => {
    await expect(page.getByText("Updated Webhook")).toBeVisible();

    // Click webhook name to edit
    await page.getByText("Updated Webhook").click();

    await expect(
      page.getByText("Edit the request details and payload")
    ).toBeVisible();

    // Scroll to and click Delete
    const sheetDeleteButton = page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete Webhook" });
    await sheetDeleteButton.scrollIntoViewIfNeeded();
    await sheetDeleteButton.click();

    // Confirm in dialog
    const dialog = page.getByRole("dialog", { name: "Delete Webhook" });
    await expect(dialog).toBeVisible();

    const deletePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/webhooks/") &&
        req.method() === "DELETE"
    );

    await dialog.getByRole("button", { name: "Delete Webhook" }).click();
    await deletePromise;

    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(page.getByText("Updated Webhook")).toBeHidden({
      timeout: 10_000,
    });
  });

  test("should filter webhooks by search", async ({ page }) => {
    const searchInput = page.getByPlaceholder(
      "Webhook or integration name"
    );
    await searchInput.fill("E2E Test");

    // Should show "E2E Test Webhook" but not unrelated webhooks
    await expect(page.getByText("E2E Test Webhook")).toBeVisible();
    // Clear and search for something that doesn't exist
    await searchInput.clear();
    await searchInput.fill("nonexistent-webhook-xyz");
    await expect(page.getByText("No webhooks found.")).toBeVisible();
  });
});
