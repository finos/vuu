import { describe, expect, it } from "vitest";
import { asReactElements } from "../src/react-utils";

describe("asReactElements", () => {
  it("filters non-element values from mixed children", () => {
    const elements = asReactElements([
      <button key="first" type="button">
        First
      </button>,
      null,
      false,
      undefined,
      <button key="second" type="button">
        Second
      </button>,
    ]);

    expect(elements).toHaveLength(2);
    expect(elements.map(({ props }) => props.children)).toEqual([
      "First",
      "Second",
    ]);
  });

  it("returns an empty array when there are no element children", () => {
    expect(asReactElements([null, false, undefined])).toEqual([]);
  });
});
