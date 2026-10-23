import { describe, expect, it } from "vitest";
import { dropPositionAt } from "../src/showcase-main/workspace/workspace-drop";

const rect = { bottom: 100, left: 0, right: 200, top: 0 };

describe("dropPositionAt", () => {
  it("is centre in the middle of the target", () => {
    expect(dropPositionAt(100, 50, rect)).toBe("centre");
  });
  it("is the nearest edge elsewhere", () => {
    expect(dropPositionAt(100, 5, rect)).toBe("north");
    expect(dropPositionAt(100, 95, rect)).toBe("south");
    expect(dropPositionAt(5, 50, rect)).toBe("west");
    expect(dropPositionAt(195, 50, rect)).toBe("east");
  });
});
