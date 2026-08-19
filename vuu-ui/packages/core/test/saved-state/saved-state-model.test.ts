import { describe, expect, it } from "vitest";
import type {
  DocumentSummary,
  EntrySummary,
} from "../../src/persistence/PersistenceBackend";
import {
  formatAccessibleSize,
  formatList,
  formatRelativeTime,
  formatSize,
} from "../../src/saved-state/saved-state-format";
import {
  buildSavedStateModel,
  collectLeafIds,
  describeSelection,
  filterSavedStateModel,
  formatSelectionSummary,
  fromTreeSelection,
  nodeId,
  pruneSelection,
  summariseSelection,
  toClearSelection,
  toTreeSelection,
} from "../../src/saved-state/saved-state-model";
import { toSavedStateApplications } from "../../src/saved-state/SavedStateContext";
import { describeClearResult } from "../../src/saved-state/SavedStateDialog";
import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";

const NOW = new Date("2025-06-10T12:00:00.000Z");
const hoursAgo = (hours: number) =>
  new Date(NOW.getTime() - hours * 3600_000).toISOString();

const entry = (
  key: string,
  extra: Partial<EntrySummary> = {},
): EntrySummary => ({
  key,
  size: 200,
  updatedAt: hoursAgo(2),
  ...extra,
});

const summary = (
  applicationKey: string,
  applicationVersion: number,
  entries: EntrySummary[],
  extra: Partial<DocumentSummary> = {},
): DocumentSummary => ({
  applicationKey,
  applicationVersion,
  revision: 1,
  size: entries.reduce((total, { size }) => total + size, 0),
  updatedAt: hoursAgo(2),
  entries,
  ...extra,
});

const summaries: DocumentSummary[] = [
  summary("instruments", 2, [
    entry("filters/named", { label: "Saved filters", group: "Filters" }),
    entry("filters/active", { label: "Active filter", group: "Filters" }),
    entry("table/sort", { label: "Sort order", group: "Table", size: 100 }),
    entry("table/columns", { label: "Column layout", group: "Table" }),
    entry("scratch"),
  ]),
  summary("instruments", 1, [entry("table/sort", { label: "Sort order" })]),
  summary("vuu.portal", 1, [
    entry("nav/expanded", {
      label: "Expanded navigation groups",
      group: "Navigation",
    }),
  ]),
  summary("orders", 3, [entry("columns")], { applicationTitle: "Orders" }),
  summary("broken", 1, [], {
    applicationTitle: "Module admin",
    unreadable: true,
    updatedAt: "",
  }),
  // An empty document kept only to stop earlier state being carried forward.
  summary("baskets", 2, []),
];

const applications = [
  { applicationKey: "baskets", title: "Basket trading", version: 2 },
  { applicationKey: "instruments", title: "Instruments", version: 2 },
];

const model = () =>
  buildSavedStateModel({
    applications,
    isOpen: (key, version) => key === "instruments" && version === 2,
    now: NOW,
    summaries,
  });

const entryId = (key: string, version: number, entryKey: string) =>
  nodeId("entry", key, version, entryKey);

describe("saved-state format", () => {
  it("formats relative times, sizes and lists", () => {
    expect(formatRelativeTime(hoursAgo(0), NOW)).toBe("Just now");
    expect(formatRelativeTime(hoursAgo(0.5), NOW)).toBe("30 minutes ago");
    expect(formatRelativeTime(hoursAgo(1), NOW)).toBe("1 hour ago");
    expect(formatRelativeTime(hoursAgo(5), NOW)).toBe("5 hours ago");
    expect(formatRelativeTime(hoursAgo(30), NOW)).toBe("Yesterday");
    expect(formatRelativeTime(hoursAgo(24 * 9), NOW)).toBe("9 days ago");
    expect(formatRelativeTime(hoursAgo(24 * 65), NOW)).toBe("2 months ago");
    expect(formatRelativeTime("", NOW)).toBe("Unknown");
    expect(formatSize(100)).toBe("< 1 KB");
    expect(formatSize(31 * 1024)).toBe("31 KB");
    expect(formatAccessibleSize(100)).toBe("less than 1 KB");
    expect(formatList(["A", "B", "C"])).toBe("A, B and C");
  });
});

