import React from "react";
import { describe, expect, it } from "vitest";
import {
  type GridComponentSettingsCodec,
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
  GridLayoutContentRegistry,
  type GridSettingsCodecResult,
} from "../src/GridComponentSettings";
import {
  decodeGridLayoutDocument,
  encodeGridLayoutDocument,
  type GridLayoutDocumentV1,
} from "../src/GridLayoutDocument";
import { decodeLegacySerializedGridLayout } from "../src/GridLayoutLegacyCompatibility";
import { GridModel } from "../src/GridModel";
import type { GridSnapshot } from "../src/GridSnapshot";
import {
  gridLayoutDescriptorToSnapshot,
  gridSnapshotToGridLayoutDescriptor,
  normalizeGridSnapshot,
} from "../src/grid-snapshot-adapters";
import { toJsonValue } from "../src/json-value";

interface LabelSettings {
  readonly label: string;
}

interface NestedSettings {
  readonly document: unknown;
}

const isLabelSettings = (value: unknown): value is LabelSettings =>
  typeof value === "object" &&
  value !== null &&
  "label" in value &&
  typeof value.label === "string";

const labelCodec: GridComponentSettingsCodec<LabelSettings> = {
  decode: (value): GridSettingsCodecResult<LabelSettings> =>
    isLabelSettings(value)
      ? { ok: true, value }
      : {
          error: {
            code: "INVALID_LABEL",
            message: "label must be a string",
            path: "$.label",
          },
          ok: false,
        },
  encode: (settings) => ({ ok: true, value: settings }),
  isSettings: isLabelSettings,
  migrations: {
    1: (value) =>
      typeof value === "object" &&
      value !== null &&
      "text" in value &&
      typeof value.text === "string"
        ? { ok: true, value: { label: value.text } }
        : {
            error: {
              code: "INVALID_TEXT",
              message: "text must be a string",
              path: "$.text",
            },
            ok: false,
          },
  },
  version: 2,
};

const snapshot: GridSnapshot = {
  columns: [{ size: "0.5fr" }, { size: "120px" }],
  gridId: "grid",
  items: [
    {
      column: { span: 2, start: 1 },
      header: true,
      id: "b",
      resizeable: "hv",
      row: { span: 1, start: 1 },
      title: "Duplicate title",
    },
    {
      column: { span: 2, start: 1 },
      componentInstanceId: "component-a",
      id: "a",
      resizeable: false,
      row: { span: 1, start: 1 },
      title: "Duplicate title",
    },
    {
      column: { span: 1, start: 2 },
      id: "placeholder",
      row: { span: 1, start: 2 },
    },
  ],
  revision: 19,
  rows: [{ size: "1fr" }, { size: "80px" }],
  stacks: [
    {
      id: "tabs",
      itemIds: ["b", "a"],
      selectedItemId: "a",
    },
  ],
};

const settings = [
  { id: "b", settings: { label: "Beta" }, type: "label" },
  {
    id: "component-a",
    settings: { label: "Alpha" },
    type: "label",
  },
] as const;

const registry = () => {
  const result = new GridComponentSettingsRegistry();
  result.register("label", labelCodec);
  return result;
};

