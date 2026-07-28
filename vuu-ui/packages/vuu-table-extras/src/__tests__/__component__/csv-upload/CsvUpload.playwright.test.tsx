import { test, expect } from "@playwright/experimental-ct-react";
import {
  DefaultCsvUpload,
  CsvUploadWithCancelCallback,
  ClosedCsvUpload,
  CsvUploadCustomTitle,
  CsvUploadWithInstrumentsSchema,
} from "../../../../../../showcase/src/examples/TableExtras/CsvUpload.examples";

test.describe("Given a CsvUpload component", () => {
  test("THEN it renders the open dialog with correct initial state", async ({
    mount,
    page,
  }) => {
    await mount(<DefaultCsvUpload />);

    await expect(page.locator("[role='dialog']")).toBeVisible();
    await expect(page.locator("[role='dialog']")).toContainText("Import CSV");
    await expect(page.locator(".vuuCsvUpload-dropZone")).toBeVisible();
    await expect(page.locator(".vuuCsvUpload-dropZone")).toContainText(
      "Drop a file here or",
    );
    await expect(
      page.locator("button", { hasText: "BROWSE FILES" }),
    ).toBeVisible();
    await expect(
      page.locator("button", { hasText: "Import" }),
    ).toBeDisabled();
    await expect(
      page.locator("button", { hasText: "Cancel" }),
    ).toBeEnabled();
  });

  test("WHEN Cancel is clicked THEN the onCancel callback is invoked", async ({
    mount,
    page,
  }) => {
    const component = await mount(<CsvUploadWithCancelCallback />);

    await page.locator("button", { hasText: "Cancel" }).click();

    await expect(component.locator("[data-testid='cancel-result']")).toHaveText(
      "cancelled",
    );
  });

  test("WHEN open is toggled THEN dialog visibility changes accordingly", async ({
    mount,
    page,
  }) => {
    await mount(<ClosedCsvUpload />);

    await expect(page.locator("[role='dialog']")).not.toBeVisible();

    await page.locator("button", { hasText: "Open Upload Dialog" }).click();

    await expect(page.locator("[role='dialog']")).toBeVisible();
  });

  test("WHEN a custom dialogTitle is provided THEN it is rendered in the dialog header", async ({
    mount,
    page,
  }) => {
    await mount(<CsvUploadCustomTitle />);

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
    await mount(<CsvUploadWithInstrumentsSchema />);

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
    await expect(
      page.locator("button", { hasText: "Import" }),
    ).toBeDisabled();
  });

  test("WHEN a CSV missing the key column is selected THEN the drop zone shows error state", async ({
    mount,
    page,
  }) => {
    await mount(<CsvUploadWithInstrumentsSchema />);

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
