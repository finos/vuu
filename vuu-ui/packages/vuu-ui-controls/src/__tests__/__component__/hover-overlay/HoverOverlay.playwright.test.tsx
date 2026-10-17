import { test, expect } from "../../../../../../playwright/fixtures";

test.describe("Given a HoverOverlay (openOn hover)", () => {
  test.describe("WHEN pointer hovers over trigger", () => {
    test("THEN overlay opens after a short delay", async ({ mount, page }) => {
      const component = await mount(
        "UiControls/HoverOverlay/DefaultHoverOverlay",
      );
      await component.getByTestId("hover-overlay-trigger").hover();
      await expect(page.getByTestId("hover-overlay-content")).toBeVisible();
      await expect(component.getByTestId("open-change-log")).toHaveText("open");
    });

    test("THEN overlay stays open while pointer remains on trigger", async ({
      mount,
      page,
    }) => {
      const component = await mount(
        "UiControls/HoverOverlay/DefaultHoverOverlay",
      );
      await component.getByTestId("hover-overlay-trigger").hover();
      await expect(page.getByTestId("hover-overlay-content")).toBeVisible();

      // regression: Salt >= 1.67 makes the trigger inert while the panel is
      // open, which used to cause an open/close loop every ~700ms
      await page.waitForTimeout(2000);

      await expect(page.getByTestId("hover-overlay-content")).toBeVisible();
      await expect(component.getByTestId("open-change-log")).toHaveText("open");
    });
  });

  test.describe("WHEN overlay is open", () => {
    test("THEN panel uses the primary container border colour", async ({
      mount,
      page,
    }) => {
      const component = await mount(
        "UiControls/HoverOverlay/DefaultHoverOverlay",
      );
      await component.getByTestId("hover-overlay-trigger").hover();
      await expect(page.getByTestId("hover-overlay-content")).toBeVisible();

      const [actual, expected] = await page
        .locator(".vuuHoverOverlay-panel")
        .evaluate((panel) => {
          const probe = document.createElement("div");
          probe.style.color = "var(--salt-container-primary-borderColor)";
          panel.parentElement?.appendChild(probe);
          const expected = getComputedStyle(probe).color;
          probe.remove();
          return [getComputedStyle(panel).borderTopColor, expected];
        });
      expect(actual).toBe(expected);
    });
  });

  test.describe("WHEN pointer moves from trigger into overlay", () => {
    test("THEN overlay stays open", async ({ mount, page }) => {
      const component = await mount(
        "UiControls/HoverOverlay/DefaultHoverOverlay",
      );
      await component.getByTestId("hover-overlay-trigger").hover();
      const content = page.getByTestId("hover-overlay-content");
      await expect(content).toBeVisible();

      const box = await content.boundingBox();
      if (!box) throw Error("overlay content has no bounding box");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
        steps: 10,
      });
      await page.waitForTimeout(1000);

      await expect(content).toBeVisible();
      await expect(component.getByTestId("open-change-log")).toHaveText("open");
    });
  });

  test.describe("WHEN pointer moves away from trigger and overlay", () => {
    test("THEN overlay closes", async ({ mount, page }) => {
      const component = await mount(
        "UiControls/HoverOverlay/DefaultHoverOverlay",
      );
      await component.getByTestId("hover-overlay-trigger").hover();
      const content = page.getByTestId("hover-overlay-content");
      await expect(content).toBeVisible();

      await page.mouse.move(2, 2, { steps: 5 });

      await expect(content).toBeHidden();
      await expect(component.getByTestId("open-change-log")).toHaveText(
        "open,close",
      );
    });
  });

  test.describe("WHEN pointer leaves trigger before open delay", () => {
    test("THEN overlay does not open", async ({ mount, page }) => {
      const component = await mount(
        "UiControls/HoverOverlay/DefaultHoverOverlay",
      );
      await component.getByTestId("hover-overlay-trigger").hover();
      await page.mouse.move(2, 2);
      await page.waitForTimeout(800);

      await expect(page.getByTestId("hover-overlay-content")).toBeHidden();
      await expect(component.getByTestId("open-change-log")).toHaveText("");
    });
  });
});

test.describe("Given a HoverOverlay with openOn click", () => {
  test.describe("WHEN pointer hovers over trigger", () => {
    test("THEN overlay does not open", async ({ mount, page }) => {
      const component = await mount("UiControls/HoverOverlay/ClickOverlay");
      await component.getByTestId("hover-overlay-trigger").hover();
      await page.waitForTimeout(800);

      await expect(page.getByTestId("hover-overlay-content")).toBeHidden();
      await expect(component.getByTestId("open-change-log")).toHaveText("");
    });
  });

  test.describe("WHEN trigger is clicked", () => {
    test("THEN overlay opens and stays open", async ({ mount, page }) => {
      const component = await mount("UiControls/HoverOverlay/ClickOverlay");
      await component.getByTestId("hover-overlay-trigger").click();
      const content = page.getByTestId("hover-overlay-content");
      await expect(content).toBeVisible();

      await page.mouse.move(2, 2, { steps: 5 });
      await page.waitForTimeout(1000);

      await expect(content).toBeVisible();
      await expect(component.getByTestId("open-change-log")).toHaveText("open");
    });

    test("THEN Escape closes the overlay", async ({ mount, page }) => {
      const component = await mount("UiControls/HoverOverlay/ClickOverlay");
      await component.getByTestId("hover-overlay-trigger").click();
      const content = page.getByTestId("hover-overlay-content");
      await expect(content).toBeVisible();

      await page.keyboard.press("Escape");

      await expect(content).toBeHidden();
      await expect(component.getByTestId("open-change-log")).toHaveText(
        "open,close",
      );
    });

    test("THEN clicking outside closes the overlay", async ({
      mount,
      page,
    }) => {
      const component = await mount("UiControls/HoverOverlay/ClickOverlay");
      await component.getByTestId("hover-overlay-trigger").click();
      const content = page.getByTestId("hover-overlay-content");
      await expect(content).toBeVisible();

      await page.mouse.click(2, 2);

      await expect(content).toBeHidden();
      await expect(component.getByTestId("open-change-log")).toHaveText(
        "open,close",
      );
    });
  });
});
