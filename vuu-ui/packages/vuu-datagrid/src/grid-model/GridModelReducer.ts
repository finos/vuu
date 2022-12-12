import { metadataKeys } from "@vuu-ui/vuu-utils";
import {
  ColumnDescriptor,
  ColumnGroupType,
  GridModelReducerInitializerTuple,
  GridModelType,
  GroupColumnIndices,
  Headings,
  HeadingResizeState,
  KeyedColumnDescriptor,
} from "./gridModelTypes";
import {
  assignKeysToColumns,
  columnKeysToIndices,
  extractGroupColumn,
  getColumnHeading,
  getHeadingPosition,
  getHorizontalScrollbarHeight,
  GridModel,
  splitKeys,
} from "./gridModelUtils";

import {
  GridModelAction,
  GridModelActionAggregate,
  GridModelActionFilter,
  GridModelActionGroupBy,
  GridModelActionHideColumn,
  GridModelActionInitialize,
  GridModelActionResize,
  GridModelActionResizeColumn,
  GridModelActionResizeHeading,
  GridModelActionRowHeight,
  GridModelActionSetColumns,
  GridModelActionSort,
} from "../grid-context";
import { isMeasured, MeasuredSize } from "./useMeasuredSize";
import { Reducer } from "react";

const DEFAULT_COLUMN_MIN_WIDTH = 30;
const DEFAULT_COLUMN_WIDTH = 80;
const DEFAULT_COLUMN_TYPE = { name: "string" };
const CHECKBOX_COLUMN: KeyedColumnDescriptor = {
  name: "",
  key: metadataKeys.SELECTED,
  width: 25,
  sortable: false,
  isSystemColumn: true,
  type: {
    name: "checkbox",
    renderer: {
      name: "checkbox-cell",
    },
  },
};

const LINE_NUMBER_COLUMN: KeyedColumnDescriptor = {
  className: "vuuLineNumber",
  flex: 0,
  isSystemColumn: true,
  label: " ",
  name: "line",
  key: metadataKeys.IDX,
  width: 30,
};

const RESIZING = { resizing: true, flex: 0 };
const NOT_RESIZING = { resizing: false };

type isResizing = typeof RESIZING | typeof NOT_RESIZING;

export type GridModelReducer = Reducer<GridModelType, GridModelAction>;

export const gridModelReducer: GridModelReducer = (state, action) => {
  // console.log(
  //   `%cGridModelReducer ${action.type}`,
  //   "color:red;font-weight:bold;"
  // );

  // prettier-ignore
  switch (action.type) {
    case "resize": return resizeGrid(state, action);
    case "resize-col": return resizeColumn(state, action);
    case "resize-heading": return resizeHeading(state, action);
    // case "add-col": return addColumn(state, action);
    case "initialize": return initialize(state, action);
    case "filter": return addFilter(state, action);
    case "sort": return sortRows(state, action);
    case "groupBy": return groupRows(state, action);
    case "set-available-columns": return setAvailableColumns(state, action);
    case "aggregate": return setAggregations(state, action);
    case "column-hide": return hideColumn(state, action);
    case "column-show": return showColumn(state, action);
    case "ROW_HEIGHT": return setRowHeight(state, action);
    default:
       console.log(`unknown action dispatched to GridModelReducer`);
       return state; 
  }
};

export type initModelProps = [];

