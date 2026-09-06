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
      component.getByText(
        "Drop a feature here or select a workspace from My Layouts to begin.",
      ),
    ).toBeVisible();
    await expect(
      component.locator(".vuuWorkspaceHost-emptyGrid .vuuGridPlaceholder"),
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

  test("creates and persists the first Untitled workspace only after a palette drop", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      "Shell/GridShellLayout/EmptyGridShellWithPalette",
    );
    const sessionKey =
      "vuu-workspace:vuu-showcase:empty-shell:playwright:application-session";

    expect(
      await page.evaluate((key) => localStorage.getItem(key), sessionKey),
    ).toBeNull();
    await expect(component.getByRole("tab", { name: "Untitled" })).toHaveCount(
      0,
    );

    const source = component.locator(".vuuFeatureList-item", {
      hasText: "Test Feature",
    });
    const target = component.locator(
      ".vuuWorkspaceHost-emptyGrid .vuuGridPlaceholder",
    );
    await expect(source).toBeVisible();
    await expect(target).toBeVisible();
    await target.click();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), sessionKey),
    ).toBeNull();
    await expect(component.getByRole("tab", { name: "Untitled" })).toHaveCount(
      0,
    );
    await source.dragTo(target);

    await expect(
      component.getByRole("tab", { name: "Untitled" }),
    ).toBeVisible();
    await expect(component.getByTestId("dropped-test-feature")).toBeVisible();
    const session = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
      sessionKey,
    );
    expect(session.workspaceOrder).toHaveLength(1);
    expect(session.activeWorkspaceInstanceId).toBe(session.workspaceOrder[0]);
    expect(session.openWorkspaces).toEqual([
      {
        instanceId: session.workspaceOrder[0],
        snapshotId: session.workspaceOrder[0],
        title: "Untitled",
      },
    ]);
    expect(
      await page.evaluate(
        (key) => localStorage.getItem(`${key}:snapshot-index`),
        "vuu-workspace:vuu-showcase:empty-shell:playwright",
      ),
    ).not.toBeNull();
  });

  test("drags a VUU table from static navigation into the empty workspace", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      "Shell/GridShellLayout/EmptyGridShellWithTablePalette",
    );
    const sessionKey =
      "vuu-workspace:vuu-showcase:table-palette-shell:playwright:application-session";
    const snapshotKey =
      "vuu-workspace:vuu-showcase:table-palette-shell:playwright";

    await component.getByRole("tab", { name: "VUU TABLES" }).click();
    const source = component
      .locator(".vuuFeatureList-item", {
        hasText: /^SIMUL Instruments\s*$/,
      })
      .first();
    const target = component.locator(
      ".vuuWorkspaceHost-emptyGrid .vuuGridPlaceholder",
    );
    await expect(source).toBeVisible();
    await expect(target).toBeVisible();

    await source.dragTo(target);

    await expect(
      component.getByRole("tab", { name: "Untitled" }),
    ).toBeVisible();
    await expect(
      component.getByTestId("dropped-table-feature"),
    ).toHaveAttribute("data-table-name", "SIMUL:instruments");
    const session = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
      sessionKey,
    );
    expect(session.workspaceOrder).toHaveLength(1);
    expect(session.openWorkspaces[0].title).toBe("Untitled");
    const snapshot = await page.evaluate(
      ({ key, workspaceId }) =>
        JSON.parse(
          localStorage.getItem(`${key}:snapshot:${workspaceId}`) ?? "null",
        ),
      { key: snapshotKey, workspaceId: session.workspaceOrder[0] },
    );
    expect(snapshot.snapshot.layout.components).toHaveLength(1);
    expect(snapshot.snapshot.layout.components[0]).toMatchObject({
      settings: {
        ComponentProps: {
          tableSchema: {
            table: {
              module: "SIMUL",
              table: "instruments",
            },
          },
        },
      },
      type: "vuu-dynamic-feature",
    });
  });
});