describe("buildSavedStateModel", () => {
  it("orders applications with the Portal first, then navigation order", () => {
    const { applications: apps } = model();
    expect(apps.map(({ title }) => title)).toEqual(["Portal", "Instruments"]);
  });

  it("omits applications that only have empty documents", () => {
    expect(
      model().applications.some(
        ({ applicationKey }) => applicationKey === "baskets",
      ),
    ).toBe(false);
  });

  it("builds application, group, item and previous-version nodes", () => {
    const instruments = model().applications[1];
    expect(instruments.open).toBe(true);
    expect(instruments.node.meta).toBe(
      "Version 2 · 5 items · < 1 KB · 2 hours ago",
    );
    expect(instruments.node.accessibleName).toContain(
      "Instruments, open, version 2",
    );
    const labels = instruments.node.children?.map(({ label }) => label);
    expect(labels).toEqual([
      "Filters",
      "Table",
      "scratch",
      "Previous versions",
    ]);
    const table = instruments.node.children?.[1];
    expect(table?.meta).toBe("2 items");
    const sort = table?.children?.[0];
    expect(sort).toMatchObject({
      label: "Sort order",
      detail: "table/sort",
      meta: "< 1 KB · 2 hours ago",
      accessibleName: "Sort order, 2 hours ago, less than 1 KB",
    });
    const previous = instruments.node.children?.[3];
    expect(previous?.meta).toBe("1 version");
    expect(previous?.children?.[0]).toMatchObject({
      id: nodeId("document", "instruments", 1),
      label: "Version 1",
    });
  });

  it("shows carried-forward and not-carried-forward state (§9.15)", () => {
    const { applications: apps } = buildSavedStateModel({
      applications,
      now: NOW,
      summaries: [
        summary(
          "instruments",
          2,
          [entry("table/sort", { label: "Sort order" })],
          {
            carriedForwardFrom: 1,
            notCarriedForward: [
              {
                key: "table/columns",
                label: "Column layout",
                fromVersion: 1,
                reason: "Column 'lotSize' was removed in version 2.",
              },
            ],
          },
        ),
      ],
    });
    const node = apps[0].node;
    expect(node.meta).toContain("Carried forward from version 1");
    const group = node.children?.find(
      ({ kind }) => kind === "not-carried-forward-group",
    );
    expect(group?.label).toBe("Not carried forward");
    expect(group?.children?.[0]).toMatchObject({
      tag: "Not carried forward",
      tooltip: "Column 'lotSize' was removed in version 2.",
    });
  });

  it("groups removed and unreadable documents as unavailable (§9.9)", () => {
    const { unavailable } = model();
    expect(unavailable?.meta).toBe("2 applications · can only be cleared");
    expect(
      unavailable?.children?.map(({ label, tag, unreadable }) => ({
        label,
        tag,
        unreadable,
      })),
    ).toEqual([
      { label: "Orders", tag: "No longer available", unreadable: undefined },
      { label: "Module admin", tag: undefined, unreadable: true },
    ]);
    expect(unavailable?.children?.every(({ children }) => !children)).toBe(
      true,
    );
  });

  it("treats every application as available without a registry", () => {
    const { applications: apps, unavailable } = buildSavedStateModel({
      now: NOW,
      summaries: summaries.filter(({ unreadable }) => !unreadable),
    });
    expect(unavailable).toBeUndefined();
    expect(apps.map(({ title }) => title)).toEqual([
      "Portal",
      "instruments",
      "Orders",
    ]);
  });

  it("is empty when there's no saved state", () => {
    expect(buildSavedStateModel({ summaries: [] }).empty).toBe(true);
  });
});

describe("filterSavedStateModel", () => {
  it("filters by item label, key or group and expands ancestors (§9.5)", () => {
    const m = model();
    const byLabel = filterSavedStateModel(m, { search: "sort" });
    expect(collectLeafIds(byLabel.nodes)).toEqual([
      entryId("instruments", 2, "table/sort"),
    ]);
    expect(byLabel.matchedAncestors).toEqual(
      expect.arrayContaining([
        nodeId("application", "instruments"),
        nodeId("group", "instruments", 2, "Table"),
      ]),
    );
    const byKey = filterSavedStateModel(m, { search: "filters/active" });
    expect(collectLeafIds(byKey.nodes)).toEqual([
      entryId("instruments", 2, "filters/active"),
    ]);
    const byGroup = filterSavedStateModel(m, { search: "navigation" });
    expect(collectLeafIds(byGroup.nodes)).toEqual([
      entryId("vuu.portal", 1, "nav/expanded"),
    ]);
  });

  it("scopes to one application (§9.4)", () => {
    const { nodes } = filterSavedStateModel(model(), { scope: "instruments" });
    expect(nodes.map(({ label }) => label)).toEqual(["Instruments"]);
  });
});

