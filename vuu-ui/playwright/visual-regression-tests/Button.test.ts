import { test, expect } from "@playwright/test";

test.describe("Button", () => {
  test("text only", async ({ page }) => {
    for (const theme of ["vuu", "salt"]) {
      for (const themeMode of ["light", "dark"]) {
        for (const density of ["high", "medium", "low", "touch"]) {
          await page.goto(
            `http://localhost:4173/salt/Button/ButtonTextOnly?standalone&theme=${theme}-theme#themeMode=${themeMode},density=${density}`
          );
          await page.waitForFunction(() => document.fonts.ready);
          await expect(await page.screenshot()).toMatchSnapshot({
            name: [
              "Button",
              "text-only",
              `${theme}-${themeMode}-${density}.png`,
            ],
            maxDiffPixelRatio: 0.05,
          });
        }
      }
    }
  });

  test("icon only", async ({ page }) => {
    for (const theme of ["vuu", "salt"]) {
      for (const themeMode of ["light", "dark"]) {
        for (const density of ["high", "medium", "low", "touch"]) {
          await page.goto(
            `http://localhost:4173/salt/Button/ButtonIconOnly?standalone&theme=${theme}-theme#themeMode=${themeMode},density=${density}`
          );
          await page.waitForFunction(() => document.fonts.ready);
          await expect(await page.screenshot()).toMatchSnapshot({
            name: [
              "Button",
              "icon-only",
              `${theme}-${themeMode}-${density}.png`,
            ],
            maxDiffPixelRatio: 0.05,
          });
        }
      }
    }
  });
});
