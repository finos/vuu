import { expect, type Locator, test } from "../../../../playwright/fixtures";

const expectToFillViewport = async (shell: Locator) => {
  const dimensions = await shell.evaluate((element) => {
    const { height, width } = element.getBoundingClientRect();
    return {
      shell: { height, width },
      viewport: { height: window.innerHeight, width: window.innerWidth },
    };
  });

  expect(dimensions.shell).toEqual(dimensions.viewport);
};

test.describe("ShellLayout", () => {
  test.describe("WHEN rendered with no configuration", () => {
    test("THEN simple workspace is rendered", async ({ mount }) => {
      const component = await mount("Shell/ShellLayout/DefaultShell");
      const shell = component.getByTestId("shell");
      const banner = component.getByRole("banner");

      await expect(shell).toContainClass("vuuShell");
      await expectToFillViewport(shell);
      await expect(banner).toBeVisible();
      await expect(banner).toContainClass("vuuAppHeader");
      await expect(
        component.getByRole("tablist", { name: "Workspace Tabs" }),
      ).toBeVisible();
    });
  });

  test.describe("WHEN rendered with a custom header", () => {
    test("THEN that header is rendered", async ({ mount }) => {
      const component = await mount(
        "Shell/ShellLayout/SimpleShellCustomHeader",
      );

      await expect(
        component.getByRole("banner", { name: "Custom Header" }),
      ).toBeVisible();
      await expect(
        component.getByRole("tablist", { name: "Workspace Tabs" }),
      ).toBeVisible();
    });
  });

  test.describe("WHEN rendered with workspace tabs disabled", () => {
    test("THEN no workspace tabs are rendered", async ({ mount }) => {
      const component = await mount(
        "Shell/ShellLayout/SimpleShellNoWorkspaceTabs",
      );

      await expectToFillViewport(component.getByTestId("shell"));
      await expect(
        component.getByRole("tablist", { name: "Workspace Tabs" }),
      ).toHaveCount(0);
    });
  });

  test.describe("WHEN rendered with a default layout and custom placeholder", () => {
    test("THEN custom layout is rendered", async ({ mount }) => {
      const component = await mount(
        "Shell/ShellLayout/SimpleShellCustomPlaceholder",
      );

      await expectToFillViewport(component.getByTestId("shell"));
      await expect(component.getByTestId("custom-placeholder")).toBeVisible();
    });

    test.describe("AND WHEN workspace tab is added", () => {
      test("THEN custom placeholder is used to create new layout", async ({
        mount,
      }) => {
        const component = await mount(
          "Shell/ShellLayout/SimpleShellCustomPlaceholder",
        );

        await component.getByRole("button", { name: "Create Tab" }).click();

        await expect(component.getByRole("tab")).toHaveCount(2);
        await expect(component.getByTestId("custom-placeholder")).toBeVisible();
      });
    });
  });

  test.describe("WHEN rendered with two layouts and custom placeholders", () => {
    test("THEN custom layout with active index is rendered", async ({
      mount,
    }) => {
      const component = await mount(
        "Shell/ShellLayout/SimpleShellMultiLayouts",
      );

      await expectToFillViewport(component.getByTestId("shell"));
      await expect(component.getByRole("tab")).toHaveCount(3);
      await expect(component.getByTestId("custom-placeholder2")).toBeVisible();
    });

    test.describe("AND WHEN workspace tab is added", () => {
      test("THEN custom placeholder is used to create new layout", async ({
        mount,
      }) => {
        const component = await mount(
          "Shell/ShellLayout/SimpleShellMultiLayouts",
        );

        await component.getByRole("button", { name: "Create Tab" }).click();

        await expect(component.getByRole("tab")).toHaveCount(4);
        await expect(component.getByTestId("custom-placeholder")).toBeVisible();
      });
    });
  });
});
