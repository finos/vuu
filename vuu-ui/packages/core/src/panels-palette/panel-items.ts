import type { TypedComponentTemplate } from "@heswell/grid-layout";
import type { VuuModuleWorkspaceDescriptor } from "@vuu-ui/vuu-protocol-types";
import type { PaletteModule } from "../portal-components/palette-modules";
import { vuuTableTemplate } from "../portal-components/vuu-table-component";

export type PanelItemKind = "module" | "table";

/** `workspace.defaultSize` of a module, in grid tracks. */
export type PanelDefaultSize = VuuModuleWorkspaceDescriptor["defaultSize"];

/** An entry of the Panels palette: something that can be opened as a panel. */
export interface PanelItem {
  readonly defaultSize?: PanelDefaultSize;
  readonly iconUrl?: string;
  /**
   * Stable identity, `module:<moduleId>` or
   * `table:<serverId>/<module>/<table>`.
   */
  readonly key: string;
  readonly kind: PanelItemKind;
  readonly label: string;
  readonly subtitle?: string;
  readonly template: TypedComponentTemplate;
}

export interface PanelItemGroup {
  readonly items: readonly PanelItem[];
  readonly label: string;
}

/** The palette item of a module returned by `getPaletteModules`. */
export const modulePanelItem = ({
  defaultSize,
  descriptor,
  iconUrl,
  label,
  template,
}: PaletteModule): PanelItem => ({
  ...(defaultSize ? { defaultSize } : {}),
  ...(iconUrl ? { iconUrl } : {}),
  key: `module:${descriptor.id}`,
  kind: "module",
  label,
  ...(descriptor.description ? { subtitle: descriptor.description } : {}),
  template,
});

/** The palette item of a Vuu table, a `vuu-table` template. */
export const tablePanelItem = (
  serverId: string,
  module: string,
  table: string,
): PanelItem => ({
  key: `table:${serverId}/${module}/${table}`,
  kind: "table",
  label: table,
  subtitle: module,
  template: vuuTableTemplate({ module, serverId, table }),
});

/**
 * Keeps the items that match every whitespace separated term of `filter`,
 * case-insensitively, in their label, subtitle or group label. Empty groups
 * are dropped.
 */
export const filterPanelItemGroups = (
  groups: readonly PanelItemGroup[],
  filter: string,
): PanelItemGroup[] => {
  const terms = filter.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return [...groups];
  }
  return groups.flatMap((group) => {
    const items = group.items.filter((item) => {
      const text =
        `${item.label} ${item.subtitle ?? ""} ${group.label}`.toLowerCase();
      return terms.every((term) => text.includes(term));
    });
    return items.length > 0 ? [{ ...group, items }] : [];
  });
};
