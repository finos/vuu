import { DataRow, metadataKeys } from "@finos/vuu-utils";
import { VuuGroupBy } from "../../../vuu-protocol-types";
import { SortType } from "../constants";
import { ColumnDescriptor } from "../gridTypes";
import { KeyedColumnDescriptor } from "./gridModelTypes";

// 15px works on Mac, Windows requires 17, unless we style the scrollbars
export const getHorizontalScrollbarHeight = (columnGroups) =>
  columnGroups
    ? columnGroups.some(({ width, contentWidth }) => width < contentWidth)
      ? 17
      : 0
    : 0;

export function getColumnGroup({ columnGroups }, target) {
  if (typeof target === "number") {
    // this can be simplified, dom\t need to iterate columns
    const lastGroup = columnGroups.length - 1;
    for (let i = 0, idx = 0; i <= lastGroup; i++) {
      const columnGroup = columnGroups[i];
      const columnCount = columnGroup.columns.length;
      for (let j = 0; j < columnCount; j++, idx++) {
        if (target === idx) {
          return columnGroup;
        } else if (
          i === lastGroup &&
          target === idx + 1 &&
          j === columnCount - 1
        ) {
          return columnGroup;
        }
      }
    }
  } else {
    for (let columnGroup of columnGroups) {
      if (columnGroup.columns.some(({ key }) => key === target.key)) {
        return columnGroup;
      }
    }
  }
  return null;
}

export function getColumnGroupIdx({ columnGroups }, column) {
  for (let i = 0; i < columnGroups.length; i++) {
    if (columnGroups[i].columns.some(({ key }) => key === column.key)) {
      return i;
    }
  }
  return -1;
}

export function moveColumn(columnGroup, column, targetColumn) {
  const col = columnGroup.columns.find((c) => c.key === column.key);
  const idx = columnGroup.columns.findIndex((c) => c.key === targetColumn.key);
  const columns = columnGroup.columns.filter((c) => c !== col);
  columns.splice(idx, 0, col);
  return { ...columnGroup, columns };
}

export const Column = {
  /** @type {(column: Column, columnGroup: ColumnGroup) => Column} */
  clone: (column, { locked }) => {
    return { ...column, locked };
  },
};

export const ColumnGroup = {
  insertColumnAt: (columnGroup, column, idx) => {
    const columns = columnGroup.columns.slice();
    columns.splice(idx, 0, Column.clone(column, columnGroup));
    return columns;
  },
  moveColumnTo: (columnGroup, column, idx) => {
    const sourceIdx = columnGroup.columns.findIndex(
      (col) => col.key === column.key
    );
    const columns = columnGroup.columns.slice();
    if (sourceIdx < idx) {
      columns.splice(idx, 0, column);
      columns.splice(sourceIdx, 1);
    } else {
      columns.splice(sourceIdx, 1);
      columns.splice(idx, 0, column);
    }
    return columns;
  },
};

export const measureColumns = (gridModel, left) => {
  let position = left;
  const lastGroup = gridModel.columnGroups.length - 1;
  return gridModel.columnGroups.map((columnGroup, groupIdx) =>
    columnGroup.columns.reduce((sizes, column, i, columns) => {
      sizes.push(position);
      position += column.width;
      if (groupIdx === lastGroup && i === columns.length - 1) {
        sizes.push(position);
      }
      return sizes;
    }, [])
  );
};

export const getColumnGroupColumnIdx = ({ columnGroups }, idx) => {
  let relativeIdx = idx;
  const lastGroup = columnGroups.length - 1;
  for (let i = 0; i <= lastGroup; i++) {
    const { columns } = columnGroups[i];
    if (relativeIdx < columns.length) {
      break;
    } else if (i === lastGroup && relativeIdx === columns.length) {
      break;
    }
    relativeIdx -= columns.length;
  }
  return relativeIdx;
};