describe("selection", () => {
  it("includes fully-selected parents in the Tree selection (§9.13)", () => {
    const m = model();
    const { nodes } = filterSavedStateModel(m, {});
    const selection = new Set([
      entryId("instruments", 2, "filters/named"),
      entryId("instruments", 2, "filters/active"),
      entryId("instruments", 2, "table/sort"),
    ]);
    const selected = toTreeSelection(nodes, selection);
    expect(selected).toContain(nodeId("group", "instruments", 2, "Filters"));
    expect(selected).not.toContain(nodeId("group", "instruments", 2, "Table"));
    expect(selected).not.toContain(nodeId("application", "instruments"));
  });

  it("keeps selections hidden by the search", () => {
    const m = model();
    const hidden = entryId("instruments", 2, "filters/named");
    const { nodes } = filterSavedStateModel(m, { search: "sort" });
    const sort = entryId("instruments", 2, "table/sort");
    const next = fromTreeSelection(nodes, new Set([hidden]), [
      sort,
      nodeId("group", "instruments", 2, "Table"),
    ]);
    expect([...next].sort()).toEqual([hidden, sort].sort());
    expect(formatSelectionSummary(summariseSelection(m, next))).toBe(
      "2 items selected in 1 application",
    );
    expect(formatSelectionSummary({ items: 0, applications: 0 })).toBe(
      "Nothing selected",
    );
  });

  it("drops selected items that no longer exist", () => {
    const m = model();
    const kept = entryId("instruments", 2, "table/sort");
    expect([...pruneSelection(m, new Set([kept, "gone"]))]).toEqual([kept]);
  });

  it("converts the selection to a ClearSelection", () => {
    const m = model();
    const all = (key: string, version: number) =>
      collectLeafIds(
        filterSavedStateModel(m, {}).nodes.filter(
          ({ applicationKey }) => applicationKey === key,
        ),
      ).filter((id) => id.includes(`,${version},`));
    const selection = new Set([
      entryId("instruments", 2, "table/sort"),
      nodeId("document", "instruments", 1),
      ...all("vuu.portal", 1),
      nodeId("removed", "orders"),
      nodeId("unreadable", "broken", 1),
    ]);
    expect(toClearSelection(m, selection)).toEqual(
      expect.arrayContaining([
        {
          applicationKey: "instruments",
          applicationVersion: 2,
          keys: ["table/sort"],
        },
        { applicationKey: "instruments", applicationVersion: 1 },
        { applicationKey: "vuu.portal", applicationVersion: 1 },
        { applicationKey: "orders", applicationVersion: 3 },
        { applicationKey: "broken", applicationVersion: 1, unreadable: true },
      ]),
    );
    expect(summariseSelection(m, selection)).toEqual({
      items: 5,
      applications: 4,
    });
  });

  it("describes the selection for the confirmation (§9.6)", () => {
    const m = model();
    const selection = new Set([
      entryId("instruments", 2, "filters/named"),
      entryId("instruments", 2, "filters/active"),
      entryId("instruments", 2, "table/sort"),
      nodeId("document", "instruments", 1),
      entryId("vuu.portal", 1, "nav/expanded"),
    ]);
    expect(
      describeSelection(m, selection).map(
        ({ description, title }) => `${title} — ${description}`,
      ),
    ).toEqual([
      "Portal — all saved state",
      "Instruments — Saved filters, Active filter, Sort order",
      "Instruments — Version 1 (all items)",
    ]);
    expect(describeSelection(m, selection)[1].open).toBe(true);
  });
});

describe("toSavedStateApplications", () => {
  const module = (
    clientIdentifier: string,
    navLocation: string,
    extra: Partial<RemoteModuleDescriptor> = {},
  ) =>
    ({
      clientIdentifier,
      navLocation,
      title: clientIdentifier.toUpperCase(),
      version: 1,
      ...extra,
    }) as RemoteModuleDescriptor;

  it("keys modules by persistenceKey or clientIdentifier, in navigation order", () => {
    expect(
      toSavedStateApplications([
        module("orders", "/Trading/Orders"),
        module("admin", "/Admin"),
        module("baskets", "/Trading/Baskets", { persistenceKey: "baskets-v2" }),
        module("off", "/Off", { enabled: false }),
      ]).map(({ applicationKey }) => applicationKey),
    ).toEqual(["orders", "baskets-v2", "admin"]);
  });
});

describe("describeClearResult", () => {
  const ref = (applicationKey: string, applicationVersion: number) => ({
    user: "steve",
    applicationKey,
    applicationVersion,
  });

  it("counts cleared items and asks open applications to reload", () => {
    const m = model();
    const selection = [
      {
        applicationKey: "instruments",
        applicationVersion: 2,
        keys: ["scratch"],
      },
      { applicationKey: "vuu.portal", applicationVersion: 1 },
    ];
    expect(
      describeClearResult(m, selection, {
        cleared: [],
        failed: [],
        requiresReload: [ref("instruments", 2)],
      }),
    ).toEqual({
      status: "success",
      title: "Saved state cleared",
      body: "2 items cleared from 2 applications. Reload to return Instruments to its default view.",
    });
    expect(
      describeClearResult(m, selection, {
        cleared: [],
        failed: [],
        requiresReload: [ref("instruments", 2), ref("vuu.portal", 1)],
      }).body,
    ).toBe(
      "2 items cleared from 2 applications. Reload to return Instruments and Portal to their default views.",
    );
  });

  it("names the applications that couldn't be cleared", () => {
    const selection = [
      {
        applicationKey: "instruments",
        applicationVersion: 2,
        keys: ["scratch"],
      },
    ];
    expect(
      describeClearResult(model(), selection, {
        cleared: [],
        failed: [{ ref: ref("instruments", 2), error: Error("full") }],
        requiresReload: [],
      }),
    ).toEqual({
      status: "error",
      title: "Saved state couldn't be cleared",
      body: "Saved state for Instruments couldn't be cleared. It is still selected, so you can try again.",
    });
  });
});
