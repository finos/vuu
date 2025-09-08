import { test, expect } from "@playwright/test";

test("test", async ({ page }) => {
  const themes: string[] = ["salt", "vuu"];
  const themeModes: string[] = ["light", "dark"];
  const densities: string[] = ["high", "medium", "low", "touch"];

  for (let i = 0; i < themes.length; i++) {
    for (let j = 0; j < themeModes.length; j++) {
      for (let k = 0; k < densities.length; k++) {
        const queryString = `&theme=${themes[i]}#themeMode=${themeModes[j]},density=${densities[k]}`;
        await page.goto(
          `http://localhost:4173/salt/Button/ButtonVariations?standalone${queryString}`
        );
        await expect(page).toHaveScreenshot(
          `ButtonVariations-${themes[i]}-${themeModes[j]}-${densities[k]}-density.png`
        );
      }
    }
  }
});
