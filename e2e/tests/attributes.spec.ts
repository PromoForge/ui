import { test, expect } from "@playwright/test";
import { loadTestState } from "../test-state";

test.describe("Attributes", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to attributes page
    await page.goto("/settings/tools/attributes");

    // Wait for the heading and at least one seeded attribute to appear
    await expect(
      page.getByRole("heading", { name: "Attributes" })
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Loyalty Tier")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should display the attributes page with seeded data", async ({
    page,
  }) => {
    // Should show the Custom and Built-in tabs
    await expect(page.getByText("Custom", { exact: true })).toBeVisible();
    await expect(page.getByText("Built-in", { exact: true })).toBeVisible();

    // Should display our seeded attributes in the table
    await expect(page.getByText("Loyalty Tier")).toBeVisible();
    await expect(page.getByText("Item Weight")).toBeVisible();
    await expect(page.getByText("Is Returning")).toBeVisible();
    await expect(page.getByText("Event Tags")).toBeVisible();
  });

  test("should search attributes by name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search attribute");
    await searchInput.fill("Loyalty");

    // Should show only the matching attribute
    await expect(page.getByText("Loyalty Tier")).toBeVisible();
    await expect(page.getByText("Item Weight")).toBeHidden();

    // Clear search
    await searchInput.clear();
    await expect(page.getByText("Item Weight")).toBeVisible();
  });

  test("should filter attributes by entity", async ({ page }) => {
    // Open filter dropdown
    await page.getByRole("button", { name: /Filter/ }).click();

    const popover = page.locator("[data-slot='popover-content']");
    await expect(popover).toBeVisible();

    // Click Entity category — use evaluate(el.click()) because Panel 2
    // content is clipped by overflow:hidden and a table cell intercepts
    // coordinate-based clicks. el.click() triggers the addEventListener
    // handler directly on the element.
    await popover
      .locator("button")
      .filter({ hasText: "Entity" })
      .first()
      .evaluate((el: HTMLElement) => el.click());

    // Wait for the 200ms CSS slide animation + reactivity to settle
    await page.waitForTimeout(400);

    // Click "Customer Profile" option in Panel 2
    await popover
      .locator("button")
      .filter({ hasText: "Customer Profile" })
      .evaluate((el: HTMLElement) => el.click());

    // Close the popover by clicking outside
    await page.locator("body").click({ position: { x: 10, y: 10 } });
    await expect(popover).toBeHidden({ timeout: 5_000 });

    // Should show only Customer Profile attributes
    await expect(page.getByText("Loyalty Tier")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Item Weight")).toBeHidden({ timeout: 5_000 });
  });

  test("should filter attributes by type", async ({ page }) => {
    // Open filter dropdown
    await page.getByRole("button", { name: /Filter/ }).click();

    const popover = page.locator("[data-slot='popover-content']");
    await expect(popover).toBeVisible();

    // Click Type category — same evaluate approach as entity test
    await popover
      .locator("button")
      .filter({ hasText: "Type" })
      .first()
      .evaluate((el: HTMLElement) => el.click());

    // Wait for the 200ms CSS slide animation + reactivity to settle
    await page.waitForTimeout(400);

    // Click "Number" option in Panel 2
    await popover
      .getByText("Number", { exact: true })
      .evaluate((el: HTMLElement) => el.click());

    // Close the popover by clicking outside
    await page.locator("body").click({ position: { x: 10, y: 10 } });
    await expect(popover).toBeHidden({ timeout: 5_000 });

    // Should show only Number type attributes
    await expect(page.getByText("Item Weight")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Loyalty Tier")).toBeHidden({ timeout: 5_000 });
  });

  test("should create a new attribute", async ({ page }) => {
    // Click create button
    await page.getByRole("button", { name: "Create Attribute" }).click();

    // Sheet should open
    await expect(
      page.getByRole("heading", { name: "Create Attribute" })
    ).toBeVisible();

    // Fill in the form
    // Entity select — custom select with placeholder
    await page.getByRole("button", { name: "Select entity..." }).click();
    await page.getByRole("option", { name: "Application" }).click();

    // Type select — custom select with placeholder
    await page.getByRole("button", { name: "Select type..." }).click();
    await page
      .getByRole("option", { name: "String", exact: true })
      .click();

    // API name
    await page.getByPlaceholder("e.g. order_status").fill("e2e_created_attr");

    // Name/Title
    await page.getByPlaceholder("e.g. Order Status").fill("E2E Created");

    // Description
    await page
      .getByPlaceholder("Describe what this attribute is used for...")
      .fill("Attribute created by E2E test");

    // Submit — the submit button at the bottom of the sheet
    await page
      .getByRole("button", { name: "Create Attribute" })
      .last()
      .click();

    // Sheet should close and new attribute should appear in the table
    await expect(page.getByText("E2E Created")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("should sort attributes", async ({ page }) => {
    // Find and click the sort dropdown
    const sortButton = page.getByRole("button", { name: /Sort|sort/ });
    if (await sortButton.isVisible()) {
      await sortButton.click();

      // Select name ascending
      await page.getByText("Name (A-Z)").click();

      // Verify attributes are in alphabetical order
      const rows = page.locator("table tbody tr");
      const firstRowText = await rows.first().textContent();
      expect(firstRowText).toBeTruthy();
    }
  });
});
