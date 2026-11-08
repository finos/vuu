import { expect, test } from "../../../../../../playwright/fixtures";

test.describe("NotificationsProvider", () => {
  test("shows notifications from a nested provider once, in the outer provider", async ({
    mount,
  }) => {
    const component = await mount(
      "Notifications/NotificationOrigins/NestedProviders",
    );
    await component.getByRole("button", { name: "Raise" }).click();

    const page = component.page();
    await expect(page.locator(".vuuToastNotification")).toHaveCount(1);
    await expect(
      page.getByRole("list", { name: "Intercepted" }).getByRole("listitem"),
    ).toHaveCount(1);
  });

  test("does not show notifications the interceptor suppresses", async ({
    mount,
  }) => {
    const component = await mount(
      "Notifications/NotificationOrigins/SuppressedNotifications",
    );
    await component.getByRole("button", { name: "Raise" }).click();

    const page = component.page();
    await expect(
      page.getByRole("list", { name: "Intercepted" }).getByRole("listitem"),
    ).toHaveCount(1);
    await expect(page.locator(".vuuToastNotification")).toHaveCount(0);
  });

  test("tags notifications with their origin, keeping one the caller sets", async ({
    mount,
  }) => {
    const component = await mount(
      "Notifications/NotificationOrigins/NotificationOrigins",
    );
    for (const name of ["Host", "Viewer", "Explicit", "No origin"]) {
      await component.getByRole("button", { name }).click();
    }

    await expect(
      component
        .page()
        .getByRole("list", { name: "Intercepted" })
        .getByRole("listitem"),
    ).toHaveText([
      'Host {"connectionId":"simul","moduleId":"host"}',
      'Viewer {"connectionId":"risk","moduleId":"viewer","parentModuleId":"host"}',
      'Explicit {"moduleId":"x"}',
      "No origin null",
    ]);
  });
});
