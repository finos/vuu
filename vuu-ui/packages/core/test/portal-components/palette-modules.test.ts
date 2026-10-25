import { describe, expect, it } from "vitest";
import {
  getPaletteModules,
  type RemoteModuleDescriptor,
} from "../../src/portal";

const module = (
  id: number,
  overrides: Partial<RemoteModuleDescriptor> = {},
): RemoteModuleDescriptor => ({
  accessRole: "",
  clientIdentifier: `module-${id}`,
  description: "",
  id,
  mfComponent: "./Module",
  mfScope: `module${id}`,
  mfUrl: `http://localhost/${id}`,
  name: `module-${id}`,
  navLocation: "/Apps",
  path: `/m${id}`,
  title: `Module ${id}`,
  version: 1,
  ...overrides,
});

describe("getPaletteModules", () => {
  it("includes only enabled modules with a workspace descriptor, grouped by paletteGroup", () => {
    const groups = getPaletteModules([
      module(1, { workspace: { paletteGroup: "Trading" } }),
      module(2),
      module(3, {
        workspace: {
          defaultSize: { cols: 2 },
          iconUrl: "data:image/svg+xml,a",
          paletteGroup: "Tables",
        },
      }),
      module(4, {
        navIconUrl: "data:image/svg+xml,nav",
        workspace: { paletteGroup: "Trading" },
      }),
      module(5, { enabled: false, workspace: { paletteGroup: "Trading" } }),
    ]);

    expect(groups.map(({ paletteGroup }) => paletteGroup)).toEqual([
      "Trading",
      "Tables",
    ]);
    const [trading, tables] = groups;
    expect(trading.modules.map(({ label }) => label)).toEqual([
      "Module 1",
      "Module 4",
    ]);
    expect(trading.modules[0].iconUrl).toBeUndefined();
    expect(trading.modules[1].iconUrl).toBe("data:image/svg+xml,nav");
    expect(tables.modules[0]).toMatchObject({
      defaultSize: { cols: 2 },
      iconUrl: "data:image/svg+xml,a",
      template: {
        component: {
          settings: { moduleId: "3" },
          type: "portal-module",
          version: 1,
        },
        label: "Module 3",
      },
    });
  });

  it("includes palette-only modules, which have no location or route", () => {
    const {
      navLocation: _navLocation,
      path: _path,
      ...paletteOnly
    } = module(5, { workspace: { paletteGroup: "Panels" } });
    const [group] = getPaletteModules([paletteOnly]);
    expect(group).toMatchObject({
      modules: [
        {
          label: "Module 5",
          template: {
            component: { settings: { moduleId: "5" }, type: "portal-module" },
          },
        },
      ],
      paletteGroup: "Panels",
    });
  });

  it("returns no groups when no module has a workspace descriptor", () => {
    expect(getPaletteModules([module(1), module(2)])).toEqual([]);
  });
});
