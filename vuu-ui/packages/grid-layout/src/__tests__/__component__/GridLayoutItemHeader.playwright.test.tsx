import { expect, test } from "../../../../../playwright/fixtures";

const stories = "GridLayout/GridLayoutHeaderContributions";

const header = (page: import("@playwright/test").Page, itemId: string) =>
  page.locator(`[id="${itemId}"] > .vuuGridLayoutItemHeader`);

const slotOrder = (locator: import("@playwright/test").Locator) =>
  locator.evaluate((element) =>
    Array.from(element.children)
      .filter((child) => child.childElementCount > 0)
      .map(
        (child) =>
          (child as HTMLElement).dataset.slot ??
          child.className.replace(/.*vuuGridLayoutItemHeader-/, ""),
      ),
  );

test.describe("GridLayoutItem header contributions", () => {
  test("renders contributions in start, center and end, around the title and before close", async ({
    mount,
    page,
  }) => {
    await mount(`${stories}/HeaderContributions`);

    const tickerHeader = header(page, "ticker");
    await expect(
      tickerHeader.locator('[data-slot="start"] [aria-label="Channel red"]'),
    ).toHaveCount(1);
    await expect(tickerHeader.locator('[data-slot="center"]')).toContainText(
      "AAPL.OQ",
    );
    await expect(
      tickerHeader.locator(".vuuGridLayoutItemHeader-title"),
    ).toHaveText("Ticker");
    expect(await slotOrder(tickerHeader)).toEqual([
      "start",
      "titleContainer vuuDraggableLabel",
      "center",
      "actions",
    ]);

    const blotterHeader = header(page, "blotter");
    expect(await slotOrder(blotterHeader)).toEqual([
      "titleContainer vuuDraggableLabel",
      "end",
      "actions",
    ]);
    await expect(
      blotterHeader.getByRole("img", { name: "Visual link active" }),
    ).toBeVisible();
  });

  test("a title contribution replaces the default title", async ({
    mount,
    page,
  }) => {
    await mount(`${stories}/HeaderContributions`);

    const customHeader = header(page, "custom-title");
    await expect(customHeader).toContainText("Custom title");
    await expect(
      customHeader.locator(".vuuGridLayoutItemHeader-title"),
    ).toBeHidden();
    await expect(customHeader).toHaveAttribute("data-title", "Custom");
  });

  test("removing a contribution removes it from the header", async ({
    mount,
    page,
  }) => {
    await mount(`${stories}/HeaderContributions`);

    const blotterHeader = header(page, "blotter");
    const linkIcon = blotterHeader.getByRole("img", {
      name: "Visual link active",
    });
    await expect(linkIcon).toBeVisible();

    await page.getByRole("button", { name: "Remove link" }).click();
    await expect(linkIcon).toHaveCount(0);
    await expect(blotterHeader.locator('[data-slot="end"]')).toBeHidden();

    await page.getByRole("button", { name: "Create link" }).click();
    await expect(linkIcon).toBeVisible();
  });

  test("contributed content updates with the hosting component", async ({
    mount,
    page,
  }) => {
    await mount(`${stories}/HeaderContributions`);

    const price = header(page, "ticker").locator(
      ".vuuHeaderContributionExample-price",
    );
    const first = await price.textContent();
    await expect(price).not.toHaveText(first ?? "", { timeout: 5000 });
  });

  test("a drag started on a header button does not drag the item", async ({
    mount,
    page,
  }) => {
    await mount(`${stories}/HeaderContributions`);

    const dragStarts: string[] = [];
    await page.exposeFunction("recordDragStart", (id: string) =>
      dragStarts.push(id),
    );
    await page.evaluate(() => {
      // Capture phase, because the item's drag handler stops propagation.
      // defaultPrevented is read after dispatch has finished.
      document.addEventListener(
        "dragstart",
        (evt) => {
          const item = (evt.target as HTMLElement).closest(
            ".vuuGridLayoutItem",
          );
          setTimeout(() => {
            if (!evt.defaultPrevented) {
              (
                window as unknown as { recordDragStart: (id: string) => void }
              ).recordDragStart(item?.id ?? "none");
            }
          });
        },
        true,
      );
    });

    const close = header(page, "orders").getByRole("button", { name: "Close" });
    const box = await close.boundingBox();
    if (!box) {
      throw Error("close button must have layout bounds");
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 80, box.y + 120, { steps: 10 });
    await page.mouse.up();

    await page.waitForTimeout(100);
    expect(dragStarts).toEqual([]);
    await expect(page.locator('[id="orders"]')).toBeVisible();

    const title = header(page, "orders").locator(
      ".vuuGridLayoutItemHeader-title",
    );
    const titleBox = await title.boundingBox();
    if (!titleBox) {
      throw Error("title must have layout bounds");
    }
    await page.mouse.move(titleBox.x + 5, titleBox.y + titleBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(titleBox.x + 80, titleBox.y + 120, { steps: 10 });
    await page.mouse.up();

    await expect.poll(() => dragStarts).toEqual(["orders"]);
  });

  test("header API variables restyle the header", async ({ mount, page }) => {
    await mount(`${stories}/ThemedHeader`);

    const themed = header(page, "themed-orders");
    await expect(themed).toHaveCSS("height", "32px");

    await mount(`${stories}/HeaderContributions`);
    await expect(header(page, "orders")).toHaveCSS("height", "25px");
  });
});

test.describe("stacked GridLayoutItem header contributions", () => {
  test("the selected tab's start, center and end contributions render in the tab bar", async ({
    mount,
    page,
  }) => {
    await mount(`${stories}/StackedHeaderContributions`);

    const tabBar = page.locator(".vuuGridLayoutStackedItem .saltTabBar");
    await expect(
      tabBar.locator(".vuuGridLayoutStackedItem-center"),
    ).toContainText("AAPL.OQ");

    await page.getByRole("tab", { name: "Vodafone" }).click();
    await expect(
      tabBar.locator(".vuuGridLayoutStackedItem-center"),
    ).toContainText("VOD.L");
    await expect(
      tabBar.locator(".vuuGridLayoutStackedItem-center"),
    ).not.toContainText("AAPL.OQ");

    await page.getByRole("tab", { name: "Linked blotter" }).click();
    await expect(
      tabBar.locator(".vuuGridLayoutStackedItem-center"),
    ).toBeEmpty();
    await expect(
      tabBar
        .locator(".vuuGridLayoutStackedItem-end")
        .getByRole("img", { name: "Visual link active" }),
    ).toBeVisible();
  });

  test("tab-start contributions render in the item's own tab", async ({
    mount,
    page,
  }) => {
    await mount(`${stories}/StackedHeaderContributions`);

    const appleTab = page.locator(
      '.vuuDraggableItem[data-grid-layout-item-id="aapl"]',
    );
    const vodafoneTab = page.locator(
      '.vuuDraggableItem[data-grid-layout-item-id="vod"]',
    );
    await expect(
      appleTab.locator('[data-slot="tab-start"] [aria-label="Channel red"]'),
    ).toHaveCount(1);
    // Only the selected tab's component is mounted, so only it contributes.
    await expect(vodafoneTab.locator('[data-slot="tab-start"]')).toBeEmpty();

    await page.getByRole("tab", { name: "Vodafone" }).click();
    await expect(
      vodafoneTab.locator(
        '[data-slot="tab-start"] [aria-label="Channel blue"]',
      ),
    ).toHaveCount(1);
  });
});
