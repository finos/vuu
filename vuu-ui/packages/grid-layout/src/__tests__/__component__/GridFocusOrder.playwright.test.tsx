import type { Page } from "@playwright/test";
import { expect, test } from "../../../../../playwright/fixtures";

const fixture = "GridLayout/GridLayoutTestFixture/GridLayoutTestFixture";

/**
 * Names the focused element: a splitter by id, a tab by its label, a
 * button by "<item id>:<label>", or a button outside the grid by its label.
 */
const describeFocus = (page: Page) =>
  page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (element === null || element === document.body) {
      return "body";
    }
    if (element.getAttribute("role") === "separator") {
      return element.id;
    }
    const label =
      element.getAttribute("aria-label") ??
      element.querySelector("[aria-label]")?.getAttribute("aria-label") ??
      element.textContent?.trim() ??
      "";
    if (element.getAttribute("role") === "tab") {
      return `tab:${label}`;
    }
    const item = element.closest(".vuuGridLayoutItem");
    return item ? `${item.id}:${label}` : label;
  });

/** Presses `key` `count` times, naming the focused element after each. */
const focusSequence = async (page: Page, key: string, count: number) => {
  const sequence: string[] = [];
  for (let i = 0; i < count; i++) {
    await page.keyboard.press(key);
    sequence.push(await describeFocus(page));
  }
  return sequence;
};

const gridOrder = [
  "a:Close",
  "a:A one",
  "a:A two",
  "b-splitter-h",
  "b:Close",
  "c-splitter-v",
  "c:Close",
  "d-splitter-h",
  "d-splitter-v",
  "d:Close",
];

test.describe("GridLayout focus order", () => {
  test("Tab follows the visual layout, not DOM order", async ({
    mount,
    page,
  }) => {
    await mount(fixture, { variant: "focus-order" });
    await page.getByRole("button", { name: "Before" }).focus();

    expect(await focusSequence(page, "Tab", gridOrder.length + 1)).toEqual([
      ...gridOrder,
      "After",
    ]);
  });

  test("Shift+Tab follows the visual layout in reverse", async ({
    mount,
    page,
  }) => {
    await mount(fixture, { variant: "focus-order" });
    await page.getByRole("button", { name: "After" }).focus();

    expect(
      await focusSequence(page, "Shift+Tab", gridOrder.length + 1),
    ).toEqual([...gridOrder.slice().reverse(), "Before"]);
  });

  test("Tab continues in visual order from a focused element", async ({
    mount,
    page,
  }) => {
    await mount(fixture, { variant: "focus-order" });
    await page.getByRole("button", { name: "A two" }).focus();

    expect(await focusSequence(page, "Tab", 2)).toEqual([
      "b-splitter-h",
      "b:Close",
    ]);
    await page.locator('[id="c-splitter-v"]').focus();
    expect(await focusSequence(page, "Shift+Tab", 2)).toEqual([
      "b:Close",
      "b-splitter-h",
    ]);
  });

  test("a nested grid is visited in its own visual order", async ({
    mount,
    page,
  }) => {
    await mount(fixture, { variant: "focus-order-nested" });
    const order = [
      "host:Close",
      "inner-top:Close",
      "inner-bottom-splitter-v",
      "inner-bottom:Close",
      "right-splitter-h",
      "right:Close",
    ];

    await page.getByRole("button", { name: "Before" }).focus();
    expect(await focusSequence(page, "Tab", order.length + 1)).toEqual([
      ...order,
      "After",
    ]);
    expect(await focusSequence(page, "Shift+Tab", order.length + 1)).toEqual([
      ...order.slice().reverse(),
      "Before",
    ]);
  });

  test("a stack is its tab strip then its selected item", async ({
    mount,
    page,
  }) => {
    await mount(fixture, { variant: "focus-order-stacked" });
    await page.getByRole("button", { name: "Before" }).focus();

    const sequence: string[] = [];
    while (sequence.at(-1) !== "After" && sequence.length < 10) {
      sequence.push(...(await focusSequence(page, "Tab", 1)));
    }
    expect(sequence.filter((name) => !name.includes("-splitter-"))).toEqual([
      "first:Close",
      "tab:Alpha",
      "alpha:Alpha action",
      "After",
    ]);
  });

  test("splitters are Tab stops that resize from the keyboard", async ({
    mount,
    page,
  }) => {
    const component = await mount(fixture, { variant: "focus-order" });
    const width = async (id: string) =>
      (await component.locator(`[id="${id}"]`).boundingBox())?.width ?? 0;
    const [a, b, c, d] = await Promise.all(["a", "b", "c", "d"].map(width));

    await page.getByRole("button", { name: "A two" }).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowRight");

    expect(await describeFocus(page)).toBe("b-splitter-h");
    expect(await width("a")).toBeCloseTo(a + 10, 0);
    expect(await width("b")).toBeCloseTo(b - 10, 0);
    expect(await width("c")).toBeCloseTo(c, 0);
    expect(await width("d")).toBeCloseTo(d, 0);
  });
});