export const initModel = ([
  gridProps,
  size,
  custom,
]: GridModelReducerInitializerTuple): GridModelType => {
  const {
    aggregations = [],
    cellSelectionModel,
    columns,
    columnSizing,
    defaultColumnWidth = DEFAULT_COLUMN_WIDTH,
    filter,
    groupBy,
    headerHeight,
    minColumnWidth = DEFAULT_COLUMN_MIN_WIDTH,
    noColumnHeaders,
    renderBufferSize,
    rowHeight,
    selectionModel = "none", // default should be none
    showLineNumbers,
    sort,
  } = gridProps;

  // The custom support is all new ... still under review
  const {
    footer: { height: customFooterHeight },
    header: { height: customHeaderHeight },
    inlineHeader: { height: customInlineHeaderHeight },
  } = custom;

  const state: GridModelType = {
    ...size,
    aggregations,
    cellSelectionModel,
    columnNames: undefined,
    columnGroups: undefined,
    columns,
    columnSizing,
    customFooterHeight,
    customHeaderHeight,
    customInlineHeaderHeight,
    defaultColumnWidth,
    filter,
    groupBy,
    headerHeight: noColumnHeaders ? 0 : headerHeight,
    headingDepth: undefined,
    horizontalScrollbarHeight: undefined,
    minColumnWidth,
    noColumnHeaders,
    renderBufferSize,
    rowHeight,
    selectionModel,
    showLineNumbers,
    sort,
    status: "pending",
    totalHeaderHeight: 0,
    viewportHeight: 0,
    viewportRowCount: 0,
    visualLinks: undefined,
  };
  if (isMeasured(size)) {
    return buildColumnsAndApplyMeasurements(state, size);
  } else {
    return state;
  }
};

function buildColumnsAndApplyMeasurements(
  state: GridModelType,
  size: MeasuredSize
): GridModelType {
  const {
    columns,
    customFooterHeight,
    customInlineHeaderHeight,
    customHeaderHeight,
    headerHeight,
    noColumnHeaders,
    rowHeight,
  } = state;

  // client height and width are always measured, width and height may come from props
  // const {
  //   height: fullHeight,
  //   clientHeight: height = fullHeight,
  //   width: fullWidth,
  //   clientWidth: width = fullWidth,
  // } = size;

  const { columnNames, columnGroups, headingDepth } = buildColumnGroups(
    state,
    columns,
    size
  );
  const totalHeaderHeight = noColumnHeaders
    ? customHeaderHeight
    : headerHeight * headingDepth + customHeaderHeight;

  const viewportHeight =
    size.clientHeight -
    totalHeaderHeight -
    customFooterHeight -
    customInlineHeaderHeight;

  return {
    ...state,
    ...size,
    columnGroups,
    columnNames,
    headingDepth,
    horizontalScrollbarHeight: getHorizontalScrollbarHeight(columnGroups),
    status: "ready",
    totalHeaderHeight,
    viewportHeight,
    viewportRowCount: (size.clientHeight - totalHeaderHeight) / rowHeight,
  };
}

function initialize(
  state: GridModelType,
  { props, size }: GridModelActionInitialize
) {
  const custom = {
    inlineHeader: { height: state.customInlineHeaderHeight },
    header: { height: state.customHeaderHeight },
    footer: { height: state.customFooterHeight },
  };
  return initModel([props, size, custom]);
}

function resizeGrid(
  state: GridModelType,
  { size }: GridModelActionResize
): GridModelType {
  let { columnGroups } = state;
  if (state.clientWidth === undefined || state.clientHeight === undefined) {
    return buildColumnsAndApplyMeasurements(state, size);
  } else {
    const {
      columnSizing,
      customFooterHeight,
      customInlineHeaderHeight,
      rowHeight,
      totalHeaderHeight,
    } = state;
    const viewportHeight =
      size.clientHeight -
      totalHeaderHeight -
      customFooterHeight -
      customInlineHeaderHeight;
    const widthDiff = size.clientWidth - state.clientWidth;

    if (widthDiff === 0) {
      columnGroups = state.columnGroups;
    } else if (columnSizing === "fill") {
      ({ columnGroups } = buildColumnGroups(
        state,
        GridModel.columns(state),
        size
      ));
    } else {
      columnGroups = state.columnGroups?.map((columnGroup) => {
        if (columnGroup.locked) {
          return columnGroup;
        } else {
          return {
            ...columnGroup,
            width: columnGroup.width + widthDiff,
          };
        }
      });
    }
    const actualRowCount = (size.clientHeight - totalHeaderHeight) / rowHeight;
    return {
      ...state,
      ...size,
      columnGroups,
      status: "ready",
      viewportHeight,
      viewportRowCount: actualRowCount,
    };
  }
}

