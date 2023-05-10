import { describe, expect, it } from "vitest";
import { rangeNewItems } from "../src/range-utils";

describe("rangeNewItems", () => {
  it("returns new range when ranges do not overlap", () => {
    // prettier-ignore
    expect(
        rangeNewItems({from: 0, to: 10},{from: 20, to: 30})
    ).toEqual({from: 20, to: 30});
    // prettier-ignore
    expect(
        rangeNewItems({from: 0, to: 10},{from: 10, to: 20})
    ).toEqual({from: 10, to: 20});
    // prettier-ignore
    expect(
        rangeNewItems({from: 20, to: 30},{from: 0, to: 10})
    ).toEqual({from: 0, to: 10});
    // prettier-ignore
    expect(
        rangeNewItems({from: 20, to: 30},{from: 10, to: 20})
    ).toEqual({from: 10, to: 20});
  });
  it("returns items when new range overlaps end of existing range", () => {
    // prettier-ignore
    expect(
        rangeNewItems({from: 0, to: 10},{from: 1, to: 11})
    ).toEqual({from: 10, to: 11});
    // prettier-ignore
    expect(
        rangeNewItems({from: 0, to: 10},{from: 3, to: 13})
    ).toEqual({from: 10, to: 13});
  });
  it("returns items when new range overlaps start of existing range", () => {
    // prettier-ignore
    expect(
        rangeNewItems({from: 10, to: 20},{from: 2, to: 12})
    ).toEqual({from: 2, to: 10});
    // prettier-ignore
    expect(
        rangeNewItems({from: 5, to: 15},{from: 0, to: 10})
    ).toEqual({from: 0, to: 5});
  });
  it("returns items when new range extends existing range", () => {
    // prettier-ignore
    expect(
        rangeNewItems({from: 0, to: 10},{from: 0, to: 12})
    ).toEqual({from: 10, to: 12});
    // prettier-ignore
    expect(
        rangeNewItems({from: 0, to: 10},{from: 0, to: 20})
    ).toEqual({from: 10, to: 20});
    // prettier-ignore
    expect(
        rangeNewItems({from: 5, to: 15},{from: 0, to: 15})
    ).toEqual({from: 0, to: 5});
  });
  it("returns new range when original range is subset", () => {
    // prettier-ignore
    expect(
        rangeNewItems({from: 5, to: 15},{from: 0, to: 20})
    ).toEqual({from: 0, to: 20});
    // prettier-ignore
  });
});
