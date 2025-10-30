import { test, expect } from "@playwright/experimental-ct-react";
import { FreezeControl } from "../../../freeze-control/FreezeControl";
import React from "react";
import type { DataSource } from "@vuu-ui/vuu-data-types";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";

const createMockDataSource = (isFrozen = false): Partial<DataSource> => ({
  isFrozen,
  table: { module: "TEST", table: "test" },
  freeze: () => void 0,
  unfreeze: () => void 0,
  subscribe: async () => void 0,
  unsubscribe: () => void 0,
});

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
});
