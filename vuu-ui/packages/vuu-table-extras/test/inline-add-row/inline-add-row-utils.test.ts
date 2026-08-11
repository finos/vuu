import { describe, expect, it } from "vitest";
import { getMissingValueErrors } from "../../src/inline-add-row/inline-add-row-utils";

describe("getMissingValueErrors", () => {
  it("returns an error for every omitted value", () => {
    expect(
      getMissingValueErrors(["id", "name", "active"], {
        active: false,
        id: " ",
      }),
    ).toEqual({
      id: "Value required",
      name: "Value required",
    });
  });

  it("accepts zero and false as entered values", () => {
    expect(
      getMissingValueErrors(["id", "active"], {
        active: false,
        id: 0,
      }),
    ).toEqual({});
  });
});
