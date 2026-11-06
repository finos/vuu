import { expect, test } from "../../../../../playwright/fixtures";
import { GridLayoutDriver } from "./GridLayoutDriver";

const fixture = "GridLayout/GridLayoutTestFixture/GridLayoutTestFixture";

const width = async (grid: GridLayoutDriver, id: string) =>
  (await grid.item(id).boundingBox())?.width ?? 0;
const height = async (grid: GridLayoutDriver, id: string) =>
  (await grid.item(id).boundingBox())?.height ?? 0;

test.describe("GridLayout splitter keyboard resizing", () => {
  test("splitter is a Tab stop with an accessible name", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "resizable" });
    const grid = new GridLayoutDriver(component, page);
    const splitter = grid.separator();

    await expect(splitter).toHaveAttribute("tabindex", "0");
    await expect(splitter).toHaveAccessibleName("Resize Fixed and Flexible");
    await splitter.focus();
    await expect(splitter).toBeFocused();
  });

  test("arrow keys move a column splitter, Shift moves it 1px", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "resizable" });
    const grid = new GridLayoutDriver(component, page);
    const fixedBefore = await width(grid, "fixed");
    const flexibleBefore = await width(grid, "flexible");

    await grid.separator().focus();
    await page.keyboard.press("ArrowRight");
    expect(await width(grid, "fixed")).toBeCloseTo(fixedBefore + 10, 0);
    expect(await width(grid, "flexible")).toBeCloseTo(flexibleBefore - 10, 0);

    await page.keyboard.press("Shift+ArrowLeft");
    expect(await width(grid, "fixed")).toBeCloseTo(fixedBefore + 9, 0);

    await page.keyboard.press("ArrowLeft");
    expect(await width(grid, "fixed")).toBeCloseTo(fixedBefore - 1, 0);
  });

  test("Up/Down move a row splitter and Left/Right are ignored", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "resizable-vertical" });
    const grid = new GridLayoutDriver(component, page);
    const topBefore = await height(grid, "top");

    await grid.separator().focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    expect(await height(grid, "top")).toBeCloseTo(topBefore, 0);

    await page.keyboard.press("ArrowDown");
    expect(await height(grid, "top")).toBeCloseTo(topBefore + 10, 0);
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    expect(await height(grid, "top")).toBeCloseTo(topBefore - 10, 0);
  });

  test("Home and End move the splitter to the minimum sizes", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "resizable" });
    const grid = new GridLayoutDriver(component, page);

    await grid.separator().focus();
    await page.keyboard.press("End");
    expect(await width(grid, "flexible")).toBeCloseTo(80, 0);

    await page.keyboard.press("Home");
    expect(await width(grid, "fixed")).toBeCloseTo(150, 0);
  });

  test("commits once per key press, including a held key", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "resizable" });
    const grid = new GridLayoutDriver(component, page);
    const layout = grid.layout("ct-grid");
    const fixedBefore = await width(grid, "fixed");

    await grid.separator().focus();
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ArrowRight");
    await expect(layout).toHaveAttribute("data-commit-count", "0");
    await page.keyboard.up("ArrowRight");
    await expect(layout).toHaveAttribute("data-commit-count", "1");
    expect(await width(grid, "fixed")).toBeCloseTo(fixedBefore + 30, 0);

    await page.keyboard.press("ArrowRight");
    await expect(layout).toHaveAttribute("data-commit-count", "2");
  });

  test("Escape while a key is held restores the layout", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "resizable" });
    const grid = new GridLayoutDriver(component, page);
    const layout = grid.layout("ct-grid");
    const fixedBefore = await width(grid, "fixed");

    await grid.separator().focus();
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ArrowRight");
    expect(await width(grid, "fixed")).toBeCloseTo(fixedBefore + 20, 0);
    await page.keyboard.press("Escape");
    await page.keyboard.up("ArrowRight");

    expect(await width(grid, "fixed")).toBeCloseTo(fixedBefore, 0);
    await expect(layout).toHaveAttribute("data-commit-count", "0");
    await expect(grid.separator()).toBeFocused();
  });

  test("moving focus away commits a resize in progress", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "resizable" });
    const grid = new GridLayoutDriver(component, page);
    const layout = grid.layout("ct-grid");
    const fixedBefore = await width(grid, "fixed");

    await grid.separator().focus();
    await page.keyboard.down("ArrowRight");
    await grid.item("fixed").getByRole("button", { name: "Close" }).focus();
    await page.keyboard.up("ArrowRight");

    await expect(layout).toHaveAttribute("data-commit-count", "1");
    expect(await width(grid, "fixed")).toBeCloseTo(fixedBefore + 10, 0);
  });

  test("aria values track the layout", async ({ mount, page }) => {
    const component = await mount(fixture, { variant: "resizable" });
    const grid = new GridLayoutDriver(component, page);
    const splitter = grid.separator();

    const fixed = await width(grid, "fixed");
    const flexible = await width(grid, "flexible");
    await splitter.focus();
    await expect(splitter).toHaveAttribute(
      "aria-valuenow",
      String(Math.round((fixed / (fixed + flexible)) * 100)),
    );
    await expect(splitter).toHaveAttribute("aria-valuemin", /\d+/);
    await expect(splitter).toHaveAttribute("aria-valuemax", /\d+/);

    await page.keyboard.press("End");
    const max = await splitter.getAttribute("aria-valuemax");
    await expect(splitter).toHaveAttribute("aria-valuenow", max ?? "");

    await page.keyboard.press("Home");
    const min = await splitter.getAttribute("aria-valuemin");
    await expect(splitter).toHaveAttribute("aria-valuenow", min ?? "");
  });

  test("a mouse resize leaves the splitter focused for keyboard adjustment", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "resizable" });
    const grid = new GridLayoutDriver(component, page);

    await grid.resize(grid.separator(), 40);
    await expect(grid.separator()).toBeFocused();

    const fixedAfterDrag = await width(grid, "fixed");
    await page.keyboard.press("ArrowLeft");
    expect(await width(grid, "fixed")).toBeCloseTo(fixedAfterDrag - 10, 0);
  });

  test("keeps focus when a keyboard resize adds a grid track", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, {
      variant: "mixed-resizable-boundary",
    });
    const grid = new GridLayoutDriver(component, page);
    const navBefore = await width(grid, "nav");

    await grid.separator().focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    await expect(grid.separator()).toBeFocused();
    expect(await width(grid, "nav")).toBeCloseTo(navBefore + 20, 0);
    const toolbar = await grid.item("toolbar").boundingBox();
    const content = await grid.item("content").boundingBox();
    expect(toolbar?.x).toBeCloseTo(content?.x ?? 0, 0);
  });

  test("a column splitter in a 2x2 grid resizes only its own row", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "focus-order" });
    const grid = new GridLayoutDriver(component, page);
    const [a, b, c, d] = await Promise.all(
      ["a", "b", "c", "d"].map((id) => width(grid, id)),
    );
    const expectWidths = async (shift: number) => {
      expect(await width(grid, "a")).toBeCloseTo(a + shift, 0);
      expect(await width(grid, "b")).toBeCloseTo(b - shift, 0);
      expect(await width(grid, "c")).toBeCloseTo(c, 0);
      expect(await width(grid, "d")).toBeCloseTo(d, 0);
    };
    const splitter = grid.item("b-splitter-h");

    await splitter.focus();
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("ArrowRight");
    }
    await expectWidths(30);
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("ArrowLeft");
    }
    await expectWidths(-20);

    await grid.resize(splitter, 50);
    await expectWidths(30);
    await grid.resize(splitter, -60);
    await expectWidths(-30);
  });

  test("proportional row resize works from the keyboard", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "proportional" });
    const grid = new GridLayoutDriver(component, page);
    const splitter = grid.item("proportional-middle-splitter-v");
    const headerBefore = await height(grid, "proportional-header");
    const topBefore = await height(grid, "proportional-middle");
    const bottomBefore = await height(grid, "proportional-bottom");

    await splitter.focus();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("ArrowDown");
    }

    const topReduction =
      topBefore - (await height(grid, "proportional-middle"));
    const bottomReduction =
      bottomBefore - (await height(grid, "proportional-bottom"));
    expect(
      (await height(grid, "proportional-header")) - headerBefore,
    ).toBeCloseTo(60, 0);
    expect(topReduction).toBeGreaterThan(25);
    expect(bottomReduction).toBeCloseTo(topReduction, 0);
  });
});
