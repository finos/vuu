import {
  ColumnDescriptor,
  GridConfig,
  KeyedColumnDescriptor,
  PinLocation,
} from "@finos/vuu-datagrid-types";
import { moveItem } from "@heswell/salt-lab";
import {
  extractGroupColumn,
  flattenColumnGroup,
  isPinned,
  metadataKeys,
  sortPinnedColumns,
} from "@finos/vuu-utils";

// TOSO eliminate this dependency
import { extractFilterForColumn } from "@finos/vuu-filters";

import { Reducer, useReducer } from "react";
import {
  VuuColumnDataType,
  VuuGroupBy,
  VuuSort,
} from "@finos/vuu-protocol-types";
import { DataSourceFilter } from "@finos/vuu-data";

const DEFAULT_COLUMN_WIDTH = 100;
const KEY_OFFSET = metadataKeys.count;

const columnWithoutDataType = ({ serverDataType }: ColumnDescriptor) =>
  serverDataType === undefined;

const getDataType = (
  column: ColumnDescriptor,
  columnNames: string[],
  dataTypes: VuuColumnDataType[]
): VuuColumnDataType => {
  const index = columnNames.indexOf(column.name);
  if (index !== -1 && dataTypes[index]) {
    return dataTypes[index];
  } else {
    return column.serverDataType ?? "string";
  }
};

export interface GridModel extends Omit<GridConfig, "columns"> {
  columns: KeyedColumnDescriptor[];
}

const numericTypes = ["int", "long", "double"];
const getDefaultAlignment = (serverDataType?: VuuColumnDataType) =>
  serverDataType === undefined
    ? undefined
    : numericTypes.includes(serverDataType)
    ? "right"
    : "left";

export interface ColumnActionInit {
  type: "init";
  config: GridConfig;
}

export interface ColumnActionMove {
  type: "moveColumn";
  column: KeyedColumnDescriptor;
  moveBy?: 1 | -1;
  moveTo?: number;
}
export interface ColumnActionResize {
  type: "resizeColumn";
  column: KeyedColumnDescriptor;
  phase: "begin" | "resize" | "end";
  width?: number;
}

export interface ColumnActionSetTypes {
  type: "setTypes";
  columnNames: string[];
  serverDataTypes: VuuColumnDataType[];
}

export interface ColumnActionUpdate {
  type: "updateColumn";
  column: ColumnDescriptor;
}
export interface ColumnActionUpdateProp {
  align?: ColumnDescriptor["align"];
  column: KeyedColumnDescriptor;
  label?: ColumnDescriptor["label"];
  pin?: PinLocation;
  resizing?: KeyedColumnDescriptor["resizing"];
  type: "updateColumnProp";
  width?: ColumnDescriptor["width"];
}

export interface ColumnActionTableConfig {
  type: "tableConfig";
  filter?: DataSourceFilter;
  groupBy?: VuuGroupBy;
  sort?: VuuSort;
}

export type GridModelAction =
  | ColumnActionInit
  | ColumnActionMove
  | ColumnActionResize
  | ColumnActionSetTypes
  | ColumnActionUpdate
  | ColumnActionUpdateProp
  | ColumnActionTableConfig;

export type GridModelReducer = Reducer<GridModel, GridModelAction>;

export type ColumnActionDispatch = (action: GridModelAction) => void;

const columnReducer: GridModelReducer = (state, action) => {
  switch (action.type) {
    case "init":
      return init(action.config);
    case "moveColumn":
      return moveColumn(state, action);
    case "resizeColumn":
      return resizeColumn(state, action);
    case "setTypes":
      return setTypes(state, action);
    case "updateColumnProp":
      return updateColumnProp(state, action);
    case "tableConfig":
      return updateTableConfig(state, action);
    default:
      console.log(`unhandled action ${action.type}`);
      return state;
  }
};

export const useTableModel = (config: GridConfig) => {
  const [state, dispatchColumnAction] = useReducer<
    GridModelReducer,
    GridConfig
  >(columnReducer, config, init);
  return {
    columns: state.columns,
    dispatchColumnAction,
  };
};

function init(config: GridConfig): GridModel {
  //TODO needs to accommodate grouping
  const columns = config.columns.map(toKeyedColumWithDefaults);
  if (columns.some(isPinned)) {
    return {
      columns: sortPinnedColumns(columns),
    };
  } else {
    return {
      columns: config.columns.map(toKeyedColumWithDefaults),
    };
  }
}

