import { describe, expect, it } from "vitest";
import { GridLayoutItem } from "../src/GridLayoutItem";
import { preserveChildOrder } from "../src/useGridLayout";

const item = (id: string) => <GridLayoutItem id={id} key={id} />;
const ids = (items: ReturnType<typeof item>[]) =>
  items.map((child) => child.props.id);

describe("preserveChildOrder", () => {
  it("keeps existing children in their rendered order and appends new ones", () => {
    const previous = [item("a"), item("b"), item("c")];
    const next = [item("new"), item("c"), item("a"), item("b")];
    expect(ids(preserveChildOrder(previous, next))).toEqual([
      "a",
      "b",
      "c",
      "new",
    ]);
  });

  it("drops removed children and keeps the order of several new ones", () => {
    const previous = [item("a"), item("b"), item("c")];
    const next = [item("x"), item("c"), item("y"), item("a")];
    expect(ids(preserveChildOrder(previous, next))).toEqual([
      "a",
      "c",
      "x",
      "y",
    ]);
  });

  it("uses the new elements, not the previous ones", () => {
    const previous = [item("a")];
    const next = [item("a")];
    expect(preserveChildOrder(previous, next)[0]).toBe(next[0]);
  });
});
