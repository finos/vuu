import { describe, expect, it } from "vitest";
import {
  getAddedItems,
  getRemovedItems,
  reorderItems,
} from "../src/array-utils";

interface BirdSpecies {
  name: string;
  wingSpan: number;
  canFly: boolean;
}

const birdSpeciesComparator = (
  firstBirdSpecies: BirdSpecies,
  secondBirdSpecies: BirdSpecies,
) => firstBirdSpecies.name === secondBirdSpecies.name;

describe("reorderItems", () => {
  it("reorders items to match sortedNames", () => {
    expect(
      reorderItems(
        [{ name: "test1" }, { name: "test2" }, { name: "test3" }],
        ["test3", "test1", "test2"],
      ),
    ).toEqual([{ name: "test3" }, { name: "test1" }, { name: "test2" }]);
  });
  it("ignores duplicates in sortedNames", () => {
    expect(
      reorderItems(
        [{ name: "test1" }, { name: "test2" }, { name: "test3" }],
        ["test3", "test3", "test1", "test2"],
      ),
    ).toEqual([{ name: "test3" }, { name: "test1" }, { name: "test2" }]);
  });
});

describe("getAddedItems", () => {
  it("returns new items if current items are undefined", () => {
    const newItems = [
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
    ];
    expect(getAddedItems(undefined, newItems)).toEqual([
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
    ]);
  });

  it("compares by object reference by default (no comparator supplied)", () => {
    const robin = { name: "Robin", wingSpan: 20, canFly: true };
    const penguin = { name: "Penguin", wingSpan: 0, canFly: false };
    const currentItems = [
      robin,
      penguin,
      { name: "Heron", wingSpan: 155, canFly: true },
    ];
    const newItems = [
      robin,
      penguin,
      { name: "Heron", wingSpan: 155, canFly: true },
    ];
    expect(getAddedItems(currentItems, newItems)).toEqual([
      { name: "Heron", wingSpan: 155, canFly: true },
    ]);
  });

  it("compares by comparator if supplied", () => {
    const currentItems: BirdSpecies[] = [
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
      { name: "Heron", wingSpan: 155, canFly: true },
    ];
    const newItems: BirdSpecies[] = [
      { name: "Heron", wingSpan: 155, canFly: true },
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Ostrich", wingSpan: 200, canFly: false },
      { name: "Penguin", wingSpan: 0, canFly: false },
    ];
    expect(
      getAddedItems(currentItems, newItems, birdSpeciesComparator),
    ).toEqual([{ name: "Ostrich", wingSpan: 200, canFly: false }]);
  });

  it("returns an empty array if all new item references are also present in current items (no comparator supplied)", () => {
    const robin = { name: "Robin", wingSpan: 20, canFly: true };
    const penguin = { name: "Penguin", wingSpan: 0, canFly: false };
    const currentItems = [robin, penguin];
    const newItems = [robin, penguin];
    expect(getAddedItems(currentItems, newItems)).toEqual([]);
    expect(
      getAddedItems(
        [{ name: "Robin", wingSpan: 20, canFly: true }],
        [{ name: "Robin", wingSpan: 20, canFly: true }],
      ),
    ).toEqual([{ name: "Robin", wingSpan: 20, canFly: true }]);
  });

  it("returns an empty array if all new item references are also present in current items (comparator supplied)", () => {
    const currentItems: BirdSpecies[] = [
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
    ];
    const newItems: BirdSpecies[] = [
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
    ];
    expect(
      getAddedItems(currentItems, newItems, birdSpeciesComparator),
    ).toEqual([]);
  });
});

describe("getRemovedItems", () => {
  it("returns current items if new items are undefined", () => {
    const currentItems = [
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
    ];
    expect(getRemovedItems(currentItems, undefined)).toEqual([
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
    ]);
  });

  it("compares by object reference by default (no comparator supplied)", () => {
    const robin = { name: "Robin", wingSpan: 20, canFly: true };
    const penguin = { name: "Penguin", wingSpan: 0, canFly: false };
    const currentItems = [
      robin,
      penguin,
      { name: "Heron", wingSpan: 155, canFly: true },
    ];
    const newItems = [
      robin,
      penguin,
      { name: "Heron", wingSpan: 155, canFly: true },
    ];
    expect(getRemovedItems(currentItems, newItems)).toEqual([
      { name: "Heron", wingSpan: 155, canFly: true },
    ]);
  });

  it("compares by comparator if supplied", () => {
    const currentItems: BirdSpecies[] = [
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
      { name: "Heron", wingSpan: 155, canFly: true },
      { name: "Ostrich", wingSpan: 200, canFly: false },
    ];
    const newItems: BirdSpecies[] = [
      { name: "Heron", wingSpan: 155, canFly: true },
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
    ];
    expect(
      getRemovedItems(currentItems, newItems, birdSpeciesComparator),
    ).toEqual([{ name: "Ostrich", wingSpan: 200, canFly: false }]);
  });

  it("returns an empty array if all current item references are also present in new items (no comparator supplied)", () => {
    const robin = { name: "Robin", wingSpan: 20, canFly: true };
    const penguin = { name: "Penguin", wingSpan: 0, canFly: false };
    const currentItems = [robin, penguin];
    const newItems = [robin, penguin];
    expect(getRemovedItems(currentItems, newItems)).toEqual([]);
    expect(
      getRemovedItems(
        [{ name: "Robin", wingSpan: 20, canFly: true }],
        [{ name: "Robin", wingSpan: 20, canFly: true }],
      ),
    ).toEqual([{ name: "Robin", wingSpan: 20, canFly: true }]);
  });

  it("returns an empty array if all current item references are also present in new items (comparator supplied)", () => {
    const currentItems: BirdSpecies[] = [
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
    ];
    const newItems: BirdSpecies[] = [
      { name: "Robin", wingSpan: 20, canFly: true },
      { name: "Penguin", wingSpan: 0, canFly: false },
    ];
    expect(
      getRemovedItems(currentItems, newItems, birdSpeciesComparator),
    ).toEqual([]);
  });
});
