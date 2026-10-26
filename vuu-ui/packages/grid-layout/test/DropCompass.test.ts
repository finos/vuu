import { describe, expect, it } from "vitest";
import {
  DROP_COMPASS_ZONES,
  getDropCompassGeometry,
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

  describe("getDropCompassZone, between the compass tiles", () => {
    // Under 160px, so a compact compass: 22px tiles, 3px gaps, centred on
    // (60, 50). The centre tile spans x 49-71, y 39-61.
    const compactRect = { bottom: 100, left: 0, right: 120, top: 0 };
    // A regular compass: 34px tiles, 3px gaps, centred on (150, 85). The
    // centre tile spans x 133-167, y 68-102.
    const regularRect = { bottom: 170, left: 0, right: 300, top: 0 };
    const content = () => document.createElement("div");

    describe.each([
      {
        size: "compact",
        rect: compactRect,
        gap: [
          [60, 37],
          [60, 63],
          [47, 50],
          [73, 50],
          [47, 37],
          [73, 63],
        ],
        edges: [
          { point: [60, 25], zone: "north" },
          { point: [60, 75], zone: "south" },
          { point: [35, 50], zone: "west" },
          { point: [85, 50], zone: "east" },
          // The gap between the north and west tiles.
          { point: [46, 34], zone: "north" },
        ],
      },
      {
        size: "regular",
        rect: regularRect,
        gap: [
          [150, 66],
          [150, 104],
          [131, 85],
          [169, 85],
          [131, 66],
          [169, 104],
        ],
        edges: [
          { point: [150, 50], zone: "north" },
          { point: [150, 120], zone: "south" },
          { point: [115, 85], zone: "west" },
          { point: [185, 85], zone: "east" },
        ],
      },
    ])("on a $size compass", ({ rect: targetRect, gap, edges }) => {
      it.each(
        gap,
      )("is the centre in the gap around the centre tile, at (%d, %d)", (x, y) => {
        expect(getDropCompassZone(content(), x, y, targetRect)).toBe("centre");
      });

      it.each(edges)("is $zone over an edge tile, at $point", ({
        point: [x, y],
        zone,
      }) => {
        expect(getDropCompassZone(content(), x, y, targetRect)).toBe(zone);
      });

      it("has no drop in the centre gap of a panel already in a stack", () => {
        const [x, y] = gap[0];
        const zone = getDropCompassZone(content(), x, y, targetRect);
        expect(zone).toBe("centre");
        expect(getDropCompassPosition(zone, { stacked: true })).toBeUndefined();
      });
    });

    it("is the region of the target beyond the compass", () => {
      expect(getDropCompassZone(content(), 150, 10, regularRect)).toBe("north");
      expect(getDropCompassZone(content(), 290, 85, regularRect)).toBe("east");
      expect(getDropCompassZone(content(), 60, 5, compactRect)).toBe("north");
    });

    it("measures the rendered compass, when there is one", () => {
      const compass = document.createElement("div");
      compass.style.rowGap = "5px";
      const centre = document.createElement("div");
      centre.dataset.compassZone = "centre";
      compass.append(centre);
      document.body.append(compass);
      centre.getBoundingClientRect = () =>
        ({ left: 100, top: 100, width: 40, height: 40 }) as DOMRect;
      const geometry = getDropCompassGeometry(regularRect, compass);
      compass.remove();
      expect(geometry).toEqual({
        centreX: 120,
        centreY: 120,
        gap: 5,
        tileSize: 40,
      });
      // Within the measured centre gap, but outside the default one.
      expect(
        getDropCompassZone(content(), 120, 96, regularRect, geometry),
      ).toBe("centre");
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