function setAvailableColumns(
  state: GridModelType,
  action: GridModelActionSetColumns
) {
  if (!state.columnGroups && isMeasured(state)) {
    const { columnNames, columnGroups, headingDepth } = buildColumnGroups(
      state,
      action.columns
    );
    if (columnGroups) {
      const totalHeaderHeight = state.headerHeight * headingDepth;
      return {
        ...state,
        columnGroups,
        columnNames,
        headingDepth,
        horizontalScrollbarHeight: getHorizontalScrollbarHeight(columnGroups),
        viewportHeight: state.height - totalHeaderHeight,
        viewportRowCount: (state.height - totalHeaderHeight) / state.rowHeight,
      };
    }
  }
  return state;
}

function setAggregations(
  state: GridModelType,
  { aggregations }: GridModelActionAggregate
) {
  return {
    ...state,
    aggregations,
  };
}

function sortRows(
  state: GridModelType,
  { sort }: GridModelActionSort
): GridModelType {
  return {
    ...state,
    sort,
  };
}

function addFilter(state: GridModelType, { filter }: GridModelActionFilter) {
  return {
    ...state,
    filter,
  };
}

function groupRows(state: GridModelType, { groupBy }: GridModelActionGroupBy) {
  const { columnGroups } = buildColumnGroups(
    { ...state, groupBy },
    GridModel.columns(state)
  );

  return {
    ...state,
    groupBy,
    columnGroups,
  };
}

function resizeHeading(
  state: GridModelType,
  { phase, headingName, width }: GridModelActionResizeHeading
) {
  if (state.columnGroups === undefined) {
    throw Error("GridModelReducer resizeHeading, columnGroups in undefined");
  }

  const heading = getColumnHeading(state.columnGroups, headingName);

  if (phase === "begin") {
    const { columnGroups } = updateGroupHeadings(
      state.columnGroups,
      headingName,
      RESIZING,
      RESIZING,
      RESIZING
    );

    const headingResizeState: HeadingResizeState = {
      lastSizedCol: 0,
      ...getColumnPositions(columnGroups, splitKeys(heading.key)),
    };
    resizeColumnHeaderHeading = (
      state: GridModelType,
      headingName: string,
      width: number
    ) => resizeColumnHeading(state, headingName, width, headingResizeState);
    return { ...state, columnGroups };
  } else if (phase === "resize") {
    return (
      resizeColumnHeaderHeading?.(state, headingName, width as number) || state
    );
  } else {
    const { columnGroups } = updateGroupHeadings(
      state.columnGroups,
      headingName,
      NOT_RESIZING,
      NOT_RESIZING,
      NOT_RESIZING
    );
    resizeColumnHeaderHeading = undefined;
    return {
      ...state,
      columnGroups,
    };
  }
}

let resizeColumnHeaderHeading:
  | undefined
  | ((state: GridModelType, headingName: string, width: number) => void);

function resizeColumnHeading(
  state: GridModelType,
  headingName: string,
  width: number,
  headingResizeState: HeadingResizeState
) {
  if (state.columnGroups) {
    const heading = getColumnHeading(state.columnGroups, headingName);
    const diff = width - heading.width;
    const { lastSizedCol: pos, groupIdx, groupColIdx } = headingResizeState;
    const [lastSizedCol, diffs] = getColumnAdjustments(
      pos,
      groupColIdx.length,
      diff
    );

    headingResizeState.lastSizedCol = lastSizedCol;

    let newState = state;
    for (let i = 0; i < diffs.length; i++) {
      if (typeof diffs[i] === "number" && diffs[i] !== 0) {
        const targetCol = state.columnGroups[groupIdx].columns[groupColIdx[i]];
        newState = resizeColumn(
          { ...newState, headingResizeState },
          {
            type: "resize-col",
            phase: "resize",
            columnName: targetCol.name,
            width: targetCol.width + diffs[i],
          }
        );
      }
    }
    return newState;
  } else {
    return state;
  }
}

