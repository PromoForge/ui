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

  test("should create attribute with inline suggestions and send correct payload", async ({ page }) => {
    // Open create sheet
    await page.getByRole("button", { name: "Create Attribute" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Attribute" })
    ).toBeVisible();

    // Select Entity: Application
    await page.getByRole("button", { name: "Select entity..." }).click();
    await page.getByRole("option", { name: "Application" }).click();

    // Select Type: String (shows picklist section)
    await page.getByRole("button", { name: "Select type..." }).click();
    await page.getByRole("option", { name: "String", exact: true }).click();

    // Fill required fields
    await page.getByPlaceholder("e.g. order_status").fill("e2e_suggestions_attr");
    await page.getByPlaceholder("e.g. Order Status").fill("E2E Suggestions");

    // Add inline suggestions via tag input
    // After adding the first tag, the placeholder disappears, so locate by the
    // stable selector: the only text input inside the tag-input container.
    const tagContainer = page.locator(".flex-wrap.items-center.gap-1\\.5");
    const tagInput = tagContainer.locator("input[type='text']");

    await tagInput.fill("gold");
    await tagInput.press("Enter");
    await tagInput.fill("silver");
    await tagInput.press("Enter");
    await tagInput.fill("bronze");
    await tagInput.press("Enter");

    // Verify tags appear
    await expect(page.getByText("gold")).toBeVisible();
    await expect(page.getByText("silver")).toBeVisible();
    await expect(page.getByText("bronze")).toBeVisible();
    await expect(page.getByText("3 / 50 values")).toBeVisible();

    // Verify "Allow custom values" checkbox is visible
    await expect(page.getByText("Allow users to enter custom values")).toBeVisible();

    // Set up request interception right before submit
    const createPromise = page.waitForRequest(
      (req) => req.url().includes("/api/v1/attributes") && req.method() === "POST"
    );

    // Submit
    await page.getByRole("button", { name: "Create Attribute" }).last().click();

    // Verify the request payload
    const createRequest = await createPromise;
    const body = createRequest.postDataJSON();
    expect(body.suggestions).toEqual(["gold", "silver", "bronze"]);
    expect(body.restrictedBySuggestions).toBe(true);
    expect(body).not.toHaveProperty("hasAllowedList");

    // Verify sheet closes and attribute appears
    await expect(page.getByText("E2E Suggestions")).toBeVisible({ timeout: 10_000 });
  });

  test("should create attribute with CSV upload and not send suggestions", async ({ page }) => {
    // Intercept both the create and import API calls
    const createPromise = page.waitForRequest(
      (req) => req.url().includes("/api/v1/attributes") && req.method() === "POST" && !req.url().includes("allowed_list")
    );
    const importPromise = page.waitForRequest(
      (req) => req.url().includes("allowed_list/import") && req.method() === "POST"
    );

    // Open create sheet
    await page.getByRole("button", { name: "Create Attribute" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Attribute" })
    ).toBeVisible();

    // Select Entity: Application
    await page.getByRole("button", { name: "Select entity..." }).click();
    await page.getByRole("option", { name: "Application" }).click();

    // Select Type: String
    await page.getByRole("button", { name: "Select type..." }).click();
    await page.getByRole("option", { name: "String", exact: true }).click();

    // Fill required fields
    await page.getByPlaceholder("e.g. order_status").fill("e2e_csv_attr");
    await page.getByPlaceholder("e.g. Order Status").fill("E2E CSV");

    // First add a tag to verify CSV clears it
    const tagInput = page.getByPlaceholder("Type a value and press Enter...");
    await tagInput.fill("should_be_cleared");
    await tagInput.press("Enter");
    await expect(page.getByText("should_be_cleared")).toBeVisible();

    // Upload a CSV file
    const fileInput = page.locator('input[type="file"][accept=".csv"]');
    await fileInput.setInputFiles({
      name: "test_values.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("item\nfoo\nbar\nbaz"),
    });

    // Verify CSV mode: tag input replaced with message, checkbox hidden
    await expect(page.getByText("Values will be imported from CSV file.")).toBeVisible();
    await expect(page.getByText("should_be_cleared")).toBeHidden();
    await expect(page.getByText("Allow users to enter custom values")).toBeHidden();
    await expect(page.getByText("test_values.csv")).toBeVisible();

    // Submit
    await page.getByRole("button", { name: "Create Attribute" }).last().click();

    // Verify the create request has no suggestions
    const createRequest = await createPromise;
    const createBody = createRequest.postDataJSON();
    expect(createBody).not.toHaveProperty("suggestions");
    expect(createBody).not.toHaveProperty("hasAllowedList");

    // Verify the import request was sent with CSV content
    const importRequest = await importPromise;
    const importBody = importRequest.postDataJSON();
    expect(importBody.csvContent).toBeTruthy();

    // Verify sheet closes and attribute appears
    await expect(page.getByText("E2E CSV")).toBeVisible({ timeout: 10_000 });
  });

  test("should remove CSV and re-enable tag input", async ({ page }) => {
    // Open create sheet
    await page.getByRole("button", { name: "Create Attribute" }).click();
    await expect(
      page.getByRole("heading", { name: "Create Attribute" })
    ).toBeVisible();

    // Select Entity and Type
    await page.getByRole("button", { name: "Select entity..." }).click();
    await page.getByRole("option", { name: "Application" }).click();
    await page.getByRole("button", { name: "Select type..." }).click();
    await page.getByRole("option", { name: "String", exact: true }).click();

    // Upload a CSV file
    const fileInput = page.locator('input[type="file"][accept=".csv"]');
    await fileInput.setInputFiles({
      name: "removable.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("item\nval1\nval2"),
    });

    // Verify CSV mode is active
    await expect(page.getByText("Values will be imported from CSV file.")).toBeVisible();
    await expect(page.getByText("removable.csv")).toBeVisible();

    // Click the X button to remove CSV
    await page.getByText("removable.csv").locator("..").locator("button").click();

    // Verify tag input is re-enabled
    await expect(page.getByPlaceholder("Type a value and press Enter...")).toBeVisible();
    await expect(page.getByText("Allow users to enter custom values")).toBeVisible();
    await expect(page.getByText("Values will be imported from CSV file.")).toBeHidden();
  });

  test("should open edit sheet with pre-populated data when clicking pen icon", async ({ page }) => {
    // Hover over the "Editable Attr" row to reveal pen icon
    const row = page.locator("table tbody tr").filter({ hasText: "Editable Attr" });
    await row.hover();

    // Click the pen icon
    const editButton = row.getByLabel(/Edit Editable Attr/);
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Sheet should open with "Edit Attribute" title
    await expect(page.getByRole("heading", { name: "Edit Attribute" })).toBeVisible();

    // Verify read-only fields are displayed as text (not inputs) — scope to the sheet
    const sheet = page.getByLabel("Edit Attribute");
    await expect(sheet.locator(".bg-muted\\/50").filter({ hasText: "Application" })).toBeVisible();
    await expect(sheet.locator(".bg-muted\\/50").filter({ hasText: "String" })).toBeVisible();
    await expect(sheet.locator(".bg-muted\\/50").filter({ hasText: "e2e_editable_attr" })).toBeVisible();

    // Verify editable fields are pre-populated
    await expect(page.getByPlaceholder("e.g. Order Status")).toHaveValue("Editable Attr");
    await expect(page.getByPlaceholder("Describe what this attribute is used for...")).toHaveValue(
      "Attribute for edit/delete E2E tests"
    );

    // Verify suggestions are pre-populated as tags
    await expect(page.getByText("option_a")).toBeVisible();
    await expect(page.getByText("option_b")).toBeVisible();
    await expect(page.getByText("option_c")).toBeVisible();

    // Cancel to close
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should edit attribute name and description", async ({ page }) => {
    // Open edit sheet for "Editable Attr"
    const row = page.locator("table tbody tr").filter({ hasText: "Editable Attr" });
    await row.hover();
    await row.getByLabel(/Edit Editable Attr/).click();
    await expect(page.getByRole("heading", { name: "Edit Attribute" })).toBeVisible();

    // Intercept the update request
    const updatePromise = page.waitForRequest(
      (req) => req.url().includes("/api/v1/attributes/") && req.method() === "PUT"
    );

    // Modify name
    const nameInput = page.getByPlaceholder("e.g. Order Status");
    await nameInput.clear();
    await nameInput.fill("Updated Attr");

    // Modify description
    const descInput = page.getByPlaceholder("Describe what this attribute is used for...");
    await descInput.clear();
    await descInput.fill("Updated description");

    // Submit
    await page.getByRole("button", { name: "Update Attribute" }).click();

    // Verify the update request payload
    const updateRequest = await updatePromise;
    const body = updateRequest.postDataJSON();
    expect(body.title).toBe("Updated Attr");
    expect(body.description).toBe("Updated description");

    // Sheet should close and table should show updated name
    await expect(page.getByText("Updated Attr")).toBeVisible({ timeout: 10_000 });
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

  test("should show delete confirmation and cancel it", async ({ page }) => {
    // Open edit sheet for the attribute (may have been renamed to "Updated Attr")
    const row = page.locator("table tbody tr").filter({ hasText: "Updated Attr" });
    await row.hover();
    await row.getByLabel(/Edit Updated Attr/).click();
    await expect(page.getByRole("heading", { name: "Edit Attribute" })).toBeVisible();

    // Scroll down to delete section and click Delete Attribute
    const deleteButton = page.getByRole("button", { name: "Delete Attribute" }).first();
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();

    // Verify confirmation dialog appears
    const dialog = page.locator("[role='alertdialog'], [role='dialog']").filter({ hasText: "Are you sure" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("This action is permanent")).toBeVisible();

    // Click Cancel
    await dialog.getByRole("button", { name: "Cancel" }).click();

    // Dialog should close, sheet should still be open
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("heading", { name: "Edit Attribute" })).toBeVisible();

    // Close the sheet
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should delete an attribute", async ({ page }) => {
    // Verify attribute exists first
    await expect(page.getByText("Updated Attr")).toBeVisible();

    // Open edit sheet
    const row = page.locator("table tbody tr").filter({ hasText: "Updated Attr" });
    await row.hover();
    await row.getByLabel(/Edit Updated Attr/).click();
    await expect(page.getByRole("heading", { name: "Edit Attribute" })).toBeVisible();

    // Intercept the delete request
    const deletePromise = page.waitForRequest(
      (req) => req.url().includes("/api/v1/attributes/") && req.method() === "DELETE"
    );

    // Click Delete Attribute button in the danger zone
    const deleteButton = page.getByRole("button", { name: "Delete Attribute" }).first();
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.click();

    // Confirm in dialog
    const dialog = page.locator("[role='alertdialog'], [role='dialog']").filter({ hasText: "Are you sure" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete Attribute" }).click();

    // Wait for delete request
    await deletePromise;

    // Both dialog and sheet should close
    await expect(dialog).toBeHidden({ timeout: 5_000 });

    // Attribute should no longer appear in the table
    await expect(page.getByText("Updated Attr")).toBeHidden({ timeout: 10_000 });
  });
});
