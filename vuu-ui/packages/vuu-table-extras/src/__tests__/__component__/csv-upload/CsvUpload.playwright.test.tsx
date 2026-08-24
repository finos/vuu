import { test, expect } from "../../../../../../playwright/fixtures";

test.describe("Given a CsvUpload component", () => {
  test("THEN it renders the open dialog with correct initial state", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvUpload/DefaultCsvUpload");

    await expect(page.locator("[role='dialog']")).toBeVisible();
    await expect(page.locator("[role='dialog']")).toContainText("Import CSV");
    await expect(page.locator(".vuuCsvUpload-dropZone")).toBeVisible();
    await expect(page.locator(".vuuCsvUpload-dropZone")).toContainText(
      "Drop a file here or",
    );
    await expect(
      page.locator("button", { hasText: "BROWSE FILES" }),
    ).toBeVisible();
    await expect(page.locator("button", { hasText: "Import" })).toBeDisabled();
    await expect(page.locator("button", { hasText: "Cancel" })).toBeEnabled();
  });

  test("WHEN Cancel is clicked THEN the onCancel callback is invoked", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      "TableExtras/CsvUpload/CsvUploadWithCancelCallback",
    );

    await page.locator("button", { hasText: "Cancel" }).click();

    await expect(component.locator("[data-testid='cancel-result']")).toHaveText(
      "cancelled",
    );
  });

  test("WHEN open is toggled THEN dialog visibility changes accordingly", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvUpload/ClosedCsvUpload");

    await expect(page.locator("[role='dialog']")).not.toBeVisible();

    await page.locator("button", { hasText: "Open Upload Dialog" }).click();

    await expect(page.locator("[role='dialog']")).toBeVisible();
  });

  test("WHEN a custom dialogTitle is provided THEN it is rendered in the dialog header", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvUpload/CsvUploadCustomTitle");

    await expect(page.locator("[role='dialog']")).toContainText(
      "Upload Instruments CSV",
    );
  });
});

test.describe("Given a CsvUpload with the instruments schema", () => {
  test("WHEN a CSV with unrecognised column names is selected THEN the drop zone shows error state and Import remains disabled", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvUpload/CsvUploadWithInstrumentsSchema");

    await page.locator('input[type="file"]').setInputFiles({
      name: "bad-columns.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("symbol,currency,name\nAAPL,USD,Apple\n"),
    });

    await expect(page.locator(".saltFileDropZone")).toHaveClass(
      /saltFileDropZone-error/,
      { timeout: 5000 },
    );
    await expect(page.locator(".vuuCsvUpload-dropZone")).toContainText(
      "Your file contains errors",
    );
    await expect(page.locator("button", { hasText: "Import" })).toBeDisabled();
  });
});

test.describe("Given a DataUploadPreview", () => {
  test("uploads CSV rows directly from the toolbar", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableEmptyWithUpload");

    await expect(
      page.getByRole("button", { name: "Upload (preview)" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Upload (direct)" }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "test-edit.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "id,description,quantity,price,enabled,externalId\nCSV-001,Direct upload,10,12.5,true,1001\n",
      ),
    });
    await page.getByRole("button", { name: "Import", exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Upload Data" }),
    ).not.toBeVisible();
    await expect(page.locator(".vuuDatasourceStats-value").last()).toHaveText(
      "1",
    );
  });

  test("allows uploaded rows to be edited and deleted before submission", async ({
    mount,
    page,
  }) => {
    await mount("Table/Editing/TestTableEmptyWithUpload");

    await page.getByRole("button", { name: "Upload (preview)" }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "test-edit.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "id,description,quantity,price,enabled,externalId\nCSV-001,Uploaded row,10,12.5,true,1001\nCSV-002,Delete me,20,25,true,1002\n",
      ),
    });
    await page.getByRole("button", { name: "Import", exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Edit uploaded data" }),
    ).toBeVisible();
    await expect(page.locator(".vuuDataUploadPreview")).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Error column header" }),
    ).toBeVisible();
    await expect(page.locator('input[value="CSV-001"]')).toBeVisible();
    await expect(page.locator(".vuuInlineAddRow")).toHaveCount(0);

    const description = page
      .getByRole("textbox", {
        name: "description",
        exact: true,
      })
      .first();
    await description.fill("Edited upload");
    await description.press("Enter");
    await expect(description).toHaveValue("Edited upload");

    const deletedRow = page
      .locator('input[value="CSV-002"]')
      .locator('xpath=ancestor::*[@role="row"]');
    await deletedRow
      .getByRole("checkbox", { name: "Press space to select row" })
      .click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(deletedRow).toContainClass("vuuTableRow-deleted");

    await page.getByRole("button", { name: "Submit", exact: true }).click();

    await expect(
      page.getByRole("heading", { name: "Edit uploaded data" }),
    ).not.toBeVisible();
    await expect(page.locator(".vuuDatasourceStats-value").last()).toHaveText(
      "1",
    );
  });
});

test.describe("Given a CsvUpload with a missing key column", () => {
  test("WHEN a CSV missing the key column is selected THEN the drop zone shows error state", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvUpload/CsvUploadWithInstrumentsSchema");

    // omit isin to trigger a MISSING_KEY_COLUMN error
    await page.locator('input[type="file"]').setInputFiles({
      name: "missing-key.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        "bbg,currency,description,exchange,lotSize,ric\nAAPL US,USD,Apple Inc,NASDAQ,120,AAPL.O\n",
      ),
    });

    await expect(page.locator(".saltFileDropZone")).toHaveClass(
      /saltFileDropZone-error/,
      { timeout: 5000 },
    );
  });
});