/** @type {(gridModel: GridModel, columnGroupIdx: number) => number} */
export const getColumnGroupOffset = ({ columnGroups }, columnGroupIdx) => {
  let offset = 0;
  for (let i = 0; i < columnGroupIdx; i++) {
    offset += columnGroups[i].width;
  }
  return offset;
};

/** @type {(gridModel: GridModel, columnGroupIdx: number, columnIdx: number) => number} */
export const getColumnOffset = (gridModel, columnGroupIdx, columnIdx) => {
  let offset = getColumnGroupOffset(gridModel, columnGroupIdx);
  const cols = gridModel.columnGroups[columnGroupIdx].columns;
  for (let i = 0; i < columnIdx; i++) {
    offset += cols[i].width;
  }
  return offset;
};

function updateGroupColumnWidth(state, column, width) {
  if (state.columnSizing === "fill") {
    return updateGroupFillColumnWidth(state, column, width);
  }

  const [columnGroups, groupIdx] = GridModel.updateGroupColumn(state, column, {
    width,
  });
  const updatedGroup = columnGroups[groupIdx];
  updateColumnHeading(updatedGroup);
  const widthAdjustment = width - column.width;

  // why isn't this done already ?
  updatedGroup.contentWidth += widthAdjustment;

  if (updatedGroup.locked) {
    updatedGroup.width += widthAdjustment;
    for (let i = groupIdx + 1; i < columnGroups.length; i++) {
      const { locked, width } = columnGroups[i];
      columnGroups[i] = {
        ...columnGroups[i],
        width: locked ? width : width - widthAdjustment,
      };
    }
  }
  return columnGroups;
}

/**
 * Column Sizing  mode === 'fill'
 * if we are resizing a fill column and there are other fill columns to our right
 *    1) adjust the width of these fill columns according to their flex values
 *    2) adjust the flex of resized column, distribute diff to the flex columns to right
 * if we are resizing and there are other fill columns, but none to our right
 *    1) adjust the width of all other fill columns according to their flex values
 *    2) adjust the flex of resized column, distribute diff to the other flex columns
 * if we are resizing a non-flex column
 *    1) adjust the width of all other fill columns according to their flex values
 * if we try to adjust teh width of a flex column and it is the only flex column
 *    disallow the resize
 */
function updateGroupFillColumnWidth(state, column, width) {
  const columns = state.columnGroups.flatMap(
    (columnGroup) => columnGroup.columns
  );
  // const columns = GridModel.columns(state);
  const { length: noFlexCount } = columns.filter((c) => c.flex === undefined);
  const noFlexValues = noFlexCount === columns.length;
  const widthDiff = column.width - width;
  const affectedColumns = [];
  for (let i = columns.length - 1; i >= 0; i--) {
    const { flex, name } = columns[i];
    if (name === column.name) {
      affectedColumns.unshift(columns[i]);
      if ((affectedColumns.length > 1 && column.flex !== 0) || noFlexValues) {
        break;
      }
    } else if (flex !== 0 || noFlexValues) {
      affectedColumns.unshift(columns[i]);
    }
  }
  // Lets ignore flex for now, just apply widthDiff equally across all affected columns
  const widthDiffsPerColumn = widthDiff / (affectedColumns.length - 1);
  const resizedColumns = affectedColumns.map((affectedColumn) => {
    if (affectedColumn.name === column.name) {
      return {
        ...affectedColumn,
        width,
      };
    } else {
      return {
        ...affectedColumn,
        width: affectedColumn.width + widthDiffsPerColumn,
      };
    }
  });

  const applyChanges = (columnGroup) => {
    let nextAffectedColumn = affectedColumns.shift();
    if (columnGroup.columns.includes(nextAffectedColumn)) {
      return {
        // Do we assume resizing does not affect columns ACROSS columnGroips ?
        // If not, we have to recompute columnGroup Width here
        ...columnGroup,
        columns: columnGroup.columns.map((col) => {
          if (col === nextAffectedColumn) {
            nextAffectedColumn = affectedColumns.shift();
            return resizedColumns.shift();
          } else {
            return col;
          }
        }),
      };
    } else {
      return columnGroup;
    }
  };

  return state.columnGroups.map(applyChanges);
}

