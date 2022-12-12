import { DataRow, metadataKeys } from "@vuu-ui/vuu-utils";
import {
  AggType,
  VuuGroupBy,
  VuuSort,
  VuuSortCol,
} from "../../../vuu-protocol-types";
import {
  ColumnDescriptor,
  ColumnGroupType,
  GridModelType,
  GroupColumnDescriptor,
  Heading,
  KeyedColumnDescriptor,
} from "./gridModelTypes";

// 15px works on Mac, Windows requires 17, unless we style the scrollbars
export const getHorizontalScrollbarHeight = (
  columnGroups?: ColumnGroupType[]
) =>
  columnGroups
    ? columnGroups.some(({ width, contentWidth }) => width < contentWidth)
      ? 17
      : 0
    : 0;

export function getHeadingPosition(
  groups: ColumnGroupType[],
  headingName: string
) {
  for (let i = 0; i < groups.length; i++) {
    const { headings = null } = groups[i];
    for (let j = 0; headings && j < headings.length; j++) {
      const idx = headings[j].findIndex((h) => h.name === headingName);
      if (idx !== -1) {
        return { groupIdx: i, groupHeadingIdx: j, headingColIdx: idx };
      }
    }
  }
  return { groupIdx: -1, groupHeadingIdx: -1, headingColIdx: -1 };
}

export const getColumnHeading = (
  columnGroups: ColumnGroupType[],
  headingName: string
): Heading => {
  const { groupIdx, groupHeadingIdx, headingColIdx } = getHeadingPosition(
    columnGroups,
    headingName
  );

  const heading =
    columnGroups[groupIdx].headings?.[groupHeadingIdx][headingColIdx];
  if (!heading) {
    throw Error("GridModelReducer updateGroupHeadings heading not found");
  }

  return heading;
};

export function getColumnGroup(
  { columnGroups }: GridModelType,
  target: number | KeyedColumnDescriptor
) {
  const isNumber = typeof target === "number";
  if (isNumber && columnGroups) {
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
  } else if (!isNumber && columnGroups) {
    for (const columnGroup of columnGroups) {
      if (columnGroup.columns.some(({ key }) => key === target.key)) {
        return columnGroup;
      }
    }
  }
  return null;
}

export function getColumnGroupIdx(
  { columnGroups }: GridModelType,
  column: KeyedColumnDescriptor
) {
  if (columnGroups) {
    for (let i = 0; i < columnGroups.length; i++) {
      if (columnGroups[i].columns.some(({ key }) => key === column.key)) {
        return i;
      }
    }
  }
  return -1;
}

const cloneColumn = (
  column: KeyedColumnDescriptor,
  { locked }: { locked?: boolean }
) => {
  return { ...column, locked };
};