describe("GridLayout document codec", () => {
  it("round trips canonical state deterministically without revisions", () => {
    const codecs = registry();
    const encoded = encodeGridLayoutDocument(snapshot, codecs, {
      componentSettings: settings,
      placeholderIds: ["placeholder"],
    });
    expect(encoded.ok).toBe(true);
    if (!encoded.ok) {
      return;
    }
    expect(encoded.value).toMatchObject({
      components: [{ id: "b" }, { id: "component-a" }],
      kind: "grid-layout",
      layout: {
        id: "grid",
        placeholderIds: ["placeholder"],
        stacks: [{ itemIds: ["b", "a"], selectedItemId: "a" }],
      },
      version: 2,
    });
    expect(JSON.stringify(encoded.value)).not.toContain("revision");

    const decoded = decodeGridLayoutDocument(encoded.value, codecs);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) {
      return;
    }
    const normalized = normalizeGridSnapshot(snapshot);
    expect(decoded.value.snapshot).toEqual({
      ...normalized,
      items: [...normalized.items].sort((a, b) => a.id.localeCompare(b.id)),
      revision: 0,
    });

    const reencoded = encodeGridLayoutDocument(decoded.value.snapshot, codecs, {
      componentSettings: decoded.value.components,
      placeholderIds: decoded.value.document.layout.placeholderIds,
    });
    expect(reencoded).toEqual(encoded);
    expect(decoded.value.snapshot.items).not.toBe(snapshot.items);
  });

  it("migrates document and component settings versions", () => {
    const v1: GridLayoutDocumentV1 = {
      components: [
        {
          id: "only",
          settings: { text: "Migrated" },
          type: "label",
          version: 1,
        },
      ],
      kind: "grid-layout",
      layout: {
        columns: ["1fr"],
        gridId: "old-grid",
        items: [
          {
            column: { span: 1, start: 1 },
            id: "only",
            row: { span: 1, start: 1 },
          },
        ],
        rows: ["1fr"],
      },
      version: 1,
    };

    const decoded = decodeGridLayoutDocument(v1, registry());
    expect(decoded).toMatchObject({
      ok: true,
      value: {
        components: [{ settings: { label: "Migrated" }, version: 2 }],
        document: { layout: { id: "old-grid" }, version: 2 },
      },
    });
  });

  it.each([
    [
      "future document",
      { kind: "grid-layout", version: 99 },
      "UNSUPPORTED_DOCUMENT_VERSION",
      "$.version",
    ],
    [
      "wrong discriminator",
      { kind: "other", version: 2 },
      "INVALID_DISCRIMINATOR",
      "$.kind",
    ],
    [
      "future component",
      {
        components: [{ id: "x", settings: {}, type: "label", version: 99 }],
        kind: "grid-layout",
        layout: {
          columns: ["1fr"],
          id: "grid",
          items: [
            {
              column: { span: 1, start: 1 },
              id: "x",
              row: { span: 1, start: 1 },
            },
          ],
          placeholderIds: [],
          rows: ["1fr"],
          stacks: [],
        },
        version: 2,
      },
      "COMPONENT_SETTINGS_ERROR",
      "$.components[0].version",
    ],
  ])("rejects %s with a path-aware error", (_name, value, code, path) => {
    expect(decodeGridLayoutDocument(value, registry())).toMatchObject({
      error: { code, path },
      ok: false,
    });
  });

  it("rejects malformed references and missing component settings", () => {
    const encoded = encodeGridLayoutDocument(snapshot, registry(), {
      componentSettings: settings,
      placeholderIds: ["placeholder"],
    });
    if (!encoded.ok) {
      throw new Error(encoded.error.message);
    }
    const malformed = {
      ...encoded.value,
      layout: {
        ...encoded.value.layout,
        placeholderIds: [],
      },
    };
    expect(decodeGridLayoutDocument(malformed, registry())).toMatchObject({
      error: {
        code: "MISSING_COMPONENT_SETTINGS",
        path: "$.layout.items.placeholder",
      },
      ok: false,
    });
  });

  it("rejects unsupported runtime values rather than coercing them", () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;

    for (const [value, code] of [
      [() => undefined, "UNSUPPORTED_VALUE"],
      [Symbol("x"), "UNSUPPORTED_VALUE"],
      [undefined, "UNSUPPORTED_VALUE"],
      [Number.NaN, "INVALID_NUMBER"],
      [Number.POSITIVE_INFINITY, "INVALID_NUMBER"],
      [new Date(), "NON_PLAIN_OBJECT"],
      [
        React.createElement("div", { key: "react-element" }),
        "UNSUPPORTED_VALUE",
      ],
      [{ [Symbol("key")]: "value" }, "UNSUPPORTED_VALUE"],
      [cyclic, "CYCLE"],
    ] as const) {
      expect(toJsonValue(value)).toMatchObject({
        error: { code },
        ok: false,
      });
    }
    const arrayWithProperty: unknown[] & { extra?: unknown } = [];
    arrayWithProperty.extra = () => undefined;
    expect(toJsonValue(arrayWithProperty)).toMatchObject({
      error: { code: "UNSUPPORTED_VALUE", path: "$.extra" },
      ok: false,
    });
  });

  it("keeps content registry replacement atomic", () => {
    const content = new GridLayoutContentRegistry<string>();
    content.replace(
      [{ id: "old", settings: { label: "Old" }, type: "label", version: 2 }],
      ({ id }) => id,
    );

    expect(() =>
      content.replace(
        [
          { id: "new", settings: { label: "New" }, type: "label", version: 2 },
          { id: "broken", settings: {}, type: "label", version: 2 },
        ],
        ({ id }) => {
          if (id === "broken") {
            throw new Error("cannot render");
          }
          return id;
        },
      ),
    ).toThrow("cannot render");
    expect([...content.entries()]).toEqual([["old", "old"]]);
  });

  it("resolves decoded settings through a separate renderer registry", () => {
    const renderers = new GridComponentRendererRegistry();
    renderers.register("label", isLabelSettings, ({ label }, id) =>
      React.createElement("span", { id }, label),
    );
    const element = renderers.render({
      id: "alpha",
      settings: { label: "Alpha" },
      type: "label",
      version: 2,
    });
    expect(element.type).toBe("span");
    expect(element.props.children).toBe("Alpha");
  });

  it("round trips a nested GridLayout document as independent settings", () => {
    const codecs = registry();
    codecs.register<NestedSettings>("nested-grid", {
      decode: (value) =>
        typeof value === "object" && value !== null && "document" in value
          ? { ok: true, value: { document: value.document } }
          : {
              error: {
                code: "INVALID_NESTED_GRID",
                message: "nested document is required",
                path: "$.document",
              },
              ok: false,
            },
      encode: (value) => ({ ok: true, value }),
      isSettings: (value): value is NestedSettings =>
        typeof value === "object" && value !== null && "document" in value,
      version: 1,
    });
    const nested = encodeGridLayoutDocument(
      {
        columns: [{ size: "1fr" }],
        gridId: "nested",
        items: [
          {
            column: { span: 1, start: 1 },
            id: "nested-item",
            row: { span: 1, start: 1 },
          },
        ],
        revision: 0,
        rows: [{ size: "1fr" }],
        stacks: [],
      },
      codecs,
      {
        componentSettings: [
          {
            id: "nested-item",
            settings: { label: "Nested" },
            type: "label",
          },
        ],
      },
    );
    if (!nested.ok) {
      throw new Error(nested.error.message);
    }
    const outer = encodeGridLayoutDocument(
      {
        columns: [{ size: "1fr" }],
        gridId: "outer",
        items: [
          {
            column: { span: 1, start: 1 },
            id: "nested-grid-item",
            row: { span: 1, start: 1 },
          },
        ],
        revision: 0,
        rows: [{ size: "1fr" }],
        stacks: [],
      },
      codecs,
      {
        componentSettings: [
          {
            id: "nested-grid-item",
            settings: { document: nested.value },
            type: "nested-grid",
          },
        ],
      },
    );

    expect(outer).toMatchObject({
      ok: true,
      value: {
        components: [
          {
            settings: {
              document: { kind: "grid-layout", layout: { id: "nested" } },
            },
          },
        ],
        layout: { id: "outer" },
      },
    });
    if (outer.ok) {
      expect(decodeGridLayoutDocument(outer.value, codecs)).toMatchObject({
        ok: true,
        value: {
          components: [
            {
              settings: {
                document: { kind: "grid-layout", layout: { id: "nested" } },
              },
            },
          ],
        },
      });
    }
  });

  it("adapts legacy SerializedGridLayout without changing its v1 wire shape", () => {
    const decoded = decodeLegacySerializedGridLayout({
      components: {
        green: {
          props: { style: { background: "green" } },
          type: "div",
        },
      },
      id: "legacy",
      layout: {
        cols: ["1fr"],
        gridLayoutItems: {
          green: {
            gridArea: "1/1/2/2",
            resizeable: "hv",
            title: "Green",
          },
        },
        rows: ["1fr"],
      },
    });
    expect(decoded).toMatchObject({
      ok: true,
      value: {
        snapshot: {
          gridId: "legacy",
          items: [{ id: "green", resizeable: "hv", title: "Green" }],
        },
      },
    });
  });

  it("preserves distinct item/component IDs through the legacy model bridge", () => {
    const descriptor = gridSnapshotToGridLayoutDescriptor(snapshot);
    if (!descriptor.gridLayoutItems) {
      throw new Error("descriptor has no items");
    }
    const model = new GridModel("grid", descriptor);
    const restored = gridLayoutDescriptorToSnapshot(
      model.toGridLayoutDescriptor(),
      { gridId: "grid" },
    );

    expect(
      restored.items.find(({ id }) => id === "a")?.componentInstanceId,
    ).toBe("component-a");
  });
});
