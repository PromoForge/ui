import { test, expect } from "@playwright/test";

test.describe("Cart Item Catalogs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/tools/cart-item-catalogs");
    await expect(
      page.getByRole("heading", { name: "Cart Item Catalogs" })
    ).toBeVisible({ timeout: 15_000 });
    // Wait for at least one seeded catalog to appear
    await expect(
      page.getByRole("link", { name: "E2E Test Catalog" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should display the catalogs page with seeded data", async ({
    page,
  }) => {
    await expect(
      page.getByRole("link", { name: "E2E Test Catalog" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "E2E Editable Catalog" })
    ).toBeVisible();

    // Verify table columns
    const table = page.locator("table");
    await expect(table.getByText("Name")).toBeVisible();
    await expect(table.getByText("ID")).toBeVisible();
    await expect(table.getByText("Applications")).toBeVisible();
    await expect(table.getByText("Edit")).toBeVisible();
  });

  test("should create a new catalog", async ({ page }) => {
    await page.getByRole("button", { name: "Create Catalog" }).click();

    // Verify sheet description
    await expect(
      page.getByText(
        "Edit the name, description, and connected Applications"
      )
    ).toBeVisible();

    // Fill name
    const nameInput = page.getByRole("dialog").locator("input").first();
    await nameInput.fill("E2E Created Catalog");

    // Fill description
    const descTextarea = page.getByRole("dialog").locator("textarea");
    await descTextarea.fill("Created by E2E test");

    // Verify char counter
    await expect(page.getByText("19 / 200")).toBeVisible();

    // Submit
    await page
      .getByRole("button", { name: "Create Catalog" })
      .last()
      .click();

    // Should appear in the table
    await expect(
      page.getByRole("link", { name: "E2E Created Catalog" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should navigate to catalog detail page", async ({ page }) => {
    await page.getByRole("link", { name: "E2E Test Catalog" }).click();

    // Verify breadcrumb
    await expect(page.getByText("Cart Item Catalogs")).toBeVisible();
    await expect(page.getByText("E2E Test Catalog")).toBeVisible();

    // Verify metadata
    await expect(page.getByText("Catalog Name")).toBeVisible();
    await expect(page.getByText("Catalog ID")).toBeVisible();
    await expect(page.getByText("Connected Applications")).toBeVisible();

    // Verify Edit Catalog button
    await expect(
      page.getByRole("button", { name: "Edit Catalog" })
    ).toBeVisible();
  });

  test("should open edit sheet from list page pencil icon", async ({
    page,
  }) => {
    // Click the pencil icon on the first row
    const firstEditButton = page
      .locator("table tbody tr")
      .first()
      .getByRole("button");
    await firstEditButton.click();

    await expect(
      page.getByText(
        "Edit the name, description, and connected Applications"
      )
    ).toBeVisible();

    // Cancel to close
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should edit a catalog name and description", async ({ page }) => {
    // Open edit via pencil icon on "E2E Editable Catalog"
    const editableRow = page.locator("table tbody tr", {
      has: page.getByRole("link", { name: "E2E Editable Catalog" }),
    });
    await editableRow.getByRole("button").click();

    await expect(
      page.getByText(
        "Edit the name, description, and connected Applications"
      )
    ).toBeVisible();

    const updatePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/catalogs/") && req.method() === "PUT"
    );

    const nameInput = page.getByRole("dialog").locator("input").first();
    await nameInput.clear();
    await nameInput.fill("Updated Catalog");

    const descTextarea = page.getByRole("dialog").locator("textarea");
    await descTextarea.clear();
    await descTextarea.fill("Updated description");

    await page.getByRole("button", { name: "Save" }).click();

    const updateRequest = await updatePromise;
    const body = updateRequest.postDataJSON();
    expect(body.name).toBe("Updated Catalog");
    expect(body.description).toBe("Updated description");

    await expect(
      page.getByRole("link", { name: "Updated Catalog" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should delete a catalog", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: "Updated Catalog" })
    ).toBeVisible();

    const editableRow = page.locator("table tbody tr", {
      has: page.getByRole("link", { name: "Updated Catalog" }),
    });
    await editableRow.getByRole("button").click();

    await expect(
      page.getByText(
        "Edit the name, description, and connected Applications"
      )
    ).toBeVisible();

    const deletePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/catalogs/") &&
        req.method() === "DELETE"
    );

    const sheetDeleteButton = page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete Catalog" });
    await sheetDeleteButton.scrollIntoViewIfNeeded();
    await sheetDeleteButton.click();

    const dialog = page.getByRole("dialog", { name: "Delete Catalog" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Delete Catalog" }).click();

    await deletePromise;
    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(
      page.getByRole("link", { name: "Updated Catalog" })
    ).toBeHidden({ timeout: 10_000 });
  });
});