function hideColumn(
  state: GridModelType,
  { column }: GridModelActionHideColumn
) {
  const columns = GridModel.columns(state).filter(
    (col: KeyedColumnDescriptor) => col.name !== column.name
  );
  // const groupBy = GridModel.groupBy(state);
  const { columnNames, columnGroups } = buildColumnGroups(
    state,
    columns
    // groupBy
  );
  return {
    ...state,
    columnGroups,
    columnNames,
  };
}

function showColumn(
  state: GridModelType /*, action: GridModelActionShowColumn*/
) {
  return state;
}

// function addColumn(
//   state: GridModelType,
//   { insertIdx: absInsertIdx, targetColumnGroup, column }: GridModelActionAddCol
// ) {
//   if (absInsertIdx !== -1) {
//     targetColumnGroup = getColumnGroup(state, absInsertIdx);
//   }
//   const insertIdx = getColumnGroupColumnIdx(state, absInsertIdx);

//   const targetIdx = state.columnGroups?.indexOf(targetColumnGroup);
//   const sourceColumnGroup = getColumnGroup(state, column);
//   const sourceIdx = state.columnGroups?.indexOf(sourceColumnGroup);
//   const sourceColumn = state.columnGroups?.[sourceIdx].columns.find(
//     (col) => col.key === column.key
//   );
//   const columns = state.columnGroups?.flatMap((columnGroup, idx) => {
//     if (idx === sourceIdx && sourceIdx !== targetIdx) {
//       return columnGroup.columns.filter((col) => col.key !== column.key);
//     } else if (idx === sourceIdx) {
//       if (sourceIdx === targetIdx) {
//         const sourceColumnIdx = sourceColumnGroup.columns.findIndex(
//           (col) => col.key === sourceColumn.key
//         );
//         if (insertIdx > sourceColumnIdx) {
//           return ColumnGroup.moveColumnTo(columnGroup, sourceColumn, insertIdx);
//         } else {
//           return ColumnGroup.moveColumnTo(columnGroup, sourceColumn, insertIdx);
//         }
//       } else {
//         return ColumnGroup.insertColumnAt(columnGroup, sourceColumn, insertIdx);
//       }
//     } else if (idx === targetIdx) {
//       return ColumnGroup.insertColumnAt(columnGroup, sourceColumn, insertIdx);
//     } else {
//       return columnGroup.columns;
//     }
//   });

//   const { columnGroups } = buildColumnGroups(
//     state,
//     columns.filter((col) => !col.isSystemColumn)
//   );

//   const { key: _, ...columnProps } = column;
//   const leadingSystemColumns = GridModel.countLeadingSystemColumns(columns);

//   return {
//     ...state,
//     columnGroups,
//     columns: GridModel.addColumnToColumns(
//       columnProps,
//       state.columns,
//       absInsertIdx - leadingSystemColumns
//     ),
//   };
// }

function resizeColumn(
  state: GridModelType,
  { phase, columnName, width }: GridModelActionResizeColumn
): GridModelType {
  if (phase === "resize") {
    const columnGroups = GridModel.updateGroupColumnWidth(
      state,
      columnName,
      width
    );
    return { ...state, columnGroups };
  } else if (phase === "begin") {
    const [columnGroups] = GridModel.updateGroupColumn(
      state,
      columnName,
      RESIZING
    );
    return { ...state, columnGroups };
  } else {
    const [columnGroups] = GridModel.updateGroupColumn(
      state,
      columnName,
      NOT_RESIZING
    );
    return {
      ...state,
      columnGroups,
      columns: state.columns.map((c) =>
        c.name === columnName
          ? {
              ...c,
              width,
              flex: 0,
            }
          : c
      ),
    };
  }
}

function setRowHeight(
  state: GridModelType,
  { rowHeight }: GridModelActionRowHeight
) {
  if (rowHeight === state.rowHeight) {
    return state;
  } else if (typeof state.height === "undefined") {
    return {
      ...state,
      rowHeight,
    };
  } else {
    const { height, totalHeaderHeight } = state;
    return {
      ...state,
      rowHeight,
      viewportRowCount: (height - totalHeaderHeight) / rowHeight,
    };
  }

  //TODO what abl=our scroll bar calculations
}

