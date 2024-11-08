import type {
  DataSourceRow,
  DataSourceRowObject,
  DataValueDescriptor,
  DataValueTypeSimple,
  DataValueValidationChecker,
  EditValidationRule,
} from "@finos/vuu-data-types";
import type { Filter } from "@finos/vuu-filter-types";
import type {
  VuuAggType,
  VuuMenuItem,
  VuuRowDataItemType,
  VuuSortType,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { CellPos } from "@finos/vuu-table/src/table-dom-utils";
import type {
  ColumnMap,
  DateTimePattern,
  RowClassNameGenerator,
} from "@finos/vuu-utils";
import type {
  ComponentType,
  CSSProperties,
  FunctionComponent,
  FunctionComponentElement,
  HTMLAttributes,
  MouseEvent,
} from "react";

export declare type GroupToggleTarget = "toggle-icon" | "group-column";

export declare type TableSelectionModel =
  | "none"
  | "single"
  | "checkbox"
  | "extended";

export declare type TableHeading = { label: string; width: number };
export declare type TableHeadings = TableHeading[][];

export declare type ValueFormatter = (value: unknown) => string;

export interface EditEventState {
  editType?: EditType;
  isValid?: boolean;
  // value: unknown;
  previousValue?: VuuRowDataItemType;
  value: VuuRowDataItemType;
}

export interface DataCellEditEvent extends EditEventState {
  row: DataSourceRow;
  columnName: string;
}

export declare type DataCellEditNotification = (
  editEvent: DataCellEditEvent,
) => void;

export interface TableCellProps {
  className?: string;
  column: RuntimeColumnDescriptor;
  columnMap: ColumnMap;
  onClick?: (event: MouseEvent, column: RuntimeColumnDescriptor) => void;
  onDataEdited?: DataCellEditHandler;
  row: DataSourceRow;
}

export declare type CommitResponse = Promise<true | string>;

export declare type EditType = "commit" | "change" | "cancel";

declare type DataItemEditHandler<T extends EditType = EditType> = (
  editState: EditEventState,
  editPhase: T,
) => T extends "commit" ? Promise<string | true> : void;

export declare type TableRowSelectHandler = (
  row: DataSourceRowObject | null,
) => void;
export declare type TableRowSelectHandlerInternal = (
  row: DataSourceRow | null,
) => void;

/**
 * Fired when user clicks a row, returning the row object (DataSourceRowObject)
 */
export declare type TableRowClickHandler = (
  evt: MouseEvent<HTMLDivElement>,
  row: DataSourceRowObject,
) => void;

export declare type TableRowClickHandlerInternal = (
  evt: MouseEvent<HTMLDivElement>,
  row: DataSourceRow,
  rangeSelect: boolean,
  keepExistingSelection: boolean,
) => void;

export interface TableCellRendererProps
  extends Omit<TableCellProps, "onDataEdited"> {
  onEdit?: DataItemEditHandler;
}

/**
 * static layout simply respects widths specified on column descriptors.
 * fit layout attempts to fit columns to available space, either stretching
 * or squeezing. manual indicates that user has resized one or more columns,
 * on what was originally a fit layout. Once this happens, no further auto
 * fitting will take place. Fit layout always respects max and min widths,
 */
export declare type ColumnLayout = "static" | "fit" | "manual";

export interface TableAttributes {
  columnDefaultWidth?: number;
  columnFormatHeader?: "capitalize" | "uppercase";
  columnLayout?: ColumnLayout;
  columnSeparators?: boolean;
  // showHighlightedRow?: boolean;
  rowSeparators?: boolean;
  zebraStripes?: boolean;
}

export declare type TableMenuLocation = "grid" | "header" | "filter";

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

// TODO tidy up this definition, currently split beween here and data-types
export declare type DataValueTypeDescriptor = {
  rules?: EditValidationRule[];
  formatting?: ColumnTypeFormatting;
  name: DataValueTypeSimple;
  renderer?:
    | ColumnTypeRendering
    | LookupRenderer
    | MappedValueTypeRenderer
    | ValueListRenderer;
};

export declare type ColumnTypeFormatting = {
  alignOnDecimals?: boolean;
  decimals?: number;
  pattern?: DateTimePattern;
  zeroPad?: boolean;
};

export declare type ColumnTypeValueMap = { [key: string]: string };

export declare type ListOption = {
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
}
export interface MappedValueTypeRenderer {
  map: ColumnTypeValueMap;
}

export declare type LookupTableDetails = {
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

export declare type ColumnTypeDescriptorCustomRenderer = {
  formatting?: ColumnTypeFormatting;
  name: DataValueTypeSimple;
  renderer: ColumnTypeRendering;
};

export interface FormattingSettingsProps<
  T extends ColumnDescriptor = ColumnDescriptor,
> {
  column: T;
  onChangeFormatting: (formatting: ColumnTypeFormatting) => void;
  /** 
   Triggered by a change to the ColumnDescriptor column type, which is
   not the same as ServerDataType and allows for a refinement of the
   latter. e.g a server data type of long may be further refined as
   a date/time value using the column descriptor type.
   */
  onChangeColumnType: (type: DataValueTypeSimple) => void;
}

export interface ColumnTypeWithValidationRules
  extends Omit<DataValueTypeDescriptor, "editRules"> {
  rules: EditValidationRule[];
}

export declare type ColumnSort = VuuSortType | number;

export declare type PinLocation = "left" | "right" | "floating";

export declare type ColumnAlignment = "left" | "right";

/** This is a public description of a Column, defining all the
 * column attributes that can be defined by client. */
export interface ColumnDescriptor extends DataValueDescriptor {
  aggregate?: VuuAggType;
  align?: ColumnAlignment;
  className?: string;
  colHeaderContentRenderer?: string;
  colHeaderLabelRenderer?: string;
  flex?: number;
  /**
   * Only used when the column is included in a grouby clause.
   * The icon will be displayed alongside the group label
   */
  getIcon?: (row: DataSourceRow) => string | undefined;
  /**
   Optional additional level(s) of heading to display above label.
   May span multiple columns, if multiple adjacent columns declare
   same heading at same level.
  */
  heading?: string[];
  hidden?: boolean;
  isSystemColumn?: boolean;
  locked?: boolean;
  maxWidth?: number;
  minWidth?: number;
  pin?: PinLocation;
  resizeable?: boolean;
  sortable?: boolean;
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
  ariaColIndex: number;
  CellRenderer?: FunctionComponent<TableCellRendererProps>;
  HeaderCellLabelRenderer?: FunctionComponent<HeaderCellProps>;
  HeaderCellContentRenderer?: FunctionComponent<HeaderCellProps>;
  canStretch?: boolean;
  className?: string;
  clientSideEditValidationCheck?: DataValueValidationChecker;
  endPin?: true | undefined;
  filter?: Filter;
  flex?: number;
  heading?: [...string[]];
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
export declare type DataSourceAction =
  | GridActionCloseTreeNode
  | GridActionGroup
  | GridActionOpenTreeNode
  | GridActionSort;

export declare type ScrollAction =
  | GridActionScrollEndHorizontal
  | GridActionScrollStartHorizontal;

export declare type GridAction =
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

export declare type DefaultColumnConfiguration = <T extends string = string>(
  tableName: T,
  columnName: string,
) => Partial<ColumnDescriptor> | undefined;

export declare type DefaultTableConfiguration = (
  vuuTable?: VuuTable,
) => Partial<Omit<TableConfig, "columns">> | undefined;

export declare type ResizePhase = "begin" | "resize" | "end";

export declare type TableColumnResizeHandler = (
  phase: ResizePhase,
  columnName: string,
  width?: number,
) => void;

export interface BaseRowProps {
  ariaRole?: string;
  ariaRowIndex?: number;
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
  groupToggleTarget?: GroupToggleTarget;
  highlighted?: boolean;
  offset: number;
  onCellEdit?: CellEditHandler;
  onClick?: TableRowClickHandlerInternal;
  onDataEdited?: DataCellEditHandler;
  onToggleGroup?: (row: DataSourceRow, column: RuntimeColumnDescriptor) => void;
  row: DataSourceRow;
  showBookends?: boolean;
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

export declare type TableConfigChangeHandler = (config: TableConfig) => void;

export declare type CustomHeaderComponent = ComponentType<BaseRowProps>;
export declare type CustomHeaderElement =
  FunctionComponentElement<BaseRowProps>;
export declare type CustomHeader = CustomHeaderComponent | CustomHeaderElement;

/**
 * The row and column index positions of a table cell
 * [rowIndex, colIndex]
 */
export declare type CellPos = [number, number];
