import { expect, type Locator, test } from "../../../../playwright/fixtures";

const expectToFillViewport = async (shell: Locator) => {
  const dimensions = await shell.evaluate((element) => {
    const { height, width } = element.getBoundingClientRect();
    return {
      shell: {
        height,
        width,
        x: element.getBoundingClientRect().x,
        y: element.getBoundingClientRect().y,
      },
      viewport: { height: window.innerHeight, width: window.innerWidth },
    };
  });

  await expect(dimensions.shell).toEqual({
    ...dimensions.viewport,
    x: 0,
    y: 0,
  });
};

test.describe("ShellLayout", () => {
  test("fills the viewport with visible static navigation and no default workspace", async ({
    mount,
  }) => {
    const component = await mount("Shell/GridShellLayout/EmptyGridShell");
    const shell = component.getByTestId("shell");
    const leftNav = component.locator(".vuuLeftNav");
    const workspaceHost = component.locator("#vuu-shell-workspace-host");

    await expect(shell).toContainClass("vuuShell");
    await expect(shell).toContainClass("vuuFullPage");
    await expectToFillViewport(shell);
    await expect(leftNav).toBeVisible();
    await expect(workspaceHost).toContainClass("vuuShell-content");
    await expect(
      component.getByText("Select a workspace from My Layouts"),
    ).toBeVisible();
    await expect(
      component.getByRole("tablist", { name: "Workspace Tabs" }),
    ).toHaveCount(0);
  });

  test("uses the baseline shell tracks without grid padding or item borders", async ({
    mount,
  }) => {
    const component = await mount("Shell/GridShellLayout/EmptyGridShell");
    const shell = component.getByTestId("shell");
    const leftNavItem = component.locator("#vuu-shell-left-nav");
    const headerItem = component.locator("#vuu-shell-header");
    const workspaceItem = component.locator("#vuu-shell-workspace-host");
    const contextItem = component.locator("#vuu-shell-context");

    await expect(shell).toHaveCSS("padding", "0px");
    await expect(leftNavItem).toHaveCSS("border-top-width", "0px");
    await expect(leftNavItem).toHaveCSS("width", "240px");
    await expect(headerItem).toHaveCSS("height", "40px");
    await expect(workspaceItem).toHaveCSS("padding", "8px");
    await expect(contextItem).toHaveCSS("width", "0px");
    expect(await leftNavItem.evaluate((element) => element.clientHeight)).toBe(
      await shell.evaluate((element) => element.clientHeight),
    );

    await component.getByRole("tab", { name: "MY LAYOUTS" }).click();
    await expect(leftNavItem).toHaveCSS("width", "540px");
    await expect(component.locator(".vuuLeftNav-menu-secondary")).toBeVisible();
  });
});