function updateColumnHeading(group) {
  if (group.headings) {
    const columns = group.columns;
    group.headings = group.headings.map((heading) =>
      heading.map((colHeading) => {
        const indices = columnKeysToIndices(splitKeys(colHeading.key), columns);
        const colWidth = indices.reduce(
          (sum, idx) => sum + columns[idx].width,
          0
        );
        return colWidth === colHeading.width
          ? colHeading
          : { ...colHeading, width: colWidth };
      })
    );
  }
}

function updateGroupColumn({ columnGroups: groups }, column, updates) {
  const { groupIdx: idx, groupColIdx: colIdx } = getColumnPosition(
    groups,
    column
  );
  const { columns, ...rest } = groups[idx];
  const updatedGroups = groups.map((group, i) =>
    i === idx
      ? {
          ...rest,
          columns: columns.map((col, i) =>
            i === colIdx ? { ...col, ...updates } : col
          ),
        }
      : group
  );
  return [updatedGroups, idx];
}

export const columnKeysToIndices = (
  keys: string[],
  columns: ColumnDescriptor[]
) => keys.map((key) => columns.findIndex((c) => c.key === key));

function addGroupColumn({ groupBy }, column) {
  if (groupBy) {
    return groupBy.concat(column.name);
  } else {
    return [column.name];
  }
}

function addSortColumn(
  { sort },
  { name: columnName },
  sortType = SortType.ASC
) {
  const sortEntry = { column: columnName, sortType };
  if (sort) {
    return sort.concat(sortEntry);
  } else {
    return [sortEntry];
  }
}

// Apply the supplied sortType to the column in sort
function setSortColumn({ sort }, { name: column }, sortType) {
  if (sortType === undefined) {
    const columnSort = sort?.find((item) => item.column === column);
    if (columnSort) {
      return [
        {
          column,
          sortType:
            columnSort.sortType === SortType.ASC ? SortType.DSC : SortType.ASC,
        },
      ];
    }
  }
  return [{ column, sortType: sortType ?? SortType.ASC }];
}

function removeGroupColumn({ groupBy }, column) {
  if (!groupBy) {
    throw Error(
      `GridModel.removeColumnGroups: cannot remove column ${column.name}, no grouping in place`
    );
  } else if (groupBy.length === 1) {
    return undefined;
  } else {
    return groupBy.filter((columnName) => columnName !== column.name);
  }
}

const omitSystemColumns = (column) => !column.isSystemColumn;

const addColumnToColumns = (column, columns, index) => {
  const currentIndex = columns.findIndex((col) => col.name === column.name);
  if (currentIndex === index) {
    return columns;
  } else {
    let newColumns =
      currentIndex !== -1
        ? columns.filter((_, i) => i !== currentIndex)
        : columns.slice();
    newColumns.splice(index, 0, column);
    return newColumns;
  }
};

const countLeadingSystemColumns = (columns) => {
  let count = 0;
  for (let i = 0; i < columns.length; i++) {
    if (!columns[i].isSystemColumn) {
      break;
    } else {
      count += 1;
    }
  }
  return count;
};

const setAggregation = ({ aggregations }, column, aggType) => {
  return aggregations
    .filter((agg) => agg.column !== column.name)
    .concat({ column: column.name, aggType });
};

export const GridModel = {
  addColumnToColumns,
  addGroupColumn,
  addSortColumn,
  countLeadingSystemColumns,
  columns: (gridModel) =>
    flattenColumnGroup(
      gridModel.columnGroups.flatMap((columnGroup) =>
        columnGroup.columns.filter(omitSystemColumns)
      )
    ),
  columnNames: (gridModel) =>
    GridModel.columns(gridModel).map((column) => column.name),
  removeGroupColumn,
  setAggregation,
  setSortColumn,
  updateGroupColumn,
  updateGroupColumnWidth,
};

