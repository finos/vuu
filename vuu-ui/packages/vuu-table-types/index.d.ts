import type { Filter } from "@finos/vuu-filter-types";
import type {
  VuuAggType,
  VuuColumnDataType,
  VuuRowDataItemType,
  VuuSortType,
  VuuTable,
} from "@finos/vuu-protocol-types";
import type { VuuDataRow } from "@finos/vuu-protocol-types";
import type { ValueFormatter } from "@finos/vuu-table";
import type { ClientSideValidationChecker } from "@finos/vuu-ui-controls";
import type { DateTimePattern } from "@finos/vuu-utils";
import type { FunctionComponent, MouseEvent } from "react";
import type { HTMLAttributes } from "react";

export type TableSelectionModel = "none" | "single" | "checkbox" | "extended";

export type TableHeading = { label: string; width: number };
export type TableHeadings = TableHeading[][];

export type DataCellEditHandler = (
  row: DataSourceRow,
  columnName: string,
  value: VuuRowDataItemType
) => Promise<string | true>;

export interface TableCellProps {
  className?: string;
  column: RuntimeColumnDescriptor;
  columnMap: ColumnMap;
  onClick?: (event: MouseEvent, column: RuntimeColumnDescriptor) => void;
  onDataEdited?: DataCellEditHandler;
  row: DataSourceRow;
}

export type CommitResponse = Promise<true | string>;

export type DataItemCommitHandler<
  T extends VuuRowDataItemType = VuuRowDataItemType
> = (value: T) => CommitResponse;

export type TableRowClickHandler = (row: VuuDataRow) => void;

export type RowClickHandler = (
  row: DataSourceRow,
  rangeSelect: boolean,
  keepExistingSelection: boolean
) => void;

export interface TableCellRendererProps
  extends Omit<TableCellProps, "onDataEdited"> {
  onCommit?: DataItemCommitHandler;
}

export interface TableAttributes {
  columnDefaultWidth?: number;
  columnFormatHeader?: "capitalize" | "uppercase";
  columnSeparators?: boolean;
  // showHighlightedRow?: boolean;
  rowSeparators?: boolean;
  zebraStripes?: boolean;
}

/**
 * TableConfig describes the configuration used to render a Table. It is
 * a required prop for Table and provided initially by user. It can be
 * edited using Settings Editors (Table and Column) and can be persisted
 * across sessions.
 */
export interface TableConfig extends TableAttributes {
  columns: ColumnDescriptor[];
}
export interface GridConfig extends TableConfig {
  headings: TableHeadings;
  selectionBookendWidth?: number;
}

export declare type ColumnTypeFormatting = {
  alignOnDecimals?: boolean;
  decimals?: number;
  pattern?: DateTimePattern;
  zeroPad?: boolean;
};

export type ColumnTypeValueMap = { [key: string]: string };

export interface EditValidationRule {
  name: string;
  message?: string;
  value?: string;
}

export type ListOption = {
  label: string;
  value: number | string;
};

/**
 * Descibes a custom cell renderer for a Table column
 */
export interface ColumnTypeRendering {
  associatedField?: string;
  // specific to Background renderer
  flashStyle?: "bg-only" | "arrow-bg" | "arrow";
  name: string;
  rules?: EditValidationRule[];
}
export interface MappedValueTypeRenderer {
  map: ColumnTypeValueMap;
}

export type LookupTableDetails = {
  labelColumn: string;
  table: VuuTable;
  valueColumn: string;
};
/**
 * This describes a serverside lookup table which will be bound to the edit control
 * for this column. The lookup table will typically have two columns, mapping a
 * numeric value to a User friendly display string.
 */
export interface LookupRenderer {
  name: string;
  lookup: LookupTableDetails;
}

export interface ValueListRenderer {
  name: string;
  values: string[];
}

export declare type DateTimeColumnTypeSimple = "date/time";

type DateTimeColumnType =
  | DateTimeColumnTypeSimple
  | (Omit<ColumnTypeDescriptor, "name"> & { name: DateTimeColumnTypeSimple });

export declare type DateTimeColumnDescriptor = Omit<
  ColumnDescriptor,
  "type"
> & {
  type: DateTimeColumnType;
};

export declare type ColumnTypeSimple =
  | "string"
  | "number"
  | "boolean"
  | "json"
  | DateTimeColumnTypeSimple
  | "checkbox";

export declare type ColumnTypeDescriptor = {
  formatting?: ColumnTypeFormatting;
  name: ColumnTypeSimple;
  renderer?:
    | ColumnTypeRendering
    | LookupRenderer
    | MappedValueTypeRenderer
    | ValueListRenderer;
};

export declare type ColumnTypeDescriptorCustomRenderer = {
  formatting?: ColumnTypeFormatting;
  name: ColumnTypeSimple;
  renderer: ColumnTypeRendering;
};

export interface ColumnTypeRendererWithValidationRules
  extends ColumnTypeRendering {
  rules: EditValidationRule[];
}

