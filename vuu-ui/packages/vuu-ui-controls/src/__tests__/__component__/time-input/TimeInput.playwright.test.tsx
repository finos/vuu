import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { TestTimeInput } from "../../../../../../showcase/src/examples/UiControls/TimeInput.examples";

test.describe("TimeInput", () => {
  test.describe("WHEN uncontrolled", () => {
    test.describe("AND passed no defaultValue", () => {
      test("renders as expected, placeholder shows, value is empty", async ({ mount }) => {
        const component = await mount(<TestTimeInput />);
        
        // Wait for component to stabilize (matching Cypress wait)
        await component.waitFor({ timeout: 100 });
        
        const timeinput = component.getByTestId("timeinput");
        await expect(timeinput).toHaveClass(/vuuTimeInput/);
        await expect(timeinput).toHaveValue("");
      });
    });
    
    test.describe("AND passed defaultValue", () => {
      test("renders as expected, value is visible, value is as expected", async ({ mount }) => {
        const component = await mount(<TestTimeInput defaultValue="00:00:00" />);
        
        // Wait for component to stabilize (matching Cypress wait)
        await component.waitFor({ timeout: 100 });
        
        const timeinput = component.getByTestId("timeinput");
        await expect(timeinput).toHaveClass(/vuuTimeInput/);
        await expect(timeinput).toHaveValue("00:00:00");
      });
    });
  });

  test.describe("focus management", () => {
    test.describe("WHEN focus enters control via keyboard, forwards", () => {
      test("THEN control is focused and hours are selected", async ({ mount }) => {
        const component = await mount(<TestTimeInput defaultValue="00:00:00" />);
        
        const preTimeinput = component.getByTestId("pre-timeinput");
        const preInput = preTimeinput.locator("input");
        await preInput.focus();
        await preInput.press("Tab");
        
        const timeinput = component.getByTestId("timeinput");
        await expect(timeinput).toBeFocused();
        
        // Check selection range (0, 2) for hours
        const selectionStart = await timeinput.evaluate(el => (el as HTMLInputElement).selectionStart);
        const selectionEnd = await timeinput.evaluate(el => (el as HTMLInputElement).selectionEnd);
        expect(selectionStart).toBe(0);
        expect(selectionEnd).toBe(2);
      });
      
      test.describe("WHEN left/right arrow keys used", () => {
        test("THEN right arrow key shifts selection right", async ({ mount, browserName }) => {
          // Skip on Firefox and WebKit - selection range behavior needs more testing in these browsers
          test.skip(browserName === 'firefox' || browserName === 'webkit', 'Selection range testing needs more investigation in Firefox and WebKit');
          
          const component = await mount(<TestTimeInput defaultValue="00:00:00" />);
          
          const preTimeinput = component.getByTestId("pre-timeinput");
          const preInput = preTimeinput.locator("input");
          await preInput.focus();
          await preInput.press("Tab");
          
          const timeinput = component.getByTestId("timeinput");
          
          // Test right arrow navigation with retry logic
          await timeinput.press("ArrowRight");
          await expect(async () => {
            const selectionStart = await timeinput.evaluate(el => (el as HTMLInputElement).selectionStart);
            const selectionEnd = await timeinput.evaluate(el => (el as HTMLInputElement).selectionEnd);
            expect(selectionStart).toBe(3);
            expect(selectionEnd).toBe(5);
          }).toPass({ timeout: 1000 });
          
          await timeinput.press("ArrowRight");
          await expect(async () => {
            const selectionStart = await timeinput.evaluate(el => (el as HTMLInputElement).selectionStart);
            const selectionEnd = await timeinput.evaluate(el => (el as HTMLInputElement).selectionEnd);
            expect(selectionStart).toBe(6);
            expect(selectionEnd).toBe(8);
          }).toPass({ timeout: 1000 });
          
          // Should stay at end
          await timeinput.press("ArrowRight");
          await expect(async () => {
            const selectionStart = await timeinput.evaluate(el => (el as HTMLInputElement).selectionStart);
            const selectionEnd = await timeinput.evaluate(el => (el as HTMLInputElement).selectionEnd);
            expect(selectionStart).toBe(6);
            expect(selectionEnd).toBe(8);
          }).toPass({ timeout: 1000 });
        });
        
        test("THEN left arrow key shifts selection left", async ({ mount, browserName }) => {
          // Skip on Firefox and WebKit - selection range behavior needs more testing in these browsers
          test.skip(browserName === 'firefox' || browserName === 'webkit', 'Selection range testing needs more investigation in Firefox and WebKit');
          
          const component = await mount(<TestTimeInput defaultValue="00:00:00" />);
          
          const preTimeinput = component.getByTestId("pre-timeinput");
          const preInput = preTimeinput.locator("input");
          await preInput.focus();
          await preInput.press("Tab");
          
          const timeinput = component.getByTestId("timeinput");
          
          // Navigate to end first
          await timeinput.press("ArrowRight");
          await timeinput.press("ArrowRight");
          
          // Test left arrow navigation with retry logic
          await timeinput.press("ArrowLeft");
          await expect(async () => {
            const selectionStart = await timeinput.evaluate(el => (el as HTMLInputElement).selectionStart);
            const selectionEnd = await timeinput.evaluate(el => (el as HTMLInputElement).selectionEnd);
            expect(selectionStart).toBe(3);
            expect(selectionEnd).toBe(5);
          }).toPass({ timeout: 1000 });
          
          await timeinput.press("ArrowLeft");
          await expect(async () => {
            const selectionStart = await timeinput.evaluate(el => (el as HTMLInputElement).selectionStart);
            const selectionEnd = await timeinput.evaluate(el => (el as HTMLInputElement).selectionEnd);
            expect(selectionStart).toBe(0);
            expect(selectionEnd).toBe(2);
          }).toPass({ timeout: 1000 });
          
          // Should stay at beginning
          await timeinput.press("ArrowLeft");
          await expect(async () => {
            const selectionStart = await timeinput.evaluate(el => (el as HTMLInputElement).selectionStart);
            const selectionEnd = await timeinput.evaluate(el => (el as HTMLInputElement).selectionEnd);
            expect(selectionStart).toBe(0);
            expect(selectionEnd).toBe(2);
          }).toPass({ timeout: 1000 });
        });
      });
    });
  });
});
