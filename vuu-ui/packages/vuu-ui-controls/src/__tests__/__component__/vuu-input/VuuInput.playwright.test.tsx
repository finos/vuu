import { test, expect } from '@playwright/experimental-ct-react';
import React from 'react';
import {
  DefaultVuuInput,
  VuuInputWithValidation,
} from "../../../../../../showcase/src/examples/UiControls/VuuInput.examples";

test.describe('VuuInput', () => {
  test.describe('Given a default VuuInput', () => {
    test('Then basic smoke-test passes', async ({ mount }) => {
      const component = await mount(<DefaultVuuInput />);
      
      const vuuInput = component.getByTestId('vuu-input');
      await expect(vuuInput).toHaveClass(/vuuInput/);
      await expect(vuuInput).toBeVisible();
      
      const input = vuuInput.locator('input');
      await expect(input).toBeVisible();
    });
  });
});

test.describe('Given a VuuInput box with input validation', () => {
  test.describe('WHEN invalid input is provided', () => {
    test('Then box will turn red and error icon will be displayed', async ({ mount }) => {
      const component = await mount(<VuuInputWithValidation />);
      
      const vuuInput = component.getByTestId('vuu-input');
      const input = vuuInput.locator('input');
      await input.fill('hello');
      await input.press('Enter');
      
      await expect(vuuInput).toHaveClass(/vuuInput-error/);
      
      // Check if error icon exists
      const errorIcon = vuuInput.locator('.vuuInput-errorIcon');
      await expect(errorIcon).toBeAttached();
    });

  });

  test.describe('WHEN valid input is provided', () => {
    test('Then no error icon will be displayed', async ({ mount }) => {
      const component = await mount(<VuuInputWithValidation />);
      
      const vuuInput = component.getByTestId('vuu-input');
      const input = vuuInput.locator('input');
      await input.fill('012345');
      await input.press('Enter');
      
      await expect(vuuInput).not.toHaveClass(/vuuInput-error/);
      await expect(vuuInput.locator('.vuuInput-errorIcon')).not.toBeAttached();
    });
  });

  test.describe('WHEN no input is provided', () => {
    test('Then the box will not change', async ({ mount }) => {
      const component = await mount(<VuuInputWithValidation />);
      
      const vuuInput = component.getByTestId('vuu-input');
      const input = vuuInput.locator('input');
      await input.press('Enter');
      
      await expect(vuuInput).toHaveClass(/saltInput-primary/);
    });
  });

  test.describe('WHEN input provided overflows', () => {
    test('Then box will store the complete value', async ({ mount }) => {
      const component = await mount(<VuuInputWithValidation />);
      
      const longValue = '01234567890123456789012345678901234567890123456789012345678901234567890';
      const vuuInput = component.getByTestId('vuu-input');
      const input = vuuInput.locator('input');
      await input.fill(longValue);
      await input.press('Enter');
      
      await expect(input).toHaveValue(longValue);
    });
  });
});