const NO_COLUMN_GROUPS = {
  columnGroups: undefined,
  columnNames: undefined,
  headingDepth: 0,
};

function buildColumnGroups(
  state: GridModelType,
  columns: ColumnDescriptor[],
  size?: MeasuredSize
) {
  if (!columns) {
    return NO_COLUMN_GROUPS;
  }

  const gridWidth = size?.clientWidth ?? state.width;

  if (gridWidth === undefined) {
    throw Error(
      `GridModelReducer ColumnGroups cannot be built before grid has been measured`
    );
  }
  const {
    columnSizing,
    defaultColumnWidth,
    groupBy,
    minColumnWidth,
    selectionModel,
    showLineNumbers,
  } = state;
  let column = null;
  let columnGroup = null;
  const columnGroups: ColumnGroupType[] = [];
  const gridContentWidth = gridWidth - 17; // how do we know about vertical scrollbar
  let availableWidth = gridContentWidth;
  const preCols: KeyedColumnDescriptor[] =
    selectionModel === "checkbox"
      ? [CHECKBOX_COLUMN]
      : showLineNumbers
      ? [LINE_NUMBER_COLUMN]
      : [];

  const headingDepth = getMaxHeadingDepth(columns);
  // TODO separate keys from columns
  const keyedColumns = assignKeysToColumns(columns, defaultColumnWidth);
  const columnNames: string[] = keyedColumns.map((col) => col.name);

  const [groupColumn, nonGroupedColumns] = extractGroupColumn(
    keyedColumns,
    groupBy
  );
  if (groupColumn) {
    const headings: Headings | undefined =
      headingDepth > 1 ? ([] as Headings) : undefined;
    columnGroups.push(
      (columnGroup = {
        columns: preCols.concat(groupColumn),
        contentWidth: 0,
        headings,
        isGroup: true as const,
        locked: false,
        width: 0,
      })
    );
    if (headings) {
      addColumnToHeadings(headingDepth, groupColumn, headings);
    }
    preCols.length = 0;
  }

  // TODO we need a min Width on the group column as well
  let minTotalColumnWidth = groupColumn ? groupColumn.width : 0;
  let totalColumnWidth = minTotalColumnWidth;
  let flexTotal = 0;
  let flexCount = 0;
  const initialFlex: { [key: string]: number } = { $count: 0, $total: 0 };

  for (const {
    className,
    flex = undefined,
    isSystemColumn,
    key,
    name,
    heading = [name],
    label,
    locked = false,
    minWidth = minColumnWidth,
    type, // normalize this here
    width = defaultColumnWidth,
  } of preCols.concat(nonGroupedColumns)) {
    if (columnGroup === null || columnGroup.locked !== locked) {
      const headings = headingDepth > 1 ? [] : undefined;

      columnGroups.push(
        (columnGroup = {
          headings,
          isGroup: true as const,
          locked,
          columns: [] as KeyedColumnDescriptor[],
          left: totalColumnWidth, // TODO this won't be right if we introduce more than one locked group
          width: 0,
          contentWidth: 0,
        })
      );
    }

    // TODO we are losing a lot of column information here
    columnGroup.columns.push(
      (column = {
        className,
        flex,
        heading,
        isSystemColumn,
        label,
        locked,
        name,
        key,
        type:
          typeof type === "string"
            ? { name: type }
            : type
            ? type
            : DEFAULT_COLUMN_TYPE,
        width,
      })
    );

    if (columnGroup.headings) {
      addColumnToHeadings(headingDepth, column, columnGroup.headings);
    }

    columnGroup.contentWidth += width;
    minTotalColumnWidth += minWidth;
    totalColumnWidth += width;

    if (flex) {
      initialFlex.$count += 1;
      initialFlex.$total += flex;
      initialFlex[name] = flex;
    }

    if (flex) {
      flexTotal += flex;
    }

    if (flex !== 0) {
      flexCount += 1;
    }

    // TODO fixed width may exceed available width. This assumes single fixed width followed by
    // single scrollable
    if (columnGroup.locked) {
      columnGroup.width = columnGroup.contentWidth;
      availableWidth -= width;
    } else {
      columnGroup.width = availableWidth;
    }
  }

  const noInitialFlex = initialFlex.$count === 0;

  if (columnSizing === "fill") {
    // spread the diff ...
    const diff = gridContentWidth - totalColumnWidth;
    if ((diff < 0 && minTotalColumnWidth <= gridContentWidth) || diff > 0) {
      const columnWidthAdjustment =
        initialFlex.$total > 0
          ? diff / initialFlex.$total
          : flexTotal > 0
          ? diff / flexTotal
          : diff / flexCount;

      for (const columnGroup of columnGroups) {
        for (const column of columnGroup.columns) {
          let columnAdjustment = 0;
          if (initialFlex[column.name]) {
            columnAdjustment = columnWidthAdjustment * initialFlex[column.name];
          } else if (noInitialFlex && column.flex === undefined) {
            columnAdjustment = columnWidthAdjustment;
          } else if (noInitialFlex && (column?.flex ?? 0) > 0) {
            columnAdjustment = columnWidthAdjustment * (column.flex as number);
          }
          column.width += Math.floor(columnAdjustment);
          columnGroup.contentWidth += Math.floor(columnAdjustment);
        }
      }
    }
  }

  return { columnNames, columnGroups, headingDepth };
}

