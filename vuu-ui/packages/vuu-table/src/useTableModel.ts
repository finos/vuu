import {
  ColumnDescriptor,
  ColumnLayout,
  PinLocation,
  ResizePhase,
  RuntimeColumnDescriptor,
  TableAttributes,
  TableConfig,
  TableHeadings,
  TableSelectionModel,
} from "@vuu-ui/vuu-table-types";
import {
  applyFilterToColumns,
  applyGroupByToColumns,
  applyRuntimeColumnWidthsToConfig,
  applySortToColumns,
  applyWidthToColumns,
  checkConfirmationPending,
  existingSort,
  flattenColumnGroup,
  getCellRenderer,
  getColumnHeaderContentRenderer,
  getColumnHeaderLabelRenderer,
  getColumnLabel,
  getTableHeadings,
  getValueFormatter,
  hasValidationRules,
  isFilteredColumn,
  isGroupColumn,
  isPinned,
  logger,
  removeSort,
  replaceColumn,
  sortPinnedColumns,
  stripFilterFromColumns,
  subscribedOnly,
} from "@vuu-ui/vuu-utils";

import {
  DataSource,
  TableSchema,
  WithBaseFilter,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import { VuuColumnDataType } from "@vuu-ui/vuu-protocol-types";
import { Reducer, useReducer } from "react";
import { buildValidationChecker } from "@vuu-ui/vuu-data-react";

const { info } = logger("useTableModel");

const DEFAULT_COLUMN_WIDTH = 100;

const columnWithoutDataType = ({ serverDataType }: ColumnDescriptor) =>
  serverDataType === undefined;

const getDataType = (
  column: ColumnDescriptor,
  tableSchema?: TableSchema,
): VuuColumnDataType | undefined => {
  const schemaColumn = tableSchema?.columns.find(
    ({ name }) => name === column.name,
  );
  if (schemaColumn) {
    return schemaColumn.serverDataType;
  } else {
    return column.serverDataType;
  }
};

const checkboxColumnDescriptor: ColumnDescriptor = {
  allowColumnHeaderMenu: false,
  label: "",
  name: "",
  width: 25,
  resizeable: false,
  sortable: false,
  isSystemColumn: true,
  type: {
    name: "checkbox",
    renderer: {
      name: "checkbox-row-selector-cell",
    },
  },
};

/**
 * TableModel represents state used internally to manage Table. It is
 * derived initially from the TableConfig provided by user, along with the
 * data-related config from DataSource.
 */
export interface TableModel extends TableAttributes {
  columns: RuntimeColumnDescriptor[];
  headings: TableHeadings;
}

/**
 * InternalTableModel describes the state managed within the TableModel
 * reducer. It is the same as TableModel but with the addition of a
 * readonly copy of the original TableConfig.
 */
interface InternalTableModel extends TableModel {
  availableWidth: number;
  tableConfig: Readonly<TableConfig>;
}

const numericTypes = ["int", "long", "double"];
const getDefaultAlignment = (serverDataType?: VuuColumnDataType) =>
  serverDataType === undefined
    ? undefined
    : numericTypes.includes(serverDataType)
      ? "right"
      : "left";

export interface ColumnActionInit {
  availableWidth: number;
  selectionModel?: TableSelectionModel;
  type: "init";
  tableConfig: TableConfig;
  dataSource: DataSource;
}

export interface ColumnActionHide {
  type: "hideColumns";
  columns: ColumnDescriptor[];
}
export interface ColumnActionRemove {
  type: "removeColumn";
  column: ColumnDescriptor;
}

export interface ColumnActionShow {
  type: "showColumns";
  columns: RuntimeColumnDescriptor[];
}
export interface ColumnActionMove {
  type: "moveColumn";
  column: RuntimeColumnDescriptor;
  moveBy?: 1 | -1;
}

export interface ColumnActionPin {
  type: "pinColumn";
  column: ColumnDescriptor;
  pin: PinLocation | false;
}

export interface ColumnActionResize {
  type: "resizeColumn";
  column: RuntimeColumnDescriptor;
  phase: ResizePhase;
  width?: number;
}

export interface ColumnActionSetTableSchema {
  type: "setTableSchema";
  tableSchema: TableSchema;
}

export interface ColumnActionUpdate {
  type: "updateColumn";
  column: ColumnDescriptor;
}

export interface ColumnActionUpdateProp {
  align?: ColumnDescriptor["align"];
  column: ColumnDescriptor;
  hidden?: ColumnDescriptor["hidden"];
  label?: ColumnDescriptor["label"];
  resizing?: RuntimeColumnDescriptor["resizing"];
  type: "updateColumnProp";
  width?: ColumnDescriptor["width"];
}

export interface ColumnActionTableConfig
  extends WithBaseFilter<WithFullConfig> {
  confirmed?: boolean;
  type: "tableConfig";
}

export type TableModelAction =
  | ColumnActionHide
  | ColumnActionInit
  | ColumnActionMove
  | ColumnActionPin
  | ColumnActionResize
  | ColumnActionSetTableSchema
  | ColumnActionShow
  | ColumnActionUpdate
  | ColumnActionUpdateProp
  | ColumnActionTableConfig;

type TableModelReducer = Reducer<InternalTableModel, TableModelAction>;

export type TableModelActionDispatch = (action: TableModelAction) => void;

const tableModelReducer: TableModelReducer = (state, action) => {
  info?.(`TableModelReducer ${action.type}`);
  switch (action.type) {
    case "init": {
      if (
        state.tableConfig.columnLayout === "manual" &&
        action.tableConfig.columnLayout === "fit"
      ) {
        //TODO we're jumping through hoops here when we should just make config a controlled prop

        // Manual columnLayout has been assigned because user has resized one or more columns.
        // It happened during current session so tableConfig still reflects original value.
        return init({
          ...action,
          tableConfig: applyRuntimeColumnWidthsToConfig(
            action.tableConfig,
            state.columns,
          ),
        });
      } else {
        return init(action, state);
      }
    }
    case "moveColumn":
      return moveColumn(state, action);
    case "resizeColumn":
      return resizeColumn(state, action);
    case "setTableSchema":
      return setTableSchema(state, action);
    case "hideColumns":
      return hideColumns(state, action);
    case "showColumns":
      return showColumns(state, action);
    case "pinColumn":
      return pinColumn(state, action);
    case "updateColumnProp":
      return updateColumnProp(state, action);
    case "tableConfig":
      return updateTableConfig(state, action);
    default:
      console.log(`unhandled action ${action.type}`);
      return state;
  }
};

export interface TableModelHookProps {
  config: TableConfig;
  dataSource: DataSource;
  selectionModel: TableSelectionModel;
  availableWidth: number;
}

export const useTableModel = ({
  config: tableConfigProp,
  dataSource,
  selectionModel,
  availableWidth,
}: TableModelHookProps) => {
  const [state, dispatchTableModelAction] = useReducer(
    tableModelReducer,
    {
      availableWidth,
      tableConfig: tableConfigProp,
      dataSource,
      selectionModel,
    },
    init,
  );

  const { columns, headings, tableConfig, ...tableAttributes } = state;

  return {
    columns,
    dispatchTableModelAction,
    headings,
    tableAttributes,
    tableConfig,
  };
};

type InitialConfig = {
  availableWidth: number;
  columnLayout?: ColumnLayout;
  dataSource: DataSource;
  selectionModel?: TableSelectionModel;
  tableConfig: TableConfig;
};

function init(
  { availableWidth, dataSource, selectionModel, tableConfig }: InitialConfig,
  previousConfig?: InternalTableModel,
): InternalTableModel {
  const { columns, ...tableAttributes } = tableConfig;
  const { config: dataSourceConfig, tableSchema } = dataSource;
  const toRuntimeColumnDescriptor = columnDescriptorToRuntimeColumDescriptor(
    tableAttributes,
    tableSchema,
  );

  const runtimeColumns: RuntimeColumnDescriptor[] = [];
  let colIndex = 1;
  for (const column of columns.filter(
    subscribedOnly(dataSourceConfig?.columns),
  )) {
    runtimeColumns.push(
      toRuntimeColumnDescriptor(column, column.hidden ? -1 : colIndex),
    );
    if (!column.hidden) {
      colIndex += 1;
    }
  }

  if (selectionModel === "checkbox") {
    runtimeColumns.splice(
      0,
      0,
      toRuntimeColumnDescriptor(checkboxColumnDescriptor, -1),
    );
  }

  const { columnLayout = "static" } = tableConfig;
  const runtimeColumnsWithLayout = applyWidthToColumns(runtimeColumns, {
    availableWidth,
    columnLayout,
  });

  const columnsInRenderOrder = runtimeColumnsWithLayout.some(isPinned)
    ? sortPinnedColumns(runtimeColumnsWithLayout)
    : runtimeColumnsWithLayout;

  let state: InternalTableModel = {
    availableWidth,
    columns: columnsInRenderOrder,
    headings: getTableHeadings(columnsInRenderOrder),
    tableConfig,
    ...tableAttributes,
  };
  if (dataSourceConfig) {
    const { columns: _, ...rest } = dataSourceConfig;
    state = updateTableConfig(state, {
      type: "tableConfig",
      ...rest,
      confirmed: checkConfirmationPending(previousConfig),
    });
  }
  return state;
}

const getLabel = (
  label: string,
  columnFormatHeader?: "uppercase" | "capitalize",
): string => {
  if (columnFormatHeader === "uppercase") {
    return label.toUpperCase();
  } else if (columnFormatHeader === "capitalize") {
    return label[0].toUpperCase() + label.slice(1).toLowerCase();
  }
  return label;
};

const columnDescriptorToRuntimeColumDescriptor =
  (tableAttributes: TableAttributes, tableSchema?: TableSchema) =>
  (column: ColumnDescriptor, ariaColIndex: number): RuntimeColumnDescriptor => {
    const { columnDefaultWidth = DEFAULT_COLUMN_WIDTH, columnFormatHeader } =
      tableAttributes;
    const serverDataType = getDataType(column, tableSchema);
    const {
      align = getDefaultAlignment(serverDataType),
      name,
      label = getColumnLabel(column),
      source = "server",
      width = columnDefaultWidth,
      ...rest
    } = column;

    const runtimeColumnWithDefaults: RuntimeColumnDescriptor = {
      ...rest,
      align,
      ariaColIndex,
      CellRenderer: getCellRenderer(column),
      HeaderCellContentRenderer: getColumnHeaderContentRenderer(column),
      HeaderCellLabelRenderer: getColumnHeaderLabelRenderer(column),
      clientSideEditValidationCheck: hasValidationRules(column.type)
        ? buildValidationChecker(column.type.rules)
        : undefined,
      label: getLabel(label, columnFormatHeader),
      name,
      originalIdx: ariaColIndex,
      serverDataType,
      source,
      valueFormatter: getValueFormatter(column, serverDataType),
      width,
    };

    if (isGroupColumn(runtimeColumnWithDefaults)) {
      runtimeColumnWithDefaults.columns = runtimeColumnWithDefaults.columns.map(
        (col) =>
          columnDescriptorToRuntimeColumDescriptor(tableAttributes)(col, -1),
      );
    }

    return runtimeColumnWithDefaults;
  };

function moveColumn(
  state: InternalTableModel,
  // TODO do we ever use this ?
  { column, moveBy }: ColumnActionMove,
) {
  const { columns } = state;
  if (typeof moveBy === "number") {
    const idx = columns.indexOf(column);
    const newColumns = columns.slice();
    const [movedColumns] = newColumns.splice(idx, 1);
    newColumns.splice(idx + moveBy, 0, movedColumns);
    return {
      ...state,
      columns: newColumns,
    };
  }
  return state;
}

function hideColumns(state: InternalTableModel, { columns }: ColumnActionHide) {
  if (columns.some((col) => col.hidden !== true)) {
    return columns.reduce<InternalTableModel>((s, c) => {
      if (c.hidden !== true) {
        return updateColumnProp(s, {
          type: "updateColumnProp",
          column: c,
          hidden: true,
        });
      } else {
        return s;
      }
    }, state);
  } else {
    return state;
  }
}
function showColumns(state: InternalTableModel, { columns }: ColumnActionShow) {
  if (columns.some((col) => col.hidden)) {
    return columns.reduce<InternalTableModel>((s, c) => {
      if (c.hidden) {
        return updateColumnProp(s, {
          type: "updateColumnProp",
          column: c,
          hidden: false,
        });
      } else {
        return s;
      }
    }, state);
  } else {
    return state;
  }
}

function resizeColumn(
  state: InternalTableModel,
  { column, phase, width }: ColumnActionResize,
) {
  const type = "updateColumnProp";
  const resizing = phase !== "end";
  switch (phase) {
    case "begin":
      return updateColumnProp(state, { type, column, resizing });
    case "end": {
      const { tableConfig } = state;
      const isFit = tableConfig.columnLayout === "fit";
      const newState: InternalTableModel = isFit
        ? {
            ...state,
            tableConfig: applyRuntimeColumnWidthsToConfig(
              tableConfig,
              state.columns,
            ),
          }
        : state;
      return updateColumnProp(newState, { type, column, resizing, width });
    }
    case "resize":
      return updateColumnProp(state, { type, column, width });
    default:
      throw Error(`useTableModel.resizeColumn, invalid resizePhase ${phase}`);
  }
}

function setTableSchema(
  state: InternalTableModel,
  { tableSchema }: ColumnActionSetTableSchema,
) {
  const { columns } = state;
  if (columns.some(columnWithoutDataType)) {
    const cols = columns.map((column) => {
      const serverDataType = getDataType(column, tableSchema);
      return {
        ...column,
        align: column.align ?? getDefaultAlignment(serverDataType),
        serverDataType,
      };
    });

    return {
      ...state,
      columns: cols,
    };
  } else {
    return state;
  }
}

function pinColumn(state: InternalTableModel, action: ColumnActionPin) {
  let { columns } = state;
  const { column, pin } = action;
  const targetColumn = columns.find((col) => col.name === column.name);
  if (targetColumn) {
    columns = replaceColumn(columns, { ...targetColumn, pin });
    columns = sortPinnedColumns(columns);
    return {
      ...state,
      columns,
    };
  } else {
    return state;
  }
}
function updateColumnProp(
  state: InternalTableModel,
  action: ColumnActionUpdateProp,
) {
  let { columns, tableConfig } = state;
  const { align, column, hidden, label, resizing, width } = action;
  const targetColumn = columns.find((col) => col.name === column.name);
  if (targetColumn) {
    if (align === "left" || align === "right") {
      columns = replaceColumn(columns, { ...targetColumn, align });
    }
    if (typeof label === "string") {
      columns = replaceColumn(columns, { ...targetColumn, label });
    }
    if (typeof resizing === "boolean") {
      columns = replaceColumn(columns, { ...targetColumn, resizing });
    }
    if (typeof hidden === "boolean") {
      columns = replaceColumn(columns, { ...targetColumn, hidden });
    }
    if (typeof width === "number") {
      columns = replaceColumn(columns, { ...targetColumn, width });

      const targetConfigColumn = tableConfig.columns.find(
        (col) => col.name === column.name,
      );
      if (targetConfigColumn) {
        tableConfig = {
          ...tableConfig,
          columns: replaceColumn<ColumnDescriptor>(tableConfig.columns, {
            ...targetConfigColumn,
            width,
          }),
        };
      }
    }
  }
  return {
    ...state,
    columns,
    tableConfig,
  } as InternalTableModel;
}

// TODO rename to make clear its dataSOurce config
function updateTableConfig(
  state: InternalTableModel,
  {
    confirmed,
    filterSpec,
    groupBy,
    sort,
  }: Omit<ColumnActionTableConfig, "columns">,
) {
  let result = state;

  const { availableWidth, columnLayout = "static" } = state;

  if (groupBy.length > 0) {
    const groupedColumns = applyGroupByToColumns({
      columns: result.columns,
      groupBy,
      confirmed,
      availableWidth,
    });
    const columns = applyWidthToColumns(groupedColumns, {
      availableWidth,
      columnLayout,
    });

    result = {
      ...state,
      columns,
    };
  } else if (
    result.columns.length > 0 &&
    isGroupColumn(result.columns[0]) &&
    confirmed
  ) {
    result = {
      ...state,
      columns: flattenColumnGroup(result.columns),
    };
  }

  if (sort.sortDefs.length > 0) {
    result = {
      ...state,
      columns: applySortToColumns(result.columns, sort),
    };
  } else if (existingSort(result.columns)) {
    result = {
      ...state,
      columns: removeSort(result.columns),
    };
  }

  if (filterSpec.filter.length > 0) {
    result = {
      ...state,
      columns: applyFilterToColumns(result.columns, filterSpec),
    };
  } else if (result.columns.some(isFilteredColumn)) {
    result = {
      ...state,
      columns: stripFilterFromColumns(result.columns),
    };
  }

  return result;
}
