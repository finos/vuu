import type { DataRow } from "@vuu-ui/vuu-table-types";
import { describe, expect, it } from "vitest";
import {
  groupBySection,
  listModules,
  matchesSearch,
  matchesStatus,
  menuSections,
  moduleCounts,
  moduleIssues,
  moduleSource,
  moduleSourceYaml,
  sortByMenu,
  splitLocation,
  toManagedModules,
  toModuleViews,
} from "../src/data/module-model";
import type { ManifestResult } from "../src/data/remote-check";
import { MODULES } from "./fixtures";

const LOADED = (name: string, exposes: string[]): ManifestResult => ({
  checkedAt: 10,
  config: { status: "loaded" },
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

/** Reads back the flat list entry moduleSourceYaml writes. */
const readYamlEntry = (yaml: string) =>
  Object.fromEntries(
    yaml.split("\n").map((line) => {
      const [, key, value] = /^[- ] (\w+): (.*)$/.exec(line) ?? [];
      return [
        key,
        value.startsWith('"') || /^(true|false|-?\d+)$/.test(value)
          ? JSON.parse(value)
          : value,
      ];
    }),
  );

describe("moduleSource", () => {
  it("lists the definition in the order of modules.yaml", () => {
    const source = moduleSource(MODULES[0]);
    expect(Object.keys(source)).toEqual([
      "id",
      "version",
      "created",
      "updated",
      "parentModuleId",
      "name",
      "title",
      "description",
      "enabled",
      "location",
      "path",
      "mfComponent",
      "mfScope",
      "mfUrl",
      "navIconUrl",
      "accessRole",
    ]);
    expect(source).toMatchObject({
      accessRole: "basket-trading-access",
      id: 1,
      name: "basket-trading",
    });
  });

  it("writes the module as one modules.yaml list entry", () => {
    const yaml = moduleSourceYaml(MODULES[0]);
    expect(yaml.startsWith("- id: 1\n  version: ")).toBe(true);
    expect(readYamlEntry(yaml)).toEqual(moduleSource(MODULES[0]));
  });

  it("quotes only the strings YAML would read differently", () => {
    const yaml = moduleSourceYaml({
      ...MODULES[0],
      accessRole: "",
      description: "Create modules, update modules",
      location: "/Admin/Manage Modules",
      mfUrl: "http://localhost:5002",
      title: "true",
    });
    expect(yaml).toContain('  description: "Create modules, update modules"');
    expect(yaml).toContain("  location: /Admin/Manage Modules");
    expect(yaml).toContain("  mfUrl: http://localhost:5002");
    expect(yaml).toContain('  title: "true"');
    expect(yaml).toContain('  accessRole: ""');
  });
});

describe("menu locations", () => {
  it("splits section and label", () => {
    expect(splitLocation("/Trading/Baskets")).toEqual(["Trading", "Baskets"]);
    expect(splitLocation("/Tools/Tables/Recent")).toEqual([
      "Tools",
      "Tables/Recent",
    ]);
    expect(splitLocation("")).toEqual(["", ""]);
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
    expect(sortByMenu(views).map(({ id }) => id)).toEqual([2, 3, 1, 4]);
  });

  it("groups by menu section, children with their parent", () => {
    const groups = groupBySection(views);
    expect(groups.map(({ section }) => section)).toEqual(["Tools", "Trading"]);
    expect(groups[0].modules.map(({ id }) => id)).toEqual([2, 3]);
  });

  it("lists modules matching the filter and status", () => {
    expect(
      listModules(views, "", "all").flatMap(({ modules }) =>
        modules.map(({ id }) => id),
      ),
    ).toEqual([2, 3, 1, 4]);
    expect(
      listModules(views, "orders", "all").map(({ section }) => section),
    ).toEqual(["Trading"]);
    expect(listModules(views, "", "disabled")[0].modules[0].id).toBe(4);
    expect(listModules(views, "nothing matches", "all")).toEqual([]);
  });

  it("counts modules by status", () => {
    expect(moduleCounts(views)).toEqual({
      attention: 3,
      disabled: 1,
      enabled: 3,
      sections: 2,
      total: 4,
    });
  });
});

describe("moduleIssues", () => {
  it("is empty for a module with a role and a passing check", () => {
    expect(moduleIssues("a-role")).toEqual([]);
  });

  it("names the failed remote check item", () => {
    const issues = moduleIssues("", {
      checkedAt: 1,
      configItems: [],
      exposes: [],
      items: [
        {
          detail: "Network or CORS error",
          label: "Manifest not loaded",
          ok: false,
        },
      ],
      status: "unreachable",
      summary: "Remote not reachable from this browser at localhost:5009",
    });
    expect(issues).toEqual([
      {
        detail: "No user can open this module until it has an access role.",
        kind: "noAccessRole",
        message: "No access role",
      },
      {
        detail: "Manifest not loaded: Network or CORS error",
        kind: "remote",
        message: "Remote not reachable from this browser at localhost:5009",
      },
    ]);
  });
});
