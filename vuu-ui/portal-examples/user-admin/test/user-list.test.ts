import { describe, expect, it } from "vitest";
import { moduleAccessFilter } from "../src/data/applications";
import {
  allApplicationsFilter,
  allOf,
  USER_SORT_OPTIONS,
  userSortFor,
  visibleAccessRoles,
} from "../src/data/userList";

describe("allApplicationsFilter", () => {
  it("matches every chosen application", () => {
    expect(allApplicationsFilter([])).toBeUndefined();
    expect(allApplicationsFilter(["a-access"])).toEqual(
      moduleAccessFilter("a-access"),
    );
    expect(allApplicationsFilter(["a-access", "b-access"])).toEqual({
      op: "and",
      filters: [moduleAccessFilter("a-access"), moduleAccessFilter("b-access")],
    });
  });

  it("joins only the filters that are defined", () => {
    const search = {
      op: "contains",
      column: "username",
      value: "ann",
    } as const;
    expect(allOf(undefined, undefined)).toBeUndefined();
    expect(allOf(search, undefined)).toBe(search);
    expect(allOf(search, moduleAccessFilter("a-access"))).toEqual({
      op: "and",
      filters: [search, moduleAccessFilter("a-access")],
    });
  });
});

describe("user sorts", () => {
  it("has a sort for every option", () => {
    for (const { value } of USER_SORT_OPTIONS) {
      expect(userSortFor(value).sortDefs.length).toBeGreaterThan(0);
    }
    expect(userSortFor("changed").sortDefs).toEqual([
      { column: "vuuUpdatedTimestamp", sortType: "D" },
    ]);
  });
});

describe("visibleAccessRoles", () => {
  const roles = ["a", "b", "c", "d", "e"];

  it("caps the tags and puts the rest behind +N more", () => {
    expect(visibleAccessRoles(roles, [], 3)).toEqual({
      hidden: ["d", "e"],
      shown: ["a", "b", "c"],
    });
  });

  it("shows one extra tag rather than +1 more", () => {
    expect(visibleAccessRoles(["a", "b", "c", "d"], [], 3)).toEqual({
      hidden: [],
      shown: ["a", "b", "c", "d"],
    });
  });

  it("puts filtered-for applications first", () => {
    expect(visibleAccessRoles(roles, ["e", "d"], 3)).toEqual({
      hidden: ["b", "c"],
      shown: ["d", "e", "a"],
    });
  });
});
