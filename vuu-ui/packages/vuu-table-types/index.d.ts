import type { DataSourceRowObject } from "@finos/vuu-data-types";
import { DataSourceRow } from "@finos/vuu-data-types";
import type { Filter } from "@finos/vuu-filter-types";
import type {
  VuuAggType,
  VuuColumnDataType,
  VuuMenuItem,
  VuuRowDataItemType,
  VuuSortType,
  VuuTable
} from "@finos/vuu-protocol-types";
import type { ClientSideValidationChecker } from "@finos/vuu-ui-controls";
import type {
  ColumnMap,
  DateTimePattern,
  RowClassNameGenerator
} from "@finos/vuu-utils";
import type {
  CSSProperties,
  FunctionComponent,
  HTMLAttributes,
  MouseEvent,
  ReactElement
} from "react";

export type TableSelectionModel = "none" | "single" | "checkbox" | "extended";

export type TableHeading = { label: string; width: number };
export type TableHeadings = TableHeading[][];

export type ValueFormatter = (value: unknown) => string;

export type ClientSideValidationChecker = (
  value?: VuuRowDataItemType
) => string | false | undefined;

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

export type TableRowSelectHandler = (row: DataSourceRowObject | null) => void;
export type TableRowSelectHandlerInternal = (row: DataSourceRow | null) => void;

/**
 * Fired when user clicks a row, returning the row object (DataSourceRowObject)
 */
export type TableRowClickHandler = (
  evt: MouseEvent<HTMLDivElement>,
  row: DataSourceRowObject
) => void;

export type TableRowClickHandlerInternal = (
  evt: MouseEvent<HTMLDivElement>,
  row: DataSourceRow,
  rangeSelect: boolean,
  keepExistingSelection: boolean
) => void;

export interface TableCellRendererProps
  extends Omit<TableCellProps, "onDataEdited"> {
  onCommit?: DataItemCommitHandler;
}

/**
 * static layout simply respects widths specified on column descriptors.
 * fit layout attempts to fit columns to available space, either stretching
 * or squeezing. manual indicates that user has resized one or more columns,
 * on what was originally a fit layout. Once this happens, no further auto
 * fitting will take place. Fit layout always respects max and min widths,
 */
export type ColumnLayout = "static" | "fit" | "manual";

export interface TableAttributes {
  columnDefaultWidth?: number;
  columnFormatHeader?: "capitalize" | "uppercase";
  columnLayout?: ColumnLayout;
  columnSeparators?: boolean;
  // showHighlightedRow?: boolean;
  rowSeparators?: boolean;
  zebraStripes?: boolean;
}

export type TableMenuLocation = "grid" | "header" | "filter";

export interface VuuCellMenuItem extends VuuMenuItem {
  rowKey: string;
  field: string;
  value: VuuRowDataItemType;
}
export interface VuuRowMenuItem extends VuuMenuItem {
  rowKey: string;
  row: { [key: string]: VuuRowDataItemType };
}

/**
 * TableConfig describes the configuration used to render a Table. It is
 * a required prop for Table and provided initially by user. It can be
 * edited using Settings Editors (Table and Column) and can be persisted
 * across sessions.
 */
export interface TableConfig extends TableAttributes {
  columns: ColumnDescriptor[];
  rowClassNameGenerators?: string[];
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

export declare type ColumnTypeDescriptorCustomRenderer = {
  formatting?: ColumnTypeFormatting;
  name: ColumnTypeSimple;
  renderer: ColumnTypeRendering;
};

export interface FormattingSettingsProps<
  T extends ColumnDescriptor = ColumnDescriptor
> {
  column: T;
  onChangeFormatting: (formatting: ColumnTypeFormatting) => void;
  /** 
   Triggered by a change to the ColumnDescriptor column type, which is
   not the same as ServerDataType and allows for a refinement of the
   latter. e.g a server data type of long may be further refined as
   a date/time value using the column descriptor type.
   */
  onChangeColumnType: (type: ColumnTypeSimple) => void;
}

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

export type BulkEdit = "bulk" | false | "read-only";

/** This is a public description of a Column, defining all the
 * column attributes that can be defined by client. */
export interface ColumnDescriptor {
  aggregate?: VuuAggType;
  align?: ColumnAlignment;
  className?: string;
  colHeaderContentRenderer?: string;
  colHeaderLabelRenderer?: string;
  editable?: boolean;
  editableBulk?: BulkEdit;
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
  maxWidth?: number;
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
  canStretch?: boolean;
  className?: string;
  clientSideEditValidationCheck?: ClientSideValidationChecker;
  endPin?: true | undefined;
  filter?: Filter;
  flex?: number;
  heading?: [...string[]];
  /** A 1 based index for aria-colindex */
  index?: number;
  isGroup?: boolean;
  isSystemColumn?: boolean;
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
  allowColumnLabelCase?: boolean;
  allowColumnDefaultWidth?: boolean;
  allowGridRowStyling?: boolean;
  availableColumns: SchemaColumn[];
  onAddCalculatedColumn: () => void;
  onConfigChange: (config: TableConfig) => void;
  onDataSourceConfigChange: (dataSourceConfig: DataSourceConfig) => void;
  onNavigateToColumn?: (columnName: string) => void;
  tableConfig: TableConfig;
}

export type DefaultColumnConfiguration = <T extends string = string>(
  tableName: T,
  columnName: string
) => Partial<ColumnDescriptor> | undefined;

export type DefaultTableConfiguration = (
  vuuTable?: VuuTable
) => Partial<Omit<TableConfig, "columns">> | undefined;

export type ResizePhase = "begin" | "resize" | "end";

export type TableColumnResizeHandler = (
  phase: ResizePhase,
  columnName: string,
  width?: number
) => void;

export interface BaseRowProps {
  className?: string;
  columns: RuntimeColumnDescriptor[];
  style?: CSSProperties;
  /**
   * In a virtualized row, the total width of leading columns not rendered (as
   * virtualization optimisation)
   */
  virtualColSpan?: number;
}

export interface RowProps extends BaseRowProps {
  classNameGenerator?: RowClassNameGenerator;
  columnMap: ColumnMap;
  highlighted?: boolean;
  row: DataSourceRow;
  offset: number;
  onClick?: TableRowClickHandlerInternal;
  onDataEdited?: DataCellEditHandler;
  onToggleGroup?: (row: DataSourceRow, column: RuntimeColumnDescriptor) => void;
  zebraStripes?: boolean;
}

export interface HeaderCellProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  classBase?: string;
  column: RuntimeColumnDescriptor;
  onClick?: (evt: React.MouseEvent | React.KeyboardEvent) => void;
  onResize?: TableColumnResizeHandler;
  showMenu?: boolean;
}

export type TableConfigChangeHandler = (config: TableConfig) => void;

export type CustomHeaderComponent = FC<BaseRowProps>;
export type CustomHeaderElement = ReactElement;
export type CustomHeader = CustomHeaderComponent | CustomHeaderElement;