const getMaxHeadingDepth = (columns: ColumnDescriptor[]) => {
  if (columns.length === 0) {
    return 0;
  }
  let max = 1;
  for (let i = 0; i < columns.length; i++) {
    const { heading } = columns[i];
    if (Array.isArray(heading) && heading.length > max) {
      max = heading.length;
    }
  }
  return max;
};

function addColumnToHeadings(
  maxHeadingDepth: number,
  column: KeyedColumnDescriptor,
  headings: Headings,
  collapsedColumns?: string[]
) {
  const isHeading = true;

  const { key, heading: colHeader, width } = column;
  const colKey = `${key}`;
  for (let depth = 1; depth < maxHeadingDepth; depth++) {
    const heading = headings[depth - 1] || (headings[depth - 1] = []);
    const colHeaderLabel = colHeader?.[depth];
    const lastHeading = heading.length > 0 ? heading[heading.length - 1] : null;

    if (colHeaderLabel !== undefined) {
      if (lastHeading && lastHeading.label === colHeaderLabel) {
        lastHeading.width += width;
        lastHeading.key += `:${colKey}`;
        lastHeading.name = lastHeading.key;
      } else {
        const collapsed =
          collapsedColumns && collapsedColumns.indexOf(colHeaderLabel) !== -1;
        let hide = false;
        if (collapsed) {
          // lower depth headings are subheadings, nested subheadings below a collapsed heading
          // will be hidden. Q: would it be better to iterate higher to lower ? When we encounter
          // a collapsed heading for a given column, the first subheading at any lower level
          // will already have been created, so we need to hide them.
          for (let d = 0; d < depth - 1; d++) {
            const head = headings[d];
            head[head.length - 1].hidden = true;
          }
        } else if (depth < maxHeadingDepth - 1) {
          // ...likewise if we encounter a subheading, which is not the first for a given
          // higher -level heading, and that higher-level heading is collapsed, we need to hide it.
          for (let d = depth; d < maxHeadingDepth; d++) {
            const head = headings[d];
            const colHeadingLabel = colHeader?.[d + 1];
            if (head && head.length && colHeaderLabel) {
              const {
                collapsed: isCollapsed,
                hidden,
                label,
              } = head[head.length - 1];
              if ((isCollapsed || hidden) && label === colHeadingLabel) {
                hide = true;
              }
            }
          }
        }
        heading.push({
          key: `${key}`,
          label: colHeaderLabel,
          name: `${key}`,
          width,
          collapsed,
          hidden: hide,
          isHeading,
        });
      }
    } else {
      const lowerDepth = headings[depth - 2];
      const lastLowerDepth = lowerDepth
        ? lowerDepth[lowerDepth.length - 1]
        : null;

      if (lastLowerDepth && lastLowerDepth.key === colKey) {
        // Need to check whether a heading at level below is collapsed
        heading.push({
          key: colKey,
          label: "",
          name: colKey,
          width,
          collapsed: lastLowerDepth.collapsed,
          isHeading,
        });
      } else if (
        lastHeading &&
        lastLowerDepth &&
        endsWith(lastLowerDepth.key, `:${key}`)
      ) {
        lastHeading.width += width;
        lastHeading.key += `:${colKey}`;
        lastHeading.name = lastHeading.key;
      } else {
        heading.push({
          key: colKey,
          label: "",
          name: colKey,
          width,
          isHeading,
        });
      }
    }
  }
}