export const ColumnGroup = {
  insertColumnAt: (
    columnGroup: ColumnGroupType,
    column: KeyedColumnDescriptor,
    idx: number
  ) => {
    const columns = columnGroup.columns.slice();
    columns.splice(idx, 0, cloneColumn(column, columnGroup));
    return columns;
  },
  moveColumnTo: (
    columnGroup: ColumnGroupType,
    column: KeyedColumnDescriptor,
    idx: number
  ) => {
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

export const measureColumns = (gridModel: GridModelType, left: number) => {
  if (gridModel.columnGroups === undefined) {
    throw Error(
      "gridModelUtils cannot measure columns, gridModel has no columnGroups"
    );
  }
  let position = left;
  const lastGroup = gridModel.columnGroups.length - 1;
  return gridModel.columnGroups.map((columnGroup, groupIdx) =>
    columnGroup.columns.reduce<number[]>((sizes, column, i, columns) => {
      sizes.push(position);
      position += column.width;
      if (groupIdx === lastGroup && i === columns.length - 1) {
        sizes.push(position);
      }
      return sizes;
    }, [])
  );
};

export const getColumnGroupColumnIdx = (
  { columnGroups }: GridModelType,
  idx: number
) => {
  if (columnGroups) {
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
  } else {
    return -1;
  }
};

export const getColumnGroupOffset = (
  { columnGroups }: GridModelType,
  columnGroupIdx: number
) => {
  if (columnGroups) {
    let offset = 0;
    for (let i = 0; i < columnGroupIdx; i++) {
      offset += columnGroups[i].width;
    }
    return offset;
  } else {
    return -1;
  }
};

export const getColumnOffset = (
  gridModel: GridModelType,
  columnGroupIdx: number,
  columnIdx: number
) => {
  if (gridModel.columnGroups) {
    let offset = getColumnGroupOffset(gridModel, columnGroupIdx);
    const cols = gridModel.columnGroups[columnGroupIdx].columns;
    for (let i = 0; i < columnIdx; i++) {
      offset += cols[i].width;
    }
    return offset;
  } else {
    return -1;
  }
};

function updateGroupColumnWidth(
  state: GridModelType,
  columnName: string,
  width: number
): ColumnGroupType[] {
  if (state.columnSizing === "fill") {
    return updateGroupFillColumnWidth(state, columnName, width);
  }

  const [columnGroups, groupIdx] = GridModel.updateGroupColumn(
    state,
    columnName,
    {
      width,
    }
  );
  const updatedGroup = columnGroups[groupIdx];
  updateColumnHeading(updatedGroup);
  const resizedColumn = updatedGroup.columns.find(
    (col) => col.name === columnName
  ) as KeyedColumnDescriptor;
  const widthAdjustment = width - resizedColumn.width;

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
function updateGroupFillColumnWidth(
  state: GridModelType,
  columnName: string,
  width: number
): ColumnGroupType[] {
  const { columnGroups } = state;
  if (columnGroups === undefined) {
    throw Error("updateGroupFillColumnWidth GridModel has no ColumnGroup");
  }
  const columns = columnGroups.flatMap(
    (columnGroup: ColumnGroupType) => columnGroup.columns
  );
  const resizedColumn = columns?.find((col) => col.name === columnName);
  if (resizedColumn === undefined) {
    throw Error("updateGroupFillColumnWidth column to be resized not found");
  }
  const columnIndex = columns.indexOf(resizedColumn);
  const affectedColumn = columns[columnIndex + 1];
  const widthDiff = resizedColumn.width - width;

  const applyChanges = (columnGroup: ColumnGroupType) => {
    if (
      columnGroup.columns.some(
        (column) =>
          column.name === resizedColumn.name ||
          column.name === affectedColumn.name
      )
    ) {
      return {
        ...columnGroup,
        columns: columnGroup.columns.map((column) => {
          if (column.name === resizedColumn.name) {
            return {
              ...resizedColumn,
              width,
            };
          } else if (column.name === affectedColumn.name) {
            return {
              ...affectedColumn,
              width: affectedColumn.width + widthDiff,
            };
          } else {
            return column;
          }
        }),
      };
    } else {
      return columnGroup;
    }
  };

  return columnGroups.map(applyChanges);
}

function updateColumnHeading(columnGroup: ColumnGroupType) {
  if (columnGroup.headings) {
    const columns = columnGroup.columns;
    columnGroup.headings = columnGroup.headings.map((heading) =>
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

function updateGroupColumn(
  { columnGroups }: GridModelType,
  columnName: string,
  updates: {
    resizing?: boolean;
    flex?: number;
    width?: number;
  }
): [ColumnGroupType[], number] {
  if (columnGroups === undefined) {
    throw Error("GridModel updateGroupColumn, no columnGroups");
  }
  const { groupIdx: idx, groupColIdx: colIdx } = getColumnPosition(
    columnGroups,
    columnName
  );
  const { columns, ...rest } = columnGroups[idx];
  const updatedGroups = columnGroups.map((group, i) =>
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
  keys: number[],
  columns: KeyedColumnDescriptor[]
) => keys.map((key) => columns.findIndex((c) => c.key === key));

function addGroupColumn(
  { groupBy }: { groupBy?: VuuGroupBy },
  column: KeyedColumnDescriptor
) {
  if (groupBy) {
    return groupBy.concat(column.name);
  } else {
    return [column.name];
  }
}

function addSortColumn(
  { sort }: GridModelType,
  { name: columnName }: { name: string },
  sortType: "A" | "D" = "A"
): VuuSort {
  const sortEntry: VuuSortCol = { column: columnName, sortType };
  if (sort) {
    return {
      sortDefs: sort.sortDefs.concat(sortEntry),
    };
  } else {
    return { sortDefs: [sortEntry] };
  }
}

//TODO this should preserve multi col sort
// Apply the supplied sortType to the column in sort
function setSortColumn(
  gridModel: GridModelType,
  column: KeyedColumnDescriptor,
  sortType?: "A" | "D"
): VuuSort {
  if (sortType === undefined) {
    const columnSort = gridModel.sort?.sortDefs.find(
      (item) => item.column === column.name
    );
    if (columnSort) {
      return {
        sortDefs: [
          {
            column: column.name,
            sortType: columnSort.sortType === "A" ? "D" : "A",
          },
        ],
      };
    }
  }
  return { sortDefs: [{ column: column.name, sortType: sortType ?? "A" }] };
}

function removeGroupColumn(
  { groupBy }: { groupBy?: VuuGroupBy },
  column: KeyedColumnDescriptor
): VuuGroupBy | undefined {
  if (Array.isArray(groupBy)) {
    if (groupBy.length === 1) {
      return undefined;
    } else {
      return groupBy.filter((columnName) => columnName !== column.name);
    }
  } else {
    throw Error(
      `GridModel.removeColumnGroups: cannot remove column ${column.name}, no grouping in place`
    );
  }
}

const omitSystemColumns = (column: KeyedColumnDescriptor) =>
  !column.isSystemColumn;

const addColumnToColumns = (
  column: KeyedColumnDescriptor,
  columns: KeyedColumnDescriptor[],
  index: number
) => {
  const currentIndex = columns.findIndex((col) => col.name === column.name);
  if (currentIndex === index) {
    return columns;
  } else {
    const newColumns: KeyedColumnDescriptor[] =
      currentIndex !== -1
        ? columns.filter((_, i) => i !== currentIndex)
        : columns.slice();
    newColumns.splice(index, 0, column);
    return newColumns;
  }
};

const countLeadingSystemColumns = (columns: KeyedColumnDescriptor[]) => {
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

const setAggregation = (
  { aggregations }: GridModelType,
  column: KeyedColumnDescriptor,
  aggType: AggType
) => {
  return aggregations
    .filter((agg) => agg.column !== column.name)
    .concat({ column: column.name, aggType });
};

export const GridModel = {
  addColumnToColumns,
  addGroupColumn,
  addSortColumn,
  countLeadingSystemColumns,
  columns: ({ columnGroups }: GridModelType) =>
    columnGroups
      ? flattenColumnGroup(
          columnGroups.flatMap((columnGroup) =>
            columnGroup.columns.filter(omitSystemColumns)
          )
        )
      : [],
  columnNames: (gridModel: GridModelType) =>
    GridModel.columns(gridModel).map((column) => column.name),
  removeGroupColumn,
  setAggregation,
  setSortColumn,
  updateGroupColumn,
  updateGroupColumnWidth,
};

function getColumnPosition(groups: ColumnGroupType[], columnName: string) {
  for (let i = 0; i < groups.length; i++) {
    const idx = groups[i].columns.findIndex((c) => c.name === columnName);
    if (idx !== -1) {
      return { groupIdx: i, groupColIdx: idx };
    }
  }
  return { groupIdx: -1, groupColIdx: -1 };
}

export type GroupState = {
  "*"?: boolean | GroupState;
};
export function expandStatesfromGroupState(
  { columns }: GroupColumnDescriptor,
  groupState?: GroupState
) {
  const results = Array(columns.length).fill(-1);
  let all: GroupState | boolean | undefined = groupState && groupState["*"];
  const idx = 0;
  while (all) {
    results[idx] = 1;
    all = typeof all === "object" ? all["*"] : undefined;
  }
  return results;
}

const flattenColumnGroup = (columns: KeyedColumnDescriptor[]) => {
  if (columns.length === 0 || !columns[0].isGroup) {
    return columns;
  }

  const [groupColumn, ...nonGroupColumns] = columns as [
    GroupColumnDescriptor,
    ...KeyedColumnDescriptor[]
  ];
  // traverse the group columns in reverse, but do not reverse (mutate) the original array
  for (let i = groupColumn.columns.length - 1; i >= 0; i--) {
    const column = groupColumn.columns[i];
    const { originalIdx = -1, ...nonGroupedColumn } = column;
    if (originalIdx !== -1) {
      nonGroupColumns.splice(originalIdx, 0, nonGroupedColumn);
    }
  }

  return nonGroupColumns;
};

export function extractGroupColumn(
  columns: KeyedColumnDescriptor[],
  groupBy?: VuuGroupBy
): [GroupColumnDescriptor | null, KeyedColumnDescriptor[]] {
  if (groupBy && groupBy.length > 0) {
    // Note: groupedColumns will be in column order, not groupBy order
    const [groupedColumns, rest] = columns.reduce(
      (result, column, i) => {
        const [g, r] = result;
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
      [[], []] as [KeyedColumnDescriptor[], KeyedColumnDescriptor[]]
    );
    if (groupedColumns.length !== groupBy.length) {
      throw Error(
        `extractGroupColumn: no column definition found for all groupBy cols ${JSON.stringify(
          groupBy
        )} `
      );
    }
    const groupCount = groupBy.length;
    const groupCols: KeyedColumnDescriptor[] = groupBy.map((name, idx) => {
      // Keep the cols in same order defined on groupBy
      const column = groupedColumns.find(
        (col) => col.name === name
      ) as KeyedColumnDescriptor;
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
    } as GroupColumnDescriptor;

    return [groupCol, rest];
  }
  return [null, columns];
}

export const splitKeys = (compositeKey: string): number[] =>
  `${compositeKey}`.split(":").map((k) => parseInt(k, 10));

const isKeyedColumn = (column: unknown): column is KeyedColumnDescriptor =>
  typeof (column as KeyedColumnDescriptor).key === "number";

export const assignKeysToColumns = (
  columns: (ColumnDescriptor | KeyedColumnDescriptor | string)[],
  defaultWidth: number
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
): [unknown, number | null] => {
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
