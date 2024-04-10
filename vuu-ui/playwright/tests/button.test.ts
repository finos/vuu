import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
    const themes: String[] = ['salt', 'vuu']
    const themeModes: String[] = ['light', 'dark']
    const densities: String[] = ['high', 'medium', 'low', 'touch']

    for (let i = 0; i < themes.length; i++) {
        for (let j = 0; j < themeModes.length; j++) {
            for (let k = 0; k < densities.length; k++) {
                await page.goto('http://localhost:5173/salt/Button/ButtonVariations?standalone&theme='+themes[i]+'#themeMode='+themeModes[j]+',density='+densities[k]);
                await page.waitForTimeout(300);
                await expect(page).toHaveScreenshot();
            }
        }
    }
});