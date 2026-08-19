import type { ReactElement } from "react";
import type { LayoutJSON } from "./componentToJson";
import { gridLayoutDescriptorToSnapshot } from "./grid-snapshot-adapters";
import { GridLayoutItem, type GridLayoutItemProps } from "./GridLayoutItem";
import { layoutFromJson } from "./layoutFromJson";
import type { GridLayoutDescriptor } from "./GridModel";
import type { GridSnapshot } from "./GridSnapshot";
import { toJsonValue } from "./json-value";

export type LegacySerializedComponentMap = Record<string, LayoutJSON>;

/**
 * Pre-v2 GridLayout persistence envelope.
 *
 * @deprecated Read existing data with this type, then save a GridLayoutDocument.
 */
export type SerializedGridLayout = {
  components: LegacySerializedComponentMap;
  id: string;
  layout: GridLayoutDescriptor;
};

export type LegacyDeserializedGridLayout = {
  components: Record<string, ReactElement<GridLayoutItemProps>>;
  id: string;
  layout: GridLayoutDescriptor;
  placeholderIds?: readonly string[];
};

export interface LegacyGridLayoutDocument {
  readonly components: LegacySerializedComponentMap;
  readonly snapshot: GridSnapshot;
}

export type LegacyGridLayoutDecodeResult =
  | { readonly ok: true; readonly value: LegacyGridLayoutDocument }
  | {
      readonly error: {
        readonly code: "INVALID_LEGACY_GRID_LAYOUT";
        readonly message: string;
        readonly path: string;
        readonly version: 1;
      };
      readonly ok: false;
    };

/**
 * Validates and adapts the descriptor portion of a pre-v2 persistence value.
 * It deliberately does not produce a writable v2 document because legacy
 * component props are not typed component settings.
 *
 * @deprecated Use decodeGridLayoutDocument for all new persistence.
 */
export const decodeLegacySerializedGridLayout = (
  value: SerializedGridLayout,
): LegacyGridLayoutDecodeResult => {
  const json = toJsonValue(value);
  if (!json.ok) {
    return {
      error: {
        code: "INVALID_LEGACY_GRID_LAYOUT",
        message: json.error.message,
        path: json.error.path,
        version: 1,
      },
      ok: false,
    };
  }
  try {
    return {
      ok: true,
      value: {
        components: value.components,
        snapshot: gridLayoutDescriptorToSnapshot(value.layout, {
          gridId: value.id,
        }),
      },
    };
  } catch (cause) {
    return {
      error: {
        code: "INVALID_LEGACY_GRID_LAYOUT",
        message:
          cause instanceof Error ? cause.message : "invalid legacy GridLayout",
        path: "$.layout",
        version: 1,
      },
      ok: false,
    };
  }
};

export interface LegacyGridLayoutReader {
  getSavedGrid(id: string): LegacyDeserializedGridLayout | undefined;
}

/**
 * Creates the narrow, read-only React compatibility boundary used by the
 * deprecated provider input. No mutations are written back to the legacy
 * descriptor or generic React-prop component map.
 */
export const createLegacyGridLayoutReader = (
  serializedLayout: SerializedGridLayout,
): LegacyGridLayoutReader => {
  const decoded = decodeLegacySerializedGridLayout(serializedLayout);
  if (!decoded.ok) {
    throw new Error(`${decoded.error.path}: ${decoded.error.message}`);
  }
  return {
    getSavedGrid(id) {
      if (id !== serializedLayout.id) {
        return undefined;
      }
      return {
        components: Object.entries(serializedLayout.components).reduce<
          Record<string, ReactElement<GridLayoutItemProps>>
        >((components, [itemId, component]) => {
          const item = serializedLayout.layout.gridLayoutItems?.[itemId];
          if (!item) {
            throw new Error(
              `$.layout.gridLayoutItems.${itemId}: legacy component has no matching layout item`,
            );
          }
          const { gridArea, ...props } = item;
          components[itemId] = (
            <GridLayoutItem
              {...props}
              id={itemId}
              key={itemId}
              style={{ gridArea }}
            >
              {layoutFromJson(component)}
            </GridLayoutItem>
          );
          return components;
        }, {}),
        id,
        layout: serializedLayout.layout,
      };
    },
  };
};

/** @deprecated Legacy component JSON may contain React-derived props. */
export type LegacyGridLayoutComponentJson = LayoutJSON;