function updateGroupHeadings(
  groups: ColumnGroupType[],
  headingName: string,
  headingUpdates: isResizing,
  subHeadingUpdates: isResizing,
  columnUpdates: isResizing
) {
  const { groupIdx, groupHeadingIdx, headingColIdx } = getHeadingPosition(
    groups,
    headingName
  );
  const heading = getColumnHeading(groups, headingName);
  const keys = splitKeys(heading.key);

  const group = groups[groupIdx];
  const clonedGroup = {
    ...group,
    headings: Array.isArray(group.headings) ? [...group.headings] : [],
  };

  // 1) Apply changes to the target heading ...
  const updatedHeading = clonedGroup.headings[groupHeadingIdx].slice();
  clonedGroup.headings[groupHeadingIdx] = updatedHeading;
  updatedHeading[headingColIdx] = { ...heading, ...headingUpdates };

  // 2) Optionally, apply updates to nested sub-headings ...
  if (subHeadingUpdates) {
    for (let i = 0; i < groupHeadingIdx; i++) {
      const h = clonedGroup.headings[i];
      let updatedH = null;
      for (let j = 0; j < h.length; j++) {
        if (heading.key.indexOf(h[j].key) !== -1) {
          updatedH = updatedH || [...h];
          updatedH[j] = { ...h[j], ...subHeadingUpdates };
        }
      }
      if (updatedH !== null) {
        clonedGroup.headings[i] = updatedH;
      }
    }
  }

  // 3) Optionally, apply updates to underlying columns ...
  if (columnUpdates) {
    const { groupColIdx } = getColumnPositions(groups, keys);
    clonedGroup.columns = [...group.columns];
    groupColIdx.forEach((idx: number) => {
      const updatedColumn = { ...clonedGroup.columns[idx], ...columnUpdates };
      clonedGroup.columns[idx] = updatedColumn;
    });
  }

  const columnGroups = [...groups];
  columnGroups[groupIdx] = clonedGroup;
  return { columnGroups, updatedGroup: clonedGroup };
}

function getColumnPositions(
  groups: ColumnGroupType[],
  keys: number[]
): GroupColumnIndices {
  for (let i = 0; i < groups.length; i++) {
    const indices = columnKeysToIndices(keys, groups[i].columns);
    if (indices.every((key) => key !== -1)) {
      return { groupIdx: i, groupColIdx: indices };
    }
  }
  return { groupIdx: -1, groupColIdx: [] };
}

function getColumnAdjustments(
  pos: number,
  numCols: number,
  diff: number
): [number, number[]] {
  const sign = diff < 0 ? -1 : 1;
  const absDiff = diff * sign;
  const numSlotsToFill = Math.min(absDiff, numCols);
  const each = Math.floor(absDiff / numCols);
  let diffs = absDiff % numCols;
  const results = [];

  for (let i = 0; i < numSlotsToFill; i++, pos++) {
    if (pos === numCols) {
      pos = 0;
    }
    results[pos] = sign * (each + (diffs ? 1 : 0));
    if (diffs) {
      diffs -= 1;
    }
  }
  return [pos, results];
}

function endsWith(value: string | number, subString: string) {
  const str = typeof value === "string" ? value : value.toString();
  return subString.length >= str.length
    ? false
    : str.slice(-subString.length) === subString;
}