function getColumnPosition(groups, column) {
  for (let i = 0; i < groups.length; i++) {
    const idx = groups[i].columns.findIndex((c) => c.key === column.key);
    if (idx !== -1) {
      return { groupIdx: i, groupColIdx: idx };
    }
  }
  return { groupIdx: -1, groupColIdx: -1 };
}

export function expandStatesfromGroupState({ columns }, groupState) {
  const results = Array(columns.length).fill(-1);
  let all = groupState && groupState["*"];
  let idx = 0;
  while (all) {
    results[idx] = 1;
    all = all["*"];
  }
  return results;
}

const flattenColumnGroup = (columns) => {
  if (columns.length === 0 || !columns[0].isGroup) {
    return columns;
  }

  const [groupColumn, ...nonGroupColumns] = columns;
  // traverse the group columns in reverse, but do not reverse (mutate) the original array
  for (let i = groupColumn.columns.length - 1; i >= 0; i--) {
    const column = groupColumn.columns[i];
    const { originalIdx, ...nonGroupedColumn } = column;
    nonGroupColumns.splice(originalIdx, 0, nonGroupedColumn);
  }

  return nonGroupColumns;
};

export function extractGroupColumn(
  columns: ColumnDescriptor[],
  groupBy: VuuGroupBy
): [ColumnDescriptor | null, ColumnDescriptor[]] {
  if (groupBy && groupBy.length > 0) {
    // Note: groupedColumns will be in column order, not groupBy order
    const [groupedColumns, rest] = columns.reduce(
      (result, column, i) => {
        const [g, r] = result;
        // if (indexOfCol(column.name, groupBy) !== -1) {
        if (groupBy.includes(column.name)) {
          g.push({
            ...column,
            originalIdx: i,
          });
        } else {
          r.push(column);
        }

        return result;
      },
      [[], []]
    );
    if (groupedColumns.length !== groupBy.length) {
      throw Error(
        `extractGroupColumn: no column definition found for all groupBy cols ${JSON.stringify(
          groupBy
        )} `
      );
    }
    const groupCount = groupBy.length;
    const groupCols = groupBy.map((name, idx) => {
      // Keep the cols in same order defined on groupBy
      const column = groupedColumns.find((col) => col.name === name);
      return {
        ...column,
        groupLevel: groupCount - idx,
      };
    });

    const groupCol = {
      key: -1,
      name: "group-col",
      heading: ["group-col"],
      isGroup: true,
      columns: groupCols,
      width: groupCols.map((c) => c.width).reduce((a, b) => a + b) + 100,
    };

    return [groupCol, rest];
  }
  return [null, columns];
}

export const splitKeys = (compositeKey: string) =>
  `${compositeKey}`.split(":").map((k) => parseInt(k, 10));

const isKeyedColumn = (column: unknown): column is KeyedColumnDescriptor =>
  typeof (column as KeyedColumnDescriptor).key === "number";

export const assignKeysToColumns = (
  columns: (ColumnDescriptor | KeyedColumnDescriptor | string)[],
  defaultWidth?: number
): KeyedColumnDescriptor[] => {
  const start = metadataKeys.count;
  return columns.map((column, i) =>
    typeof column === "string"
      ? { name: column, key: start + i, width: defaultWidth }
      : isKeyedColumn(column)
      ? column
      : {
          ...column,
          key: start + i,
          width: column.width || defaultWidth,
        }
  );
};

const { DEPTH, IS_LEAF } = metadataKeys;

export const getGroupValueAndOffset = (
  columns: KeyedColumnDescriptor[],
  row: DataRow
) => {
  const { [DEPTH]: depth, [IS_LEAF]: isLeaf } = row;
  // Depth can be greater tha group columns when we have just removed a column from groupby
  // but new data has not yet been received.
  if (isLeaf || depth > columns.length) {
    return [null, null];
  } else if (depth === 0) {
    return ["$root", 0];
  } else {
    // offset 1 for now to allow for $root
    const column = columns[depth - 1];
    return [row[column.key], depth];
  }
};
