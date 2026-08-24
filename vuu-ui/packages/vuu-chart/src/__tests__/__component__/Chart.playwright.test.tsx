import { expect, test } from "../../../../../playwright/fixtures";

test.describe("Chart examples", () => {
  test("renders a chart from the simple line chart example", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/SimpleLineChart");

    const chartElement = page.locator(".vuuChart");
    await expect(chartElement).toBeVisible();
    await expect(chartElement.locator("svg")).toBeVisible();
  });

  test("renders data exclusions from the chart context menu example", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/DataExclusions");

    const chartElement = page.locator(".vuuChart");
    await expect(chartElement).toBeVisible();
    await expect(chartElement.locator("svg")).toBeVisible();
  });

  test("resizes the chart when the editable chart enters edit mode", async ({
    mount,
    page,
  }) => {
    await mount("Chart/LineChart/EditableChart");

    const chartElement = page.locator(".vuuChart");
    await expect(chartElement.locator("svg")).toBeVisible();
    const viewHeight = (await chartElement.boundingBox())?.height;
    const viewSvgHeight = (await chartElement.locator("svg").boundingBox())
      ?.height;

    await page.getByRole("radio", { name: "Edit" }).click();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();

    const editHeight = (await chartElement.boundingBox())?.height;
    const editSvgHeight = (await chartElement.locator("svg").boundingBox())
      ?.height;
    if (
      viewHeight === undefined ||
      editHeight === undefined ||
      viewSvgHeight === undefined ||
      editSvgHeight === undefined
    ) {
      throw Error("Unable to measure chart");
    }
    expect(editHeight).toBeLessThan(viewHeight);
    expect(editSvgHeight).toBeLessThan(viewSvgHeight);
  });
});
