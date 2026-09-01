import { test, expect } from "../../../../../../playwright/fixtures";
import * as fs from "fs";

test.describe("exportCsvTemplate", () => {
  test("WHEN triggered THEN a header-only CSV file is downloaded with the correct filename", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvExport/CsvExportTemplate");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page
        .locator("button", { hasText: "Download template (all columns)" })
        .click(),
    ]);

    expect(download.suggestedFilename()).toBe("instruments-template.csv");
    const filePath = await download.path();
    if (!filePath) throw new Error("download path not available");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\r\n").filter(Boolean);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("ric");
    expect(lines[0]).toContain("currency");
  });

  test("WHEN a column subset is specified THEN the file contains exactly those columns in order", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvExport/CsvExportTemplate");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("button", { hasText: "Download template (ric" }).click(),
    ]);

    const filePath = await download.path();
    if (!filePath) throw new Error("download path not available");
    const content = fs.readFileSync(filePath, "utf-8");
    const [header] = content.split("\r\n");

    expect(header).toBe("ric,currency,description,exchange,isin");
  });
});

test.describe("exportToCsv", () => {
  test("WHEN triggered THEN a CSV file is downloaded with the correct filename", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvExport/CsvExportSimple");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("button", { hasText: "Download instruments.csv" }).click(),
    ]);

    expect(download.suggestedFilename()).toBe("instruments.csv");
  });

  test("WHEN triggered THEN the downloaded file contains a header row and data rows", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvExport/CsvExportSimple");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("button", { hasText: "Download instruments.csv" }).click(),
    ]);

    const filePath = await download.path();
    if (!filePath) throw new Error("download path not available");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\r\n").filter(Boolean);
    const [header, ...dataRows] = lines;

    expect(header).toContain("ric");
    expect(header).toContain("currency");
    expect(header).toContain("description");
    expect(dataRows.length).toBeGreaterThan(0);
  });

  test("WHEN triggered THEN internal session columns are excluded from the output", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvExport/CsvExportSimple");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("button", { hasText: "Download instruments.csv" }).click(),
    ]);

    const filePath = await download.path();
    if (!filePath) throw new Error("download path not available");
    const content = fs.readFileSync(filePath, "utf-8");
    const [header] = content.split("\r\n");

    expect(header).not.toContain("vuuMsg");
    expect(header).not.toContain("vuuAction");
  });

  test("WHEN row count exceeds maxRows THEN an error message is displayed and no download occurs", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvExport/CsvExportWithRowLimit");

    // ensure no spurious download event fires
    let downloadFired = false;
    page.on("download", () => { downloadFired = true; });

    await page.locator("button", { hasText: "Export (max 50 rows)" }).click();

    await expect(
      page.locator("span", { hasText: /Export failed/ }),
    ).toBeVisible({ timeout: 5000 });
    expect(downloadFired).toBe(false);
  });

  test("WHEN copyOption is Selected THEN only selected rows appear in the download", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvExport/CsvExportAllRows");

    // select the first row via the row checkbox then export selected
    await page
      .getByRole("checkbox", { name: "Press space to select row" })
      .first()
      .click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("button", { hasText: "Export Selected to CSV" }).click(),
    ]);

    const filePath = await download.path();
    if (!filePath) throw new Error("download path not available");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\r\n").filter(Boolean);

    // header + exactly one data row
    expect(lines).toHaveLength(2);
  });
});

test.describe("ExportColumnDescriptor — exportFormatter and label", () => {
  test("WHEN columnDescriptors with labels are provided THEN the CSV header uses label overrides", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvExport/CsvExportWithFormatters");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("button", { hasText: "Download instruments-formatted.csv" }).click(),
    ]);

    const filePath = await download.path();
    if (!filePath) throw new Error("download path not available");
    const content = fs.readFileSync(filePath, "utf-8");
    const [header] = content.split("\r\n");

    expect(header).toContain("RIC Code");
    expect(header).toContain("Bloomberg");
    expect(header).toContain("Lot Size");
    expect(header).not.toContain("ric,");
    expect(header).not.toContain("lotSize");
  });

  test("WHEN an exportFormatter is provided THEN formatted values appear in the data rows", async ({
    mount,
    page,
  }) => {
    await mount("TableExtras/CsvExport/CsvExportWithFormatters");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.locator("button", { hasText: "Download instruments-formatted.csv" }).click(),
    ]);

    const filePath = await download.path();
    if (!filePath) throw new Error("download path not available");
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\r\n").filter(Boolean);
    const dataRows = lines.slice(1);

    expect(dataRows.length).toBeGreaterThan(0);
    // every data row's lotSize column should end with " units"
    expect(dataRows.every((row) => row.split(",").some((cell) => cell.endsWith(" units")))).toBe(true);
  });
});
