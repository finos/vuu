import { describe, expect, it } from "vitest";
import { LayoutJSON, isLayoutJSON } from "../src";

const validLayout: LayoutJSON = {
  type: "Stack",
};

const invalidLayout: unknown = {
  name: "invalid-layout-test",
};

describe("isLayoutJSON", () => {
  it("returns true when layout is valid", () => {
    const result = isLayoutJSON(validLayout);

    expect(result).toBe(true);
  });

  it("returns false when layout is not valid", () => {
    const result = isLayoutJSON(invalidLayout as LayoutJSON);

    expect(result).toBe(false);
  });

  it("returns false when layout is undefined", () => {
    const result = isLayoutJSON(undefined as unknown as LayoutJSON);

    expect(result).toBe(false);
  });
});