export interface ColumnTypeWithValidationRules extends ColumnTypeDescriptor {
  renderer: ColumnTypeRendererWithValidationRules;
}

export declare type ColumnType = ColumnTypeSimple | ColumnTypeDescriptor;

export type ColumnSort = VuuSortType | number;

export type PinLocation = "left" | "right" | "floating";

export type ColumnAlignment = "left" | "right";

/** This is a public description of a Column, defining all the
 * column attributes that can be defined by client. */
export interface ColumnDescriptor {
  aggregate?: VuuAggType;
  align?: ColumnAlignment;
  className?: string;
  colHeaderContentRenderer?: string;
  colHeaderLabelRenderer?: string;
  editable?: boolean;
  flex?: number;
  /**
   Optional additional level(s) of heading to display above label.
   May span multiple columns, if multiple adjacent columns declare
   same heading at same level.
  */
  heading?: string[];
  hidden?: boolean;
  isSystemColumn?: boolean;
  /** The Label to display on column in Table */
  label?: string;
  locked?: boolean;
  minWidth?: number;
  name: string;
  pin?: PinLocation;
  resizeable?: boolean;
  serverDataType?: VuuColumnDataType;
  sortable?: boolean;
  type?: ColumnType;
  width?: number;
}

export interface ColumnDescriptorCustomRenderer
  extends Omit<ColumnDescriptor, "type"> {
  type: ColumnTypeDescriptorCustomRenderer;
}

/** This is an internal description of a Column that extends the public
 * definitin with internal state values. */
export interface RuntimeColumnDescriptor extends ColumnDescriptor {
  align?: "left" | "right";
  CellRenderer?: FunctionComponent<TableCellRendererProps>;
  HeaderCellLabelRenderer?: FunctionComponent<HeaderCellProps>;
  HeaderCellContentRenderer?: FunctionComponent<HeaderCellProps>;
  className?: string;
  clientSideEditValidationCheck?: ClientSideValidationChecker;
  endPin?: true | undefined;
  filter?: Filter;
  flex?: number;
  heading?: [...string[]];
  isGroup?: boolean;
  isSystemColumn?: boolean;
  key: number;
  label: string;
  locked?: boolean;
  marginLeft?: number;
  moving?: boolean;
  /** used only when column is a child of GroupColumn  */
  originalIdx?: number;
  pinnedOffset?: number;
  resizeable?: boolean;
  resizing?: boolean;
  sortable?: boolean;
  sorted?: ColumnSort;
  type?: ColumnType;
  valueFormatter: ValueFormatter;
  width: number;
}

export interface GroupColumnDescriptor extends RuntimeColumnDescriptor {
  columns: RuntimeColumnDescriptor[];
  groupConfirmed: boolean;
}

export interface Heading {
  collapsed?: boolean;
  key: string;
  hidden?: boolean;
  isHeading: true;
  label: string;
  name: string;
  resizeable?: boolean;
  resizing?: boolean;
  width: number;
}

// These are the actions that eventually get routed to the DataSource itself
export type DataSourceAction =
  | GridActionCloseTreeNode
  | GridActionGroup
  | GridActionOpenTreeNode
  | GridActionSort;

export type ScrollAction =
  | GridActionScrollEndHorizontal
  | GridActionScrollStartHorizontal;

export type GridAction =
  | DataSourceAction
  | ScrollAction
  | GridActionResizeCol
  | GridActionSelection;

/**
 * Describes the props for a Column Configuration Editor, for which
 * an implementation is provided in vuu-table-extras
 */
export interface ColumnSettingsProps {
  column: ColumnDescriptor;
  onConfigChange: (config: TableConfig) => void;
  onCancelCreateColumn: () => void;
  onCreateCalculatedColumn: (column: ColumnDescriptor) => void;
  tableConfig: TableConfig;
  vuuTable: VuuTable;
}

/**
 * Describes the props for a Table Configuration Editor, for which
 * an implementation is provided in vuu-table-extras
 */
export interface TableSettingsProps {
  availableColumns: SchemaColumn[];
  onAddCalculatedColumn: () => void;
  onConfigChange: (config: TableConfig) => void;
  onDataSourceConfigChange: (dataSOurceConfig: DataSourceConfig) => void;
  onNavigateToColumn?: (columnName: string) => void;
  tableConfig: TableConfig;
}

export type DefaultColumnConfiguration = <T extends string = string>(
  tableName: T,
  columnName: string
) => Partial<ColumnDescriptor> | undefined;

export type ResizePhase = "begin" | "resize" | "end";

export type TableColumnResizeHandler = (
  phase: ResizePhase,
  columnName: string,
  width?: number
) => void;

export interface HeaderCellProps extends HTMLAttributes<HTMLDivElement> {
  classBase?: string;
  column: RuntimeColumnDescriptor;
  onResize?: TableColumnResizeHandler;
}
