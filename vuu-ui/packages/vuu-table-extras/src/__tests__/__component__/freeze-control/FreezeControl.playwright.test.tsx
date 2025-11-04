import {
  test,
  expect,
  type MountResult,
} from "@playwright/experimental-ct-react";
import type { Locator } from "@playwright/experimental-ct-core";
import { FreezeControl } from "../../../freeze-control/FreezeControl";
import React from "react";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import * as useFreezeControlModule from "../../../freeze-control/useFreezeControl";
import type { FreezeProps } from "../../../freeze-control/useFreezeControl";

const createMockDataSource = (isFrozen = false): Partial<DataSource> => ({
  isFrozen,
  table: { module: "TEST", table: "test" },
  freeze: () => void 0,
  unfreeze: () => void 0,
  subscribe: async () => void 0,
  unsubscribe: () => void 0,
});

// Mock to return fake newRecords
const createMockHook = (isFrozen: boolean, newRecordCount: number) => {
  return (_: FreezeProps) => ({
    isFrozen,
    newRecordCount,
    onToggleChange: () => void 0,
  });
};

// Section below just to improve test readability
type ComponentFixture = MountResult;
type LocatorType = Locator;

const verifyBadgeEquals = async (badge: LocatorType, expectedValue: number) => {
  await expect(badge).toHaveText(String(expectedValue));
};

const verifyNoOverflow = async (badge: LocatorType) => {
  await expect(badge).not.toHaveAttribute("data-overflow", "true");
  await expect(badge).not.toHaveClass(/FreezeControl-customBadge-overflow/);
};

const verifyPlusSignNotVisible = async (component: ComponentFixture) => {
  await expect(component.locator(".FreezeControl-plus")).not.toBeVisible();
};

const verifyOverflow = async (badge: LocatorType) => {
  await expect(badge).toHaveAttribute("data-overflow", "true");
  await expect(badge).toHaveClass(/FreezeControl-customBadge-overflow/);
};

const verifyPlusSignVisible = async (component: ComponentFixture) => {
  const plusSign = component.locator(".FreezeControl-plus");
  await expect(plusSign).toBeVisible();
  await expect(plusSign).toHaveText("+");
};

test.describe("Given a FreezeControl", () => {
  test("THEN it loads with Freeze and Active buttons, with Active selected", async ({
    mount,
  }) => {
    const dataSource = createMockDataSource(false);
    const component = await mount(
      <LocalDataSourceProvider>
        <FreezeControl dataSource={dataSource as DataSource} />
      </LocalDataSourceProvider>,
    );

    const activeButton = component.locator('button[value="live"]');
    const freezeButton = component.locator('button[value="frozen"]');

    await expect(activeButton).toBeVisible();
    await expect(freezeButton).toBeVisible();

    const buttonGroup = component.locator(".saltToggleButtonGroup");
    await expect(buttonGroup).toBeVisible();

    const activeWrapper = component
      .locator(".FreezeControl-buttonWrapper-active")
      .first();
    await expect(activeWrapper).toBeVisible();
  });

  test("WHEN frozen THEN New Orders section appears with counter at 0", async ({
    mount,
  }) => {
    const dataSource = createMockDataSource(true);
    const component = await mount(
      <LocalDataSourceProvider>
        <FreezeControl dataSource={dataSource as DataSource} />
      </LocalDataSourceProvider>,
    );

    const newOrdersSection = component.locator(".FreezeControl-newOrders");
    await expect(newOrdersSection).toBeVisible();
    await expect(newOrdersSection).toContainText("New Orders");

    const badge = component.locator(".FreezeControl-customBadge");
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("0");
  });

  test("WHEN badge value is 99 or less THEN it displays the exact number", async ({
    mount,
  }) => {
    const dataSource = createMockDataSource(true);
    const component = await mount(
      <LocalDataSourceProvider>
        <FreezeControl dataSource={dataSource as DataSource} />
      </LocalDataSourceProvider>,
    );

    const badge = component.locator(".FreezeControl-customBadge");
    await expect(badge).toBeVisible();

    await verifyBadgeEquals(badge, 0);
    await verifyNoOverflow(badge);
    await verifyPlusSignNotVisible(component);
  });

  test("WHEN badge value is exactly 99 THEN it shows 99 without plus sign", async ({
    mount,
  }) => {
    (
      useFreezeControlModule as {
        useFreezeControl: ReturnType<typeof createMockHook>;
      }
    ).useFreezeControl = createMockHook(true, 99);

    const dataSource = createMockDataSource(true);
    const component = await mount(
      <LocalDataSourceProvider>
        <FreezeControl dataSource={dataSource as DataSource} />
      </LocalDataSourceProvider>,
    );

    const badge = component.locator(".FreezeControl-customBadge");
    await expect(badge).toBeVisible();

    // Badge should show 99, no overflow with no plus sign
    await verifyBadgeEquals(badge, 99);
    await verifyNoOverflow(badge);
    await verifyPlusSignNotVisible(component);
  });

  test("WHEN badge value is 100 or more THEN it shows 99+ with plus sign and overflow attributes", async ({
    mount,
  }) => {
    (
      useFreezeControlModule as {
        useFreezeControl: ReturnType<typeof createMockHook>;
      }
    ).useFreezeControl = createMockHook(true, 100);

    const dataSource = createMockDataSource(true);
    const component = await mount(
      <LocalDataSourceProvider>
        <FreezeControl dataSource={dataSource as DataSource} />
      </LocalDataSourceProvider>,
    );

    const badge = component.locator(".FreezeControl-customBadge");
    await expect(badge).toBeVisible();

    // Badge should shows 99+, have overflow and plus sign visible
    await expect(badge).toHaveText("99+");
    await verifyOverflow(badge);
    await verifyPlusSignVisible(component);
  });
});
