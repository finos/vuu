import { describe, expect, it } from "vitest";
import {
  DROP_COMPASS_ZONES,
  getDropCompassPosition,
  getDropCompassZone,
} from "../src";

const rect = { bottom: 400, left: 0, right: 400, top: 0 };

const compassTile = (zone: string) => {
  const compass = document.createElement("div");
  const tile = document.createElement("div");
  tile.dataset.compassZone = zone;
  const glyph = document.createElement("span");
  tile.append(glyph);
  compass.append(tile);
  return { glyph, tile };
};

describe("drop compass", () => {
  it("has a zone for each direction and the centre", () => {
    expect([...DROP_COMPASS_ZONES].sort()).toEqual([
      "centre",
      "east",
      "north",
      "south",
      "west",
    ]);
  });

  describe("getDropCompassZone", () => {
    it.each([
      { point: [200, 20], zone: "north" },
      { point: [380, 200], zone: "east" },
      { point: [200, 380], zone: "south" },
      { point: [20, 200], zone: "west" },
      { point: [200, 200], zone: "centre" },
      { point: [100, 60], zone: "north" },
      { point: [330, 120], zone: "east" },
    ])("is the $zone region of the target at $point, away from the compass", ({
      point: [x, y],
      zone,
    }) => {
      const target = document.createElement("div");
      expect(getDropCompassZone(target, x, y, rect)).toBe(zone);
    });

    it.each(
      DROP_COMPASS_ZONES,
    )("is the zone of the %s compass tile under the pointer", (zone) => {
      const { glyph, tile } = compassTile(zone);
      // The pointer is in the target's central region, but over a tile.
      expect(getDropCompassZone(tile, 200, 200, rect)).toBe(zone);
      expect(getDropCompassZone(glyph, 200, 200, rect)).toBe(zone);
    });

    it("ignores an element that is not a compass tile", () => {
      const tile = document.createElement("div");
      tile.dataset.compassZone = "nowhere";
      expect(getDropCompassZone(tile, 380, 200, rect)).toBe("east");
    });

    it("accepts a non-element event target, e.g. a text node", () => {
      const text = document.createTextNode("Target");
      expect(getDropCompassZone(text, 200, 20, rect)).toBe("north");
      expect(getDropCompassZone(null, 200, 380, rect)).toBe("south");
    });
  });

  describe("getDropCompassPosition", () => {
    it.each([
      "north",
      "east",
      "south",
      "west",
    ] as const)("splits the target to the %s", (zone) => {
      expect(getDropCompassPosition(zone)).toBe(zone);
      expect(getDropCompassPosition(zone, { stacked: true })).toBe(zone);
    });

    it("stacks with the target, as a tab, in the centre", () => {
      expect(getDropCompassPosition("centre")).toBe("header");
    });

    it("has no centre drop on a panel already in a stack", () => {
      expect(
        getDropCompassPosition("centre", { stacked: true }),
      ).toBeUndefined();
    });
  });
});
