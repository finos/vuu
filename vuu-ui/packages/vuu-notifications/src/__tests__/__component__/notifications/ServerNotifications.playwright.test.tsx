import { expect, test } from "../../../../../../playwright/fixtures";

test.describe("useServerNotifications", () => {
  test("shows RPC response notifications at the server's level", async ({
    mount,
  }) => {
    const component = await mount(
      "Notifications/ServerNotifications/ServerNotifications",
    );
    const page = component.page();

    await component.getByRole("button", { name: "Error" }).click();
    const error = page.locator(".vuuToastNotification-error");
    await expect(error).toContainText("Failed to process cancelOrder request");
    await expect(error).toContainText("Order 123 not found");

    await component.getByRole("button", { name: "Warning" }).click();
    await expect(page.locator(".vuuToastNotification-warning")).toContainText(
      "Warning",
    );

    await component.getByRole("button", { name: "Untyped" }).click();
    await expect(page.locator(".vuuToastNotification-success")).toContainText(
      "Success",
    );
  });
});
