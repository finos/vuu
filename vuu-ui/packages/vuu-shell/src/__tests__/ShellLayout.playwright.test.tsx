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
    await expect(component.getByText("Start by adding a table")).toBeVisible();
    await expect(
      component.locator(".vuuWorkspaceHost-emptyGrid .vuuGridPlaceholder"),
    ).toBeVisible();
    const workspaceTabs = component.getByRole("tablist", {
      name: "Workspace Tabs",
    });
    await expect(workspaceTabs).toBeVisible();
    await expect(
      workspaceTabs.getByRole("button", { name: "Create Tab" }),
    ).toHaveAttribute("tabindex", "0");
    await expect(workspaceTabs.getByRole("tab")).toHaveCount(0);
  });

  test("uses the baseline shell tracks without grid padding or item borders", async ({
    mount,
  }) => {
    const component = await mount("Shell/GridShellLayout/EmptyGridShell");
    const shell = component.getByTestId("shell");
    const leftNavItem = component.locator("#vuu-shell-left-nav");
    const headerItem = component.locator("#vuu-shell-header");
    const workspaceItem = component.locator("#vuu-shell-workspace-host");
    const contextItem = component.locator("#vuu-shell-context-panel-host");

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
      ".vuuWorkspaceHost-emptyGrid .vuuWorkspaceStartPanel",
    );
    await expect(source).toBeVisible();
    await expect(target).toBeVisible();
    await expect(component.getByText("Start by adding a table")).toBeVisible();
    await target.click();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), sessionKey),
    ).toBeNull();
    await expect(component.getByRole("tab", { name: "Untitled" })).toHaveCount(
      0,
    );
    await source.dragTo(target);

    await expect(
      component.getByRole("tab", { exact: true, name: "Untitled" }),
    ).toBeVisible();
    await expect(component.getByTestId("dropped-test-feature")).toBeVisible();
    await expect(component.getByText("Start by adding a table")).toHaveCount(0);
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
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        if (
          key.startsWith(
            "vuu-workspace:vuu-showcase:table-palette-shell:playwright",
          )
        ) {
          localStorage.removeItem(key);
        }
      }
    });
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
      ".vuuWorkspaceHost-emptyGrid .vuuWorkspaceStartPanel",
    );
    await expect(source).toBeVisible();
    await expect(target).toBeVisible();
    expect(
      await target.evaluate((element) => {
        const { left, top, width, height } = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          left + width / 2,
          top + height / 2,
        );
        return {
          dropTarget: hit?.closest("[data-drop-target]")?.className,
          hit: hit?.className,
        };
      }),
    ).toMatchObject({
      dropTarget: expect.stringContaining("vuuGridPlaceholder"),
    });

    await source.dragTo(target);

    await expect(
      component.getByRole("tab", { exact: true, name: "Untitled" }),
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

    const tabstrip = component.getByRole("tablist", {
      name: "Workspace Tabs",
    });
    const tab = component.getByRole("tab", { name: "Untitled" });
    await expect(tabstrip).toContainClass("vuuTabstrip-primary");
    await expect(tabstrip).toHaveCSS("padding-bottom", "7px");
    await expect(tab).toContainClass("vuuTab-selected");
    await expect(tab).toHaveCSS("border-top-left-radius", "6px");
    await expect(tab).toHaveCSS("border-top-style", "solid");

    await tab.getByRole("button", { name: "context menu" }).click();
    await expect(page.getByRole("menuitem", { name: "Rename" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Close" })).toBeVisible();
    await page.getByRole("menuitem", { name: "Rename" }).click();
    const textbox = tab.getByRole("textbox");
    await textbox.fill("Market Data");
    await textbox.press("Enter");
    await expect(
      component.getByRole("tab", { name: "Market Data" }),
    ).toBeVisible();
    await expect
      .poll(async () =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
          sessionKey,
        ),
      )
      .toMatchObject({
        openWorkspaces: [{ title: "Market Data" }],
      });

    await page.evaluate(() => window.unmount());
    await page.evaluate(() =>
      window.mount({
        story: "Shell/GridShellLayout/EmptyGridShellWithTablePalette",
      }),
    );
    await expect(
      component.getByRole("tab", { name: "Market Data" }),
    ).toBeVisible();

    await component.getByRole("button", { name: "Create Tab" }).click();
    const emptyTab = component.getByRole("tab", { name: "Untitled" });
    await expect(emptyTab).toHaveAttribute("aria-selected", "true");
    await expect(component.getByText("Start by adding a table")).toBeVisible();
    const persistedStartPanel = component.locator(
      ".vuuWorkspaceHost-workspace:not([hidden]) .vuuWorkspaceStartPanel",
    );
    await source.dragTo(persistedStartPanel);
    await expect(
      component
        .locator(".vuuWorkspaceHost-workspace:not([hidden])")
        .getByTestId("dropped-table-feature"),
    ).toHaveAttribute("data-table-name", "SIMUL:instruments");
    await expect(persistedStartPanel).toHaveCount(0);
    await expect
      .poll(async () =>
        page.evaluate(
          ({ sessionKey, snapshotKey }) => {
            const session = JSON.parse(
              localStorage.getItem(sessionKey) ?? "null",
            );
            const snapshot = JSON.parse(
              localStorage.getItem(
                `${snapshotKey}:snapshot:${session.activeWorkspaceInstanceId}`,
              ) ?? "null",
            );
            return snapshot?.snapshot.layout.components;
          },
          { sessionKey, snapshotKey },
        ),
      )
      .toHaveLength(1);
    await component.getByRole("button", { name: "Create Tab" }).click();
    const emptyTab2 = component.getByRole("tab", { name: "Untitled 2" });
    await expect(emptyTab2).toHaveAttribute("aria-selected", "true");
    await expect(component.getByText("Start by adding a table")).toBeVisible();
    await expect
      .poll(async () =>
        page.evaluate(
          (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
          sessionKey,
        ),
      )
      .toMatchObject({
        activeWorkspaceInstanceId: expect.any(String),
        openWorkspaces: [
          { title: "Market Data" },
          { title: "Untitled" },
          { title: "Untitled 2" },
        ],
      });

    await page.evaluate(() => window.unmount());
    await page.evaluate(() =>
      window.mount({
        story: "Shell/GridShellLayout/EmptyGridShellWithTablePalette",
      }),
    );
    await expect(
      component.getByRole("tab", { name: "Market Data" }),
    ).toBeVisible();
    await expect(
      component.getByRole("tab", { exact: true, name: "Untitled" }),
    ).toBeVisible();
    await expect(
      component.getByRole("tab", { name: "Untitled 2" }),
    ).toHaveAttribute("aria-selected", "true");
    await expect(component.getByText("Start by adding a table")).toBeVisible();

    await component
      .getByRole("tab", { name: "Untitled 2" })
      .getByRole("button", { name: "context menu" })
      .click();
    await page.getByRole("menuitem", { name: "Close" }).click();
    await component
      .getByRole("tab", { exact: true, name: "Untitled" })
      .getByRole("button", { name: "context menu" })
      .click();
    await page.getByRole("menuitem", { name: "Close" }).click();
    await component
      .getByRole("tab", { name: "Market Data" })
      .getByRole("button", { name: "context menu" })
      .click();
    await page.getByRole("menuitem", { name: "Close" }).click();
    await expect(component.getByText("Start by adding a table")).toBeVisible();
    await expect(
      component.getByRole("tab", { name: "Market Data" }),
    ).toHaveCount(0);
  });

  test("opens real table settings in the static context panel and restores focus on close", async ({
    mount,
    page,
  }) => {
    const component = await mount(
      "Shell/GridShellLayout/GridShellWithTableSettingsAction",
    );
    const settingsAction = component.getByRole("button", {
      name: "Table settings",
    });
    await settingsAction.click();

    const contextPanel = component.locator("#context-panel");
    await expect(contextPanel).toContainClass("vuuContextPanel-expanded");
    await expect(contextPanel.getByRole("heading")).toHaveText(
      "Table settings",
    );
    await expect(
      contextPanel.getByRole("button", { name: "Close context panel" }),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(contextPanel).not.toContainClass("vuuContextPanel-expanded");
    await expect(settingsAction).toBeFocused();

    await settingsAction.click();
    await contextPanel
      .getByRole("button", { name: "Close context panel" })
      .click();
    await expect(contextPanel).not.toContainClass("vuuContextPanel-expanded");
    await expect(settingsAction).toBeFocused();
  });
});