const toKeyedColumWithDefaults = (
  column: ColumnDescriptor,
  index: number
): KeyedColumnDescriptor => {
  const {
    align = getDefaultAlignment(column.serverDataType),
    name,
    label = name,
    width = DEFAULT_COLUMN_WIDTH,
    ...rest
  } = column;
  return {
    ...rest,
    align,
    label,
    key: index + KEY_OFFSET,
    name,
    originalIdx: index,
    width,
  };
};

function moveColumn(
  state: GridModel,
  { column, moveBy, moveTo }: ColumnActionMove
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
  } else if (typeof moveTo === "number") {
    const index = columns.indexOf(column);
    return {
      ...state,
      columns: moveItem(columns, index, moveTo),
    };
  }
  return state;
}

function resizeColumn(
  state: GridModel,
  { column, phase, width }: ColumnActionResize
) {
  const type = "updateColumnProp";
  const resizing = phase !== "end";

  switch (phase) {
    case "begin":
    case "end":
      return updateColumnProp(state, { type, column, resizing });
    case "resize":
      return updateColumnProp(state, { type, column, width });
    default:
      throw Error(`useTableModel.resizeColumn, invalid resizePhase ${phase}`);
  }
}

function setTypes(
  state: GridModel,
  { columnNames, serverDataTypes }: ColumnActionSetTypes
) {
  console.log(`setTypes, existing columns`, {
    state,
  });
  const { columns } = state;
  if (columns.some(columnWithoutDataType)) {
    const cols = columns.map((column) => {
      const serverDataType = getDataType(column, columnNames, serverDataTypes);
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

function updateColumnProp(state: GridModel, action: ColumnActionUpdateProp) {
  let { columns } = state;
  const { align, column, label, pin, resizing, width } = action;
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
    if (typeof width === "number") {
      columns = replaceColumn(columns, { ...targetColumn, width });
    }
    if ("pin" in action) {
      columns = replaceColumn(columns, { ...targetColumn, pin });
      columns = sortPinnedColumns(columns);
    }
  }
  return {
    ...state,
    columns,
  };
}

function updateTableConfig(
  state: GridModel,
  { filter, groupBy, sort }: ColumnActionTableConfig
) {
  const hasGroupBy = groupBy !== undefined;
  const hasFilter = typeof filter?.filter === "string";
  const hasSort = sort && sort.sortDefs.length > 0;

  let result = state;

  if (hasGroupBy) {
    result = {
      ...state,
      columns: applyGroupByToColumns(state.columns, groupBy),
    };
  }

  if (hasSort) {
    result = {
      ...state,
      columns: applySortToColumns(state.columns, sort),
    };
  }

  if (hasFilter) {
    result = {
      ...state,
      columns: applyFilterToColumns(state.columns, filter),
    };
  }

  return result;
}

function replaceColumn(
  state: KeyedColumnDescriptor[],
  column: KeyedColumnDescriptor
) {
  return state.map((col) => (col.name === column.name ? column : col));
}

//TOSDO move these functions to utils
const applyGroupByToColumns = (
  columns: KeyedColumnDescriptor[],
  groupBy: VuuGroupBy
) => {
  if (groupBy.length) {
    const [groupColumn, nonGroupedColumns] = extractGroupColumn(
      columns,
      groupBy
    );
    if (groupColumn) {
      return [groupColumn as KeyedColumnDescriptor].concat(nonGroupedColumns);
    }
  } else if (columns[0]?.isGroup) {
    return flattenColumnGroup(columns);
  }
  return columns;
};

const applySortToColumns = (colunms: KeyedColumnDescriptor[], sort: VuuSort) =>
  colunms.map((column) => {
    const sorted = getSortType(column, sort);
    if (sorted !== undefined) {
      return {
        ...column,
        sorted,
      };
    } else if (column.sorted) {
      return {
        ...column,
        sorted: undefined,
      };
    } else {
      return column;
    }
  });

const applyFilterToColumns = (
  columns: KeyedColumnDescriptor[],
  { filterStruct }: DataSourceFilter
) =>
  columns.map((column) => {
    // TODO this gives us a dependency on vuu-filters
    const filter = extractFilterForColumn(filterStruct, column.name);
    if (filter !== undefined) {
      return {
        ...column,
        filter,
      };
    } else if (column.filter) {
      return {
        ...column,
        filter: undefined,
      };
    } else {
      return column;
    }
  });

const getSortType = (column: ColumnDescriptor, { sortDefs }: VuuSort) => {
  const sortDef = sortDefs.find((sortCol) => sortCol.column === column.name);
  if (sortDef) {
    return sortDefs.length > 1
      ? (sortDefs.indexOf(sortDef) + 1) * (sortDef.sortType === "A" ? 1 : -1)
      : sortDef.sortType;
  }
};
