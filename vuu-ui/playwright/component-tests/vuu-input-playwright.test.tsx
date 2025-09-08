import { test, expect } from '@playwright/experimental-ct-react';
import React from 'react';
import { TestVuuInput } from './TestVuuInput';

test.describe('VuuInput', () => {
  test.describe('Given a default VuuInput', () => {
    test('Then basic smoke-test passes', async ({ mount }) => {
      const component = await mount(<TestVuuInput />);
      
      await expect(component).toHaveClass('vuuInput');
      await expect(component).toBeVisible();
      
      const input = component.locator('input');
      await expect(input).toBeVisible();
    });
  });
});

test.describe('Given a VuuInput box with input validation', () => {
  test.describe('WHEN invalid input is provided', () => {
    test('Then box will turn red and tooltip will display on hover', async ({ mount }) => {
      const component = await mount(<TestVuuInput errorMessage="Field is expecting a number" />);
      
      const input = component.locator('input');
      await input.fill('hello');
      await input.press('Enter');
      
      await expect(component).toHaveClass(/vuuInput-error/);
      
      const errorIcon = component.locator('.vuuInput-errorIcon');
      await errorIcon.hover();
      
      // Wait for tooltip to appear
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await expect(component.locator('.saltTooltip')).toBeVisible();
    });
  });

  test.describe('WHEN valid input is provided', () => {
    test('Then no error icon will be displayed', async ({ mount }) => {
      const component = await mount(<TestVuuInput />);
      
      const input = component.locator('input');
      await input.fill('012345');
      await input.press('Enter');
      
      await expect(component).not.toHaveClass(/vuuInput-error/);
      await expect(component.locator('.vuuInput-errorIcon')).not.toBeAttached();
    });
  });

  test.describe('WHEN no input is provided', () => {
    test('Then the box will not change', async ({ mount }) => {
      const component = await mount(<TestVuuInput />);
      
      const input = component.locator('input');
      await input.press('Enter');
      
      await expect(component).toHaveClass('vuuInput');
    });
  });

  test.describe('WHEN input provided overflows', () => {
    test('Then box will store the complete value', async ({ mount }) => {
      const component = await mount(<TestVuuInput />);
      
      const longValue = '01234567890123456789012345678901234567890123456789012345678901234567890';
      const input = component.locator('input');
      await input.fill(longValue);
      await input.press('Enter');
      
      await expect(input).toHaveValue(longValue);
    });
  });
});
