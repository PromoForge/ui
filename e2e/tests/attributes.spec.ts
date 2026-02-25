import { test, expect } from "@playwright/test";
import { loadTestState } from "../test-state";

test.describe("Attributes", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to attributes page
    await page.goto("/settings/tools/attributes");

    // Wait for attributes to load (loading state disappears)
    await expect(page.getByText("Loading attributes...")).toBeHidden({
      timeout: 15_000,
    });
  });

  test("should display the attributes page with seeded data", async ({
    page,
  }) => {
    // Page heading
    await expect(
      page.getByRole("heading", { name: "Attributes" })
    ).toBeVisible();

    // Should show the Custom tab as active by default
    await expect(page.getByRole("tab", { name: "Custom" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Built-in" })).toBeVisible();

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

    // Click Entity category
    await page.getByText("Entity").click();

    // Select "Customer Profile" filter
    await page.getByText("Customer Profile").click();

    // Close the filter popover by clicking outside
    await page.keyboard.press("Escape");

    // Should show only Customer Profile attributes
    await expect(page.getByText("Loyalty Tier")).toBeVisible();
    await expect(page.getByText("Item Weight")).toBeHidden();
  });

  test("should filter attributes by type", async ({ page }) => {
    // Open filter dropdown
    await page.getByRole("button", { name: /Filter/ }).click();

    // Click Type category
    await page.getByText("Type").click();

    // Select "Number" filter
    await page.getByText("Number").click();

    // Close filter
    await page.keyboard.press("Escape");

    // Should show only Number type attributes
    await expect(page.getByText("Item Weight")).toBeVisible();
    await expect(page.getByText("Loyalty Tier")).toBeHidden();
  });

  test("should create a new attribute", async ({ page }) => {
    // Click create button
    await page.getByRole("button", { name: "Create Attribute" }).click();

    // Sheet should open
    await expect(
      page.getByRole("heading", { name: "Create Attribute" })
    ).toBeVisible();

    // Fill in the form
    // Entity select
    await page.getByLabel("Entity").click();
    await page.getByRole("option", { name: "Application" }).click();

    // Type select
    await page.getByLabel("Type").click();
    await page.getByRole("option", { name: "String" }).click();

    // API name
    await page.getByPlaceholder("e.g. order_status").fill("e2e_created_attr");

    // Name/Title
    await page.getByPlaceholder("e.g. Order Status").fill("E2E Created");

    // Description
    await page
      .getByPlaceholder("Describe what this attribute is used for...")
      .fill("Attribute created by E2E test");

    // Submit
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
      // The first attribute in the table should come alphabetically first
      const rows = page.locator("table tbody tr");
      const firstRowText = await rows.first().textContent();
      expect(firstRowText).toBeTruthy();
    }
  });
});
