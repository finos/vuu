import type { DataRow } from "@vuu-ui/vuu-table-types";
import { describe, expect, it } from "vitest";
import {
  configChanges,
  groupModules,
  issueSummary,
  joinLocation,
  matchesSearch,
  matchesStatus,
  menuSections,
  moduleIssues,
  moduleKpis,
  sortModules,
  splitLocation,
  suggestName,
  suggestPath,
  toConfig,
  toManagedModules,
  toModuleViews,
} from "../src/data/module-model";
import type { ManifestResult } from "../src/data/remote-check";
import { MODULES } from "./fixtures";

const LOADED = (name: string, exposes: string[]): ManifestResult => ({
  checkedAt: 10,
  elapsedMs: 5,
  exposes,
  name,
  status: "loaded",
});

const row = (values: Record<string, unknown>) => values as unknown as DataRow;

describe("toManagedModules", () => {
  it("joins module rows with their access role and normalises values", () => {
    const modules = toManagedModules(
      [
        row({ enabled: true, id: 2, name: "b", vuuUpdatedTimestamp: 20 }),
        row({
          enabled: false,
          id: 1,
          name: "a",
          parentModuleId: "2",
          version: 3,
        }),
      ],
      [
        row({ id: 1, module_id: 2, role: "b-access" }),
        row({ id: 2, module_id: 2, role: "ignored-second-role" }),
      ],
    );
    expect(modules.map(({ id }) => id)).toEqual([1, 2]);
    expect(modules[0]).toMatchObject({
      accessRole: "",
      enabled: false,
      parentModuleId: 2,
      title: "",
      version: 3,
    });
    expect(modules[1]).toMatchObject({
      accessRole: "b-access",
      enabled: true,
      updated: 20,
    });
  });
});

describe("configChanges", () => {
  it("lists changed fields only and never the name", () => {
    const original = toConfig(MODULES[0]);
    const draft = { ...original, name: "renamed", title: "New title" };
    expect(configChanges(original, draft)).toEqual({ title: "New title" });
    expect(configChanges(original, original)).toEqual({});
  });

  it("toConfig drops the managed fields", () => {
    expect(toConfig(MODULES[0])).not.toHaveProperty("id");
    expect(toConfig(MODULES[0])).not.toHaveProperty("version");
  });
});

describe("menu locations", () => {
  it("splits and joins section and label", () => {
    expect(splitLocation("/Trading/Baskets")).toEqual(["Trading", "Baskets"]);
    expect(splitLocation("")).toEqual(["", ""]);
    expect(joinLocation(" Risk ", "Dashboard")).toBe("/Risk/Dashboard");
    expect(joinLocation("", "")).toBe("");
  });

  it("suggests names and routes", () => {
    expect(suggestName("  Risk Dashboard!  ")).toBe("risk-dashboard");
    expect(suggestPath("Fixed Income", "Bond Pricer")).toBe(
      "/fixed-income/bond-pricer",
    );
    expect(suggestPath("Trading", "")).toBe("");
  });

  it("lists distinct sections of top-level modules", () => {
    expect(menuSections(MODULES)).toEqual(["Tools", "Trading"]);
  });
});

describe("toModuleViews", () => {
  const views = toModuleViews(MODULES, {
    "http://localhost:5004": LOADED("vuuTableBrowser", ["VuuTableBrowser"]),
    "http://localhost:5005": {
      checkedAt: 10,
      error: "Network or CORS error",
      status: "unreachable",
    },
    "http://localhost:5006": LOADED("wrongScope", ["VuuBasketTradingFeature"]),
  });
  const byId = (id: number) => {
    const view = views.find((module) => module.id === id);
    if (!view) throw new Error(`No module ${id}`);
    return view;
  };

  it("links parents and children and inherits the access role", () => {
    expect(byId(2).children.map(({ id }) => id)).toEqual([3]);
    expect(byId(3).parent?.id).toBe(2);
    expect(byId(3).effectiveAccessRole).toBe("vuu-table-browser-access");
    expect(byId(3).accessRoleInherited).toBe(true);
    expect(byId(2).accessRoleInherited).toBe(false);
  });

  it("reports remote and access role issues", () => {
    expect(byId(2).issues).toEqual([]);
    expect(byId(1).remote?.status).toBe("mismatch");
    expect(byId(1).issues.map(({ kind }) => kind)).toEqual(["remote"]);
    expect(byId(3).issues.map(({ kind }) => kind)).toEqual(["remote"]);
    expect(byId(4).remote).toBeUndefined();
    expect(byId(4).issues.map(({ kind }) => kind)).toEqual(["noAccessRole"]);
  });

  it("filters by status and search term", () => {
    expect(views.filter((v) => matchesStatus(v, "disabled"))).toHaveLength(1);
    expect(views.filter((v) => matchesStatus(v, "attention"))).toHaveLength(3);
    expect(views.filter((v) => matchesSearch(v, "BASKET"))).toHaveLength(1);
    expect(
      views.filter((v) => matchesSearch(v, "table-browser-access")),
    ).toHaveLength(2);
    expect(views.filter((v) => matchesSearch(v, " "))).toHaveLength(4);
  });

  it("sorts in menu order with children after their parent", () => {
    expect(sortModules(views, "menu").map(({ id }) => id)).toEqual([
      2, 3, 1, 4,
    ]);
    expect(sortModules(views, "title").map(({ id }) => id)).toEqual([
      1, 2, 4, 3,
    ]);
    expect(sortModules(views, "updated")[0].id).toBe(1);
  });

  it("groups by section and status", () => {
    const sections = groupModules(sortModules(views, "menu"), "section");
    expect(sections.map(({ label }) => label)).toEqual(["Tools", "Trading"]);
    expect(sections[0].modules.map(({ id }) => id)).toEqual([2, 3]);
    expect(
      groupModules(views, "status").map(({ label, modules }) => [
        label,
        modules.length,
      ]),
    ).toEqual([
      ["Enabled", 3],
      ["Disabled", 1],
    ]);
    expect(groupModules(views, "none")).toHaveLength(1);
  });

  it("computes the KPIs", () => {
    expect(moduleKpis(views)).toEqual({
      connections: 2,
      disabled: 1,
      enabled: 3,
      issues: 3,
      modulesWithIssues: 3,
      sections: 2,
      total: 4,
    });
  });
});

describe("issueSummary", () => {
  const unreachable = {
    checkedAt: 1,
    elapsedMs: 1,
    exposes: [],
    items: [],
    status: "unreachable" as const,
    summary: "Remote entry could not be loaded",
  };

  it("is empty when there are no issues", () => {
    expect(issueSummary({ issues: [] })).toBe("");
  });

  it("uses the message for a single issue", () => {
    expect(issueSummary({ issues: moduleIssues("") })).toBe(
      "No access role – no user can open this module",
    );
  });

  it("counts and names multiple issues", () => {
    expect(
      issueSummary({
        issues: moduleIssues("", unreachable),
        remote: unreachable,
      }),
    ).toBe("2 issues · remote unreachable, no access role");
  });
});
