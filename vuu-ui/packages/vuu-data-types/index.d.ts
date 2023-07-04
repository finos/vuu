import { VuuFilter, VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { Filter } from "@finos/vuu-filter-types";

export interface DataSourceFilter extends VuuFilter {
  filterStruct?: Filter;
}

export interface NamedDataSourceFilter extends DataSourceFilter {
  id?: string;
  name?: string;
}

type RowIndex = number;
type RenderKey = number;
type IsLeaf = boolean;
type IsExpanded = boolean;
type Depth = number;
type ChildCount = number;
type RowKey = string;
export type IsSelected = number;

export type DataSourceRow = [
  RowIndex,
  RenderKey,
  IsLeaf,
  IsExpanded,
  Depth,
  ChildCount,
  RowKey,
  IsSelected,
  ...VuuRowDataItemType[]
];

export type DataSourceRowPredicate = (row: DataSourceRow) => boolean;

export interface ContextMenuItemBase {
  icon?: string;
  label: string;
  location?: string;
}

export interface ContextMenuLeafItemDescriptor extends ContextMenuItemBase {
  action: string;
  options?: unknown;
}

export interface ContextMenuGroupItemDescriptor extends ContextMenuItemBase {
  children: ContextMenuItemDescriptor[];
}

export type ContextMenuItemDescriptor =
  | ContextMenuLeafItemDescriptor
  | ContextMenuGroupItemDescriptor;

export type MenuBuilder<L = string, O = unknown> = (
  location: L,
  options: O
) => ContextMenuItemDescriptor[];

export type MenuActionHandler = (
  type: string,
  options: unknown
) => boolean | undefined;

export interface ContextMenuContextType {
  menuBuilders: MenuBuilder[];
  menuActionHandler: MenuActionHandler;
}
