import { describe, expect, it } from "vitest";
import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";
import { buildNavSections } from "../../src/portal-app-switcher/nav-section-utils";

const remoteModule = (
  navLocation: string,
  path: string,
  extra: Partial<RemoteModuleDescriptor> = {},
): RemoteModuleDescriptor => ({
  clientIdentifier: "test-module",
  description: "Test module",
  id: path,
  navLocation,
  accessRole: "test-access",
  mfComponent: "TestModule",
  mfScope: "test",
  mfUrl: "https://modules.example/mf-manifest.json",
  name: "test",
  path,
  title: "Test module",
  version: 1,
  ...extra,
});

const outline = (modules: RemoteModuleDescriptor[]) =>
  buildNavSections(modules).map(({ title, items }) => [
    title,
    items.map((item) => item.title),
  ]);

describe("buildNavSections", () => {
  it("groups modules by the first navLocation segment, in order of first appearance", () => {
    expect(
      outline([
        remoteModule("/Trading/Orders", "/orders"),
        remoteModule("/Market/Depth", "/depth"),
        remoteModule("/Trading/Fills", "/fills"),
      ]),
    ).toEqual([
      ["Trading", ["Orders", "Fills"]],
      ["Market", ["Depth"]],
    ]);
  });

  it("orders items by navOrder, then registration order", () => {
    expect(
      outline([
        remoteModule("/Trading/A", "/a"),
        remoteModule("/Trading/B", "/b", { navOrder: 20 }),
        remoteModule("/Trading/C", "/c"),
        remoteModule("/Trading/D", "/d", { navOrder: 10 }),
        remoteModule("/Trading/E", "/e", { navOrder: 20 }),
        remoteModule("/Trading/F", "/f", { navOrder: -5 }),
      ]),
    ).toEqual([["Trading", ["F", "D", "B", "E", "A", "C"]]]);
  });

  it("orders sections by their lowest navOrder, unordered sections last", () => {
    expect(
      outline([
        remoteModule("/Unordered/One", "/one"),
        remoteModule("/Trading/Orders", "/orders", { navOrder: 120 }),
        remoteModule("/Workspaces/Trader", "/trader", { navOrder: 10 }),
        remoteModule("/Trading/Watchlist", "/watchlist", { navOrder: 100 }),
        remoteModule("/Also/Unordered", "/two"),
      ]),
    ).toEqual([
      ["Workspaces", ["Trader"]],
      ["Trading", ["Watchlist", "Orders"]],
      ["Unordered", ["One"]],
      ["Also", ["Unordered"]],
    ]);
  });

  it("excludes nested modules", () => {
    expect(
      outline([
        remoteModule("", "/ticket"),
        remoteModule("/", "/chart"),
        remoteModule("/Trading/Orders", "/orders"),
      ]),
    ).toEqual([["Trading", ["Orders"]]]);
  });

  it("titles single-segment items with the segment and joins deeper segments", () => {
    expect(
      outline([
        remoteModule("/Reports", "/reports"),
        remoteModule("/Reports/Daily/Summary", "/reports/daily"),
        remoteModule("Admin", "/admin"),
      ]),
    ).toEqual([
      ["Reports", ["Reports", "Daily: Summary"]],
      ["Admin", ["Admin"]],
    ]);
  });

  it("maps module metadata onto items", () => {
    expect(
      buildNavSections([
        remoteModule("/Trading/Orders", "/orders/*", {
          id: 7,
          navBadge: "workingOrders",
          navIconName: "orders",
          navIconUrl: "data:image/svg+xml,orders",
          navOrder: 10,
          notificationTopics: ["orders"],
        }),
      ]),
    ).toEqual([
      {
        id: "/Trading",
        title: "Trading",
        items: [
          {
            href: "/orders",
            mfScope: "test",
            moduleId: 7,
            moduleName: "test",
            navBadge: "workingOrders",
            navIconName: "orders",
            navIconUrl: "data:image/svg+xml,orders",
            navOrder: 10,
            notificationTopics: ["orders"],
            title: "Orders",
          },
        ],
      },
    ]);
  });

  it("identifies a module by its federation scope, whatever its registry id", () => {
    // A server-supplied registry assigns its own numeric ids.
    const [{ items }] = buildNavSections([
      remoteModule("/Tables/Browse", "/tables/browse", {
        id: 1042,
        mfScope: "vuuTableBrowser",
        name: "table-browser",
      }),
    ]);
    expect(items[0]).toMatchObject({
      mfScope: "vuuTableBrowser",
      moduleId: 1042,
      moduleName: "table-browser",
    });
  });

  it("leaves optional metadata undefined when missing", () => {
    const [{ items }] = buildNavSections([
      remoteModule("/Trading/Orders", "/orders"),
    ]);
    expect(items[0]).toMatchObject({ href: "/orders", moduleId: "/orders" });
    for (const key of [
      "navBadge",
      "navIconName",
      "navIconUrl",
      "navOrder",
      "notificationTopics",
    ] as const) {
      expect(items[0][key]).toBeUndefined();
    }
  });

  it("ignores a second module with the same href in a section", () => {
    expect(
      outline([
        remoteModule("/Trading/Orders", "/orders", { id: 1 }),
        remoteModule("/Trading/Orders again", "/orders/*", { id: 2 }),
      ]),
    ).toEqual([["Trading", ["Orders"]]]);
  });

  it("returns no sections for no modules", () => {
    expect(buildNavSections([])).toEqual([]);
  });
});
