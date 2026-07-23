import {
  test,
  expect,
  type MountResult,
} from "@playwright/experimental-ct-react";
import {
  NotificationsWithContext,
  ErrorNotificationWithCustomBackground,
} from "../../../../../../showcase/src/examples/Notifications/Toast.examples";

function convertRGBAtoHex(rgba: string): string {
  const match = rgba.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
  );
  if (!match) {
    throw new Error(`Invalid RGBA color: ${rgba}`);
  }
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a === 1 ? hex : `${hex}${toHex(Math.round(a * 255))}`;
}

const noWrapCases = [
  {
    target: "content" as const,
    inputLabel: "Notification Body",
    longText:
      "This is a very long notification body text that should not wrap onto multiple lines.",
    selector: ".vuuToastNotification-content",
  },
  {
    target: "header" as const,
    inputLabel: "Notification Header",
    longText:
      "This is a very long notification header text that should not wrap onto multiple lines.",
    selector: ".vuuToastNotification-header",
  },
];


test.describe("Given a toast notification", () => {
  test("should display notification when trigger is clicked and hide when hide button is clicked", async ({
    mount,
  }) => {
    const component: MountResult = await mount(<NotificationsWithContext />);

    // Set custom header
    const headerInput = component.getByLabel("Notification Header");
    await headerInput.fill("Custom Header");

    // Set dismissal to manual
    const dismissalDropdown = component.locator(
      'label:has-text("Dismissal") ~ [role="combobox"]',
    );
    await dismissalDropdown.click();
    await component.page().locator('[role="option"]:has-text("Manual")').click();

    // Trigger notification
    const triggerButton = component.locator('button:has-text("trigger notifications")');
    await triggerButton.click();

    // Validate notification appears
    const notification = component.page().locator('.vuuToastNotification');
    await expect(notification).toBeVisible();

    // Hide notification
    const hideButton = component.locator('button:has-text("hide notifications")');
    await hideButton.click();

    // Validate notification is hidden
    await expect(notification).not.toBeVisible();
  });

  for (const { target, inputLabel, longText, selector } of noWrapCases) {
    test(`should apply no wrap for long ${target} text`, async ({ mount }) => {
      const component: MountResult = await mount(<NotificationsWithContext />);

      const input = component.getByLabel(inputLabel);
      await input.fill(longText);

      const triggerButton = component.locator(
        'button:has-text("trigger notifications")',
      );
      await triggerButton.click();

      const notificationText = component.page().locator(selector);
      await expect(notificationText).toBeVisible();

      const lineHeight = await notificationText.evaluate((el) =>
        parseInt(window.getComputedStyle(el).lineHeight),
      );
      const height = await notificationText.evaluate((el) => el.clientHeight);
      const isWrapped = height > lineHeight * 1.5; // More than 1.5 lines
      expect(isWrapped).toBe(false);
    });
  }

  test("should display error notification with custom background and borders", async ({
    mount,
  }) => {
    const component: MountResult = await mount(
      <ErrorNotificationWithCustomBackground />
    );

    // Validate notification appears
    const notification = component.page().locator('.vuuToastNotification');
    await expect(notification).toBeVisible();

    // Check border color
    const borderColor = convertRGBAtoHex(
      await notification.evaluate(el =>
        window.getComputedStyle(el).borderColor
      )
    );

    // Check border width
    const borderWidth = await notification.evaluate(el =>
      window.getComputedStyle(el).borderWidth
    );

    // Check background color
    const backgroundColor = convertRGBAtoHex(
      await notification.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
    );

    // Verify border color is set
    expect(borderColor).toBe("#ff4444"); // Not transparent

    // Verify border width is set
    expect(borderWidth).toBe("2px");

    // Verify background color is the custom light red
    expect(backgroundColor).toBe("#ffe6e6"); // Should have RGB color
  });
});