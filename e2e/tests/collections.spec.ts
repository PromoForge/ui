import { test, expect } from "@playwright/test";

test.describe("Collections", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings/tools/collections");
    await expect(
      page.getByRole("heading", { name: "Collections" })
    ).toBeVisible({ timeout: 15_000 });
    // Wait for at least one seeded collection to appear
    await expect(
      page.getByRole("button", { name: "E2E Test Collection" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should display the collections page with seeded data", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: "E2E Test Collection" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "E2E Editable Collection" })
    ).toBeVisible();

    // Verify table columns
    const table = page.locator("table");
    await expect(table.getByText("ID")).toBeVisible();
    await expect(table.getByText("Name")).toBeVisible();
    await expect(table.getByText("Applications")).toBeVisible();
  });

  test("should search collections by name", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Name or Description");
    await searchInput.fill("Editable");

    await expect(
      page.getByRole("button", { name: "E2E Editable Collection" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "E2E Test Collection" })
    ).toBeHidden();

    await searchInput.clear();
    await expect(
      page.getByRole("button", { name: "E2E Test Collection" })
    ).toBeVisible();
  });

  test("should create a new collection", async ({ page }) => {
    await page
      .getByRole("button", { name: "Create Collection" })
      .click();

    // Verify sheet description
    await expect(
      page.getByText("Create a list of items you can use in your rules")
    ).toBeVisible();

    // Fill name
    const nameInput = page.getByRole("dialog").locator("input").first();
    await nameInput.fill("E2E Created Collection");

    // Fill description
    const descTextarea = page.getByRole("dialog").locator("textarea");
    await descTextarea.fill("Created by E2E test");

    // Submit
    await page
      .getByRole("button", { name: "Create Collection" })
      .last()
      .click();

    // Should appear in the table
    await expect(
      page.getByRole("button", { name: "E2E Created Collection" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should open edit sheet with pre-populated data when clicking name", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: "E2E Editable Collection" })
      .click();

    await expect(
      page.getByText("Edit the list of imported items")
    ).toBeVisible();

    // Verify name is pre-populated
    const nameInput = page.getByRole("dialog").locator("input").first();
    await expect(nameInput).toHaveValue("E2E Editable Collection");

    // Verify description is pre-populated
    const descTextarea = page.getByRole("dialog").locator("textarea");
    await expect(descTextarea).toHaveValue(
      "Collection for edit/delete E2E tests"
    );

    // Verify manage items section exists
    await expect(page.getByText("Manage items")).toBeVisible();
    await expect(
      page.getByText("Uploading a new list of items replaces the current list")
    ).toBeVisible();

    // Verify delete section exists
    await expect(page.getByRole("heading", { name: "Delete collection" })).toBeVisible();

    // Cancel to close
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should edit a collection name and description", async ({ page }) => {
    await page
      .getByRole("button", { name: "E2E Editable Collection" })
      .click();

    await expect(
      page.getByText("Edit the list of imported items")
    ).toBeVisible();

    const updatePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/collections/") &&
        req.method() === "PUT"
    );

    const nameInput = page.getByRole("dialog").locator("input").first();
    await nameInput.clear();
    await nameInput.fill("Updated Collection");

    const descTextarea = page.getByRole("dialog").locator("textarea");
    await descTextarea.clear();
    await descTextarea.fill("Updated description");

    await page.getByRole("button", { name: "Save" }).click();

    const updateRequest = await updatePromise;
    const body = updateRequest.postDataJSON();
    expect(body.name).toBe("Updated Collection");
    expect(body.description).toBe("Updated description");

    await expect(
      page.getByRole("button", { name: "Updated Collection" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("should show delete confirmation and cancel it", async ({ page }) => {
    await page
      .getByRole("button", { name: "Updated Collection" })
      .click();

    await expect(
      page.getByText("Edit the list of imported items")
    ).toBeVisible();

    const sheetDeleteButton = page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete Collection" });
    await sheetDeleteButton.scrollIntoViewIfNeeded();
    await sheetDeleteButton.click();

    const dialog = page.getByRole("dialog", {
      name: "Delete Collection",
    });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();

    // Close the edit sheet
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("should delete a collection", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Updated Collection" })
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Updated Collection" })
      .click();

    await expect(
      page.getByText("Edit the list of imported items")
    ).toBeVisible();

    const deletePromise = page.waitForRequest(
      (req) =>
        req.url().includes("/api/v1/collections/") &&
        req.method() === "DELETE"
    );

    const sheetDeleteButton = page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete Collection" });
    await sheetDeleteButton.scrollIntoViewIfNeeded();
    await sheetDeleteButton.click();

    const dialog = page.getByRole("dialog", {
      name: "Delete Collection",
    });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "Delete Collection" })
      .click();

    await deletePromise;
    await expect(dialog).toBeHidden({ timeout: 5_000 });
    await expect(
      page.getByRole("button", { name: "Updated Collection" })
    ).toBeHidden({ timeout: 10_000 });
  });
});
