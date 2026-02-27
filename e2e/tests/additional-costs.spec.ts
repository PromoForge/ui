import { test, expect } from "@playwright/test";

test.describe("Additional Costs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/tools/additional-costs");
    await expect(
      page.getByRole("heading", { name: "Additional Costs" })
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: "Shipping Cost" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should display the additional costs page with seeded data", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "Shipping Cost" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Extra Fees" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Editable Cost" })
    ).toBeVisible();

    // Verify scope badges within the table
    const table = page.locator("table");
    await expect(
      table.getByText("Cart (Session)").first()
    ).toBeVisible();
    await expect(
      table.getByText("Item", { exact: true }).first()
    ).toBeVisible();
  });

  test("should search additional costs by name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search");
    await searchInput.fill("Shipping");

    await expect(
      page.getByRole("button", { name: "Shipping Cost" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Extra Fees" })
    ).toBeHidden();

    await searchInput.clear();
    await expect(
      page.getByRole("button", { name: "Extra Fees" })
    ).toBeVisible();
  });

  test("should create a new additional cost", async ({ page }) => {
    await page
      .getByRole("button", { name: "Create Additional Cost" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Create Additional Cost" })
    ).toBeVisible();

    // API name
    await page
      .getByPlaceholder("e.g. shipping_cost")
      .fill("e2e_created_cost");

    // Rule Builder name
    await page
      .getByPlaceholder("e.g. Shipping Cost")
      .fill("E2E Created Cost");

    // Rule Builder description
    await page
      .getByPlaceholder("e.g. Delivery charges for the purchase.")
      .fill("Cost created by E2E test");

    // Submit
    await page
      .getByRole("button", { name: "Create Additional Cost" })
      .last()
      .click();

    // Should appear in the table
    await expect(
      page.getByRole("button", { name: "E2E Created Cost" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should open edit sheet with pre-populated data when clicking title", async ({
    page,
  }) => {
    // Click the title link to open edit sheet
    await page.getByRole("button", { name: "Editable Cost" }).click();

    await expect(
      page.getByRole("heading", { name: "Edit Additional Cost" })
    ).toBeVisible();

    // Verify read-only API name
    const sheet = page.getByRole("dialog", { name: "Edit Additional Cost" });
    await expect(
      sheet
        .locator(".bg-muted\\/50")
        .filter({ hasText: "e2e_editable_cost" })
    ).toBeVisible();

    // Verify editable fields are pre-populated
    await expect(page.getByPlaceholder("e.g. Shipping Cost")).toHaveValue(
      "Editable Cost"
    );
    await expect(
      page.getByPlaceholder("e.g. Delivery charges for the purchase.")
    ).toHaveValue("Cost for edit/delete E2E tests");

    // Cancel to close
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should edit additional cost name and description", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Editable Cost" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Additional Cost" })
    ).toBeVisible();

    const updatePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/additional_costs/") &&
        req.method() === "PUT"
    );

    const nameInput = page.getByPlaceholder("e.g. Shipping Cost");
    await nameInput.clear();
    await nameInput.fill("Updated Cost");

    const descInput = page.getByPlaceholder(
      "e.g. Delivery charges for the purchase."
    );
    await descInput.clear();
    await descInput.fill("Updated description");

    await page.getByRole("button", { name: "Save" }).click();

    const updateRequest = await updatePromise;
    const body = updateRequest.postDataJSON();
    expect(body.title).toBe("Updated Cost");
    expect(body.description).toBe("Updated description");

    await expect(
      page.getByRole("button", { name: "Updated Cost" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should show delete confirmation and cancel it", async ({ page }) => {
    await page.getByRole("button", { name: "Updated Cost" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Additional Cost" })
    ).toBeVisible();

    const sheetDeleteButton = page
      .getByRole("dialog", { name: "Edit Additional Cost" })
      .getByRole("button", { name: "Delete Additional Cost" });
    await sheetDeleteButton.scrollIntoViewIfNeeded();
    await sheetDeleteButton.click();

    const dialog = page.getByRole("dialog", {
      name: "Delete Additional Cost",
    });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Edit Additional Cost" })
    ).toBeVisible();

    await page
      .getByRole("dialog", { name: "Edit Additional Cost" })
      .getByRole("button", { name: "Cancel" })
      .click();
  });

  test("should delete an additional cost", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Updated Cost" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Updated Cost" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Additional Cost" })
    ).toBeVisible();

    const deletePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/additional_costs/") &&
        req.method() === "DELETE"
    );

    const sheetDeleteButton = page
      .getByRole("dialog", { name: "Edit Additional Cost" })
      .getByRole("button", { name: "Delete Additional Cost" });
    await sheetDeleteButton.scrollIntoViewIfNeeded();
    await sheetDeleteButton.click();

    const dialog = page.getByRole("dialog", {
      name: "Delete Additional Cost",
    });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Delete Additional Cost" })
      .click();

    await deletePromise;
    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(
      page.getByRole("button", { name: "Updated Cost" })
    ).toBeHidden({ timeout: 10_000 });
  });
});
