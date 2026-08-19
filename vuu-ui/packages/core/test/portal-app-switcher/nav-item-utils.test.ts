import { describe, expect, it } from "vitest";
import {
  isNestedModule,
  type RemoteModuleDescriptor,
} from "../../src/RemoteModuleDescriptor";
import { buildNavItems } from "../../src/portal-app-switcher/nav-item-utils";

const remoteModule = (
  navLocation: string,
  path: string,
  id: RemoteModuleDescriptor["id"] = path,
): RemoteModuleDescriptor => ({
  clientIdentifier: "test-module",
  description: "Test module",
  id,
  navLocation,
  accessRole: "test-access",
  mfComponent: "TestModule",
  mfScope: "test",
  mfUrl: "https://modules.example/mf-manifest.json",
  name: "test",
  path,
  title: "Test module",
  version: 1,
});

describe("isNestedModule", () => {
  it("is true only for modules without a navigation location", () => {
    expect(
      ["", "/", "///"].map((navLocation) => isNestedModule({ navLocation })),
    ).toEqual([true, true, true]);
    expect(
      ["/Tables", "/Tables/Browse", "Tables"].map((navLocation) =>
        isNestedModule({ navLocation }),
      ),
    ).toEqual([false, false, false]);
  });
});

describe("buildNavItems", () => {
  it.each([
    "single-level",
    "two-level",
  ] as const)("excludes nested modules from %s navigation", (menuStyle) => {
    expect(
      buildNavItems(
        [
          remoteModule("/Tables/Browse", "/tables/browse/*", "browser"),
          remoteModule("", "/tables/view", "viewer"),
          remoteModule("/", "/tables/other", "other"),
        ],
        menuStyle,
      ).map(({ moduleId, children }) =>
        children ? children.map((child) => child.moduleId) : moduleId,
      ),
    ).toEqual(menuStyle === "two-level" ? [["browser"]] : ["browser"]);
  });

  describe("single-level", () => {
    it("flattens mixed navigation locations without grouping shared parents", () => {
      const items = buildNavItems(
        [
          remoteModule("/Trading/Orders", "/orders/*", 1),
          remoteModule("/Administration", "/admin", "admin"),
          remoteModule("/Trading/Baskets", "/baskets", 2),
        ],
        "single-level",
      );

      expect(items).toEqual([
        { title: "Trading: Orders", href: "/orders", moduleId: 1 },
        { title: "Administration", href: "/admin", moduleId: "admin" },
        { title: "Trading: Baskets", href: "/baskets", moduleId: 2 },
      ]);
      expect(items.every((item) => !("children" in item))).toBe(true);
    });

    it("keeps distinct modules with the same navigation label", () => {
      expect(
        buildNavItems(
          [
            remoteModule("/Trading/Orders", "/orders", 1),
            remoteModule("/Trading/Orders", "/archived-orders", 2),
          ],
          "single-level",
        ),
      ).toEqual([
        { title: "Trading: Orders", href: "/orders", moduleId: 1 },
        { title: "Trading: Orders", href: "/archived-orders", moduleId: 2 },
      ]);
    });

    it("preserves each module's icon metadata", () => {
      expect(
        buildNavItems(
          [
            {
              ...remoteModule("/Trading/Orders", "/orders", 1),
              navIconName: "orders",
            },
            {
              ...remoteModule("/Trading/Baskets", "/baskets", 2),
              navIconUrl: "data:image/svg+xml;base64,test",
            },
          ],
          "single-level",
        ),
      ).toEqual([
        {
          title: "Trading: Orders",
          href: "/orders",
          moduleId: 1,
          navIconName: "orders",
        },
        {
          title: "Trading: Baskets",
          href: "/baskets",
          moduleId: 2,
          navIconUrl: "data:image/svg+xml;base64,test",
        },
      ]);
    });

    it("formats all nonempty navigation segments as a single title", () => {
      expect(
        buildNavItems(
          [remoteModule("//Trading//Orders/Details/", "/details", 1)],
          "single-level",
        ),
      ).toEqual([
        { title: "Trading: Orders: Details", href: "/details", moduleId: 1 },
      ]);
    });

    it("handles empty registries and empty locations", () => {
      expect(buildNavItems([], "single-level")).toEqual([]);
      expect(
        buildNavItems(
          ["", "/", "///"].map((location) => remoteModule(location, "/orders")),
          "single-level",
        ),
      ).toEqual([]);
    });
  });

  it("uses the existing grouped structure for an explicit two-level style", () => {
    const modules = [
      remoteModule("/Trading/Orders", "/orders", 1),
      remoteModule("/Trading/Baskets", "/baskets", 2),
    ];
    expect(buildNavItems(modules, "two-level")).toEqual(buildNavItems(modules));
    expect(buildNavItems(modules, "two-level")).toHaveLength(1);
    expect(buildNavItems(modules, "single-level")).toHaveLength(2);
  });

  it("returns no items for an empty registry", () => {
    expect(buildNavItems([])).toEqual([]);
  });

  it.each([
    "",
    "/",
    "///",
  ])("skips empty navigation location %j", (location) => {
    expect(buildNavItems([remoteModule(location, "/orders")])).toEqual([]);
  });

  it("builds flat items from navigation labels and module routes in registry order", () => {
    expect(
      buildNavItems([
        remoteModule("/Orders", "/trading/orders/*", 42),
        remoteModule("/Dashboard", "/home", "dashboard"),
      ]),
    ).toEqual([
      { title: "Orders", href: "/trading/orders", moduleId: 42 },
      { title: "Dashboard", href: "/home", moduleId: "dashboard" },
    ]);
  });

  it("groups interleaved modules and preserves parent and child order", () => {
    expect(
      buildNavItems([
        remoteModule("/Trading/Orders", "/orders/*", 1),
        remoteModule("/Reference/Instruments", "/instruments", 2),
        remoteModule("/Trading/Baskets", "/baskets", 3),
        remoteModule("/Administration", "/admin", 4),
      ]),
    ).toEqual([
      {
        title: "Trading",
        href: "/Trading",
        moduleId: undefined,
        children: [
          { title: "Orders", href: "/orders", moduleId: 1 },
          { title: "Baskets", href: "/baskets", moduleId: 3 },
        ],
      },
      {
        title: "Reference",
        href: "/Reference",
        moduleId: undefined,
        children: [{ title: "Instruments", href: "/instruments", moduleId: 2 }],
      },
      { title: "Administration", href: "/admin", moduleId: 4 },
    ]);
  });

  it("deduplicates children by normalized route within each parent", () => {
    expect(
      buildNavItems([
        remoteModule("/Trading/Orders", "/orders/*", 1),
        remoteModule("/Trading/Duplicate", "/orders", 2),
        remoteModule("/Reference/Orders", "/orders", 3),
      ]),
    ).toEqual([
      {
        title: "Trading",
        href: "/Trading",
        moduleId: undefined,
        children: [{ title: "Orders", href: "/orders", moduleId: 1 }],
      },
      {
        title: "Reference",
        href: "/Reference",
        moduleId: undefined,
        children: [{ title: "Orders", href: "/orders", moduleId: 3 }],
      },
    ]);
  });

  it("keeps the first flat item for a repeated navigation location", () => {
    expect(
      buildNavItems([
        remoteModule("/Orders", "/first", 1),
        remoteModule("/Orders", "/second", 2),
      ]),
    ).toEqual([{ title: "Orders", href: "/first", moduleId: 1 }]);
  });

  it("ignores empty path segments and uses only two navigation levels", () => {
    expect(
      buildNavItems([
        remoteModule("//Trading//Orders/Details/", "/orders/details", 1),
      ]),
    ).toEqual([
      {
        title: "Trading",
        href: "/Trading",
        moduleId: undefined,
        children: [{ title: "Orders", href: "/orders/details", moduleId: 1 }],
      },
    ]);
  });

  it("does not mutate descriptors or reuse items between calls", () => {
    const modules = [
      Object.freeze(remoteModule("/Trading/Orders", "/orders/*", 1)),
    ];
    Object.freeze(modules);

    const first = buildNavItems(modules);
    const second = buildNavItems(modules);

    expect(first).toEqual(second);
    expect(first[0]).not.toBe(second[0]);
    expect(first[0].children?.[0]).not.toBe(second[0].children?.[0]);
    expect(modules[0].path).toBe("/orders/*");
  });
});
