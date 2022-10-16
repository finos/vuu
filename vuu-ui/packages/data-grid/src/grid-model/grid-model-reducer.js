import { metadataKeys } from "@vuu-ui/utils";
import {
  assignKeysToColumns,
  columnKeysToIndices,
  ColumnGroup,
  getColumnGroup,
  getColumnGroupColumnIdx,
  getHorizontalScrollbarHeight,
  extractGroupColumn,
  GridModel,
  splitKeys,
} from "./grid-model-utils";

import * as Action from "./grid-model-actions";

const DEFAULT_COLUMN_TYPE = { name: "string" };
const CHECKBOX_COLUMN = {
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

const LINE_NUMBER_COLUMN = {
  className: "vuLineNumber",
  flex: 0,
  isSystemColumn: true,
  label: " ",
  name: "line",
  key: metadataKeys.IDX,
  width: 30,
};

const RESIZING = { resizing: true, flex: 0 };
const NOT_RESIZING = { resizing: false };

const GridModelReducer = (state, action) => {
  // console.log(
  //   `%cGridModelReducer ${action.type}`,
  //   "color:red;font-weight:bold;"
  // );
  // @ts-ignore
  return reducerActionHandlers[action.type](state, action);
};
export default GridModelReducer;

const reducerActionHandlers = {
  resize: resizeGrid,
  [Action.COL_RESIZE]: resizeColumn,
  "resize-heading": resizeHeading,
  [Action.ADD_COL]: addColumn,
  initialize: initialize,
  filter: addFilter,
  sort: sortRows,
  group: groupRows,
  "set-available-columns": setAvailableColumns,
  "set-aggregations": setAggregations,
  "column-hide": hideColumn,
  "column-show": showColumn,
  [Action.ROW_HEIGHT]: setRowHeight,
};

export const initModel = ([gridProps, size, custom]) => {
  const {
    aggregations = [],
    cellSelectionModel,
    columns,
    columnSizing,
    defaultColumnWidth,
    filter,
    groupBy,
    headerHeight,
    minColumnWidth,
    noColumnHeaders,
    renderBufferSize,
    rowHeight,
    selectionModel, // default should be none
    showLineNumbers,
    sort,
  } = gridProps;

  const {
    height: assignedHeight,
    measuredHeight: height = assignedHeight,
    width: assignedWidth,
    measuredWidth: width = assignedWidth,
  } = size;

  const isDefaultInitialSize =
    size.width === "100%" &&
    size.height === "100%" &&
    size.measuredHeight === null &&
    size.measuredWidth === null;

  // The custom support is all new ... still under review
  const {
    footer: { height: customFooterHeight },
    header: { height: customHeaderHeight },
    inlineHeader: { height: customInlineHeaderHeight },
  } = custom;

  const state = {
    aggregations,
    assignedHeight,
    assignedWidth,
    cellSelectionModel,
    columnNames: null,
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
    height,
    horizontalScrollbarHeight: undefined,
    minColumnWidth,
    noColumnHeaders,
    renderBufferSize,
    rowHeight,
    selectionModel,
    showLineNumbers,
    sort,
    totalHeaderHeight: 0,
    viewportHeight: 0,
    viewportRowCount: 0,
    visualLinks: null,
    width,
  };

  if (isDefaultInitialSize) {
    return state;
  } else {
    return buildColumnsAndApplyMeasurements(state, height);
  }
};

function buildColumnsAndApplyMeasurements(state) {
  const {
    columns,
    customFooterHeight,
    customInlineHeaderHeight,
    customHeaderHeight,
    headerHeight,
    height,
    noColumnHeaders,
    rowHeight,
  } = state;
  const { columnNames, columnGroups, headingDepth } = buildColumnGroups(
    state,
    columns
  );
  const totalHeaderHeight = noColumnHeaders
    ? customHeaderHeight
    : headerHeight * headingDepth + customHeaderHeight;

  state.columnNames = columnNames;
  state.columnGroups = columnGroups;
  state.headingDepth = headingDepth;

  state.horizontalScrollbarHeight = getHorizontalScrollbarHeight(columnGroups);
  state.totalHeaderHeight = totalHeaderHeight;
  state.viewportHeight =
    height - totalHeaderHeight - customFooterHeight - customInlineHeaderHeight;
  state.viewportRowCount = (height - totalHeaderHeight) / rowHeight;

  return state;
}

/** @type {GridModelReducer<GridModelInitializeAction>} */
function initialize(state, { props }) {
  const custom = {
    inlineHeader: { height: state.customInlineHeaderHeight },
    header: { height: state.customHeaderHeight },
    footer: { height: state.customFooterHeight },
  };

  const {
    height: measuredHeight,
    width: measuredWidth,
    assignedHeight: height,
    assignedWidth: width,
  } = state;

  const size = {
    height,
    width,
    measuredHeight,
    measuredWidth,
  };
  return initModel([props, size, custom]);
}

/** @type {GridModelReducer<GridModelResizeAction>} */
function resizeGrid(state, { height, width }) {
  let { columnGroups } = state;
  if (state.width === null || state.height === null) {
    return buildColumnsAndApplyMeasurements({ ...state, height, width });
  } else {
    const {
      columnSizing,
      customFooterHeight,
      customInlineHeaderHeight,
      rowHeight,
      totalHeaderHeight,
    } = state;
    const viewportHeight =
      height -
      totalHeaderHeight -
      customFooterHeight -
      customInlineHeaderHeight;
    console.log(
      `GridModelReducer resizeGrid - ${width}x${height} ${viewportHeight}`
    );
    const widthDiff = width - state.width;

    if (widthDiff === 0) {
      columnGroups = state.columnGroups;
    } else if (columnSizing === "fill") {
      ({ columnGroups } = buildColumnGroups(
        { ...state, width },
        GridModel.columns(state)
      ));
    } else {
      columnGroups = state.columnGroups.map((columnGroup) => {
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

    const actualRowCount = (height - totalHeaderHeight) / rowHeight;
    return {
      ...state,
      columnGroups,
      height,
      width,
      viewportHeight,
      viewportRowCount: actualRowCount,
    };
  }
}

function setAvailableColumns(state, action) {
  if (!state.columnGroups) {
    const { columnNames, columnGroups, headingDepth } = buildColumnGroups(
      state,
      action.columns
    );
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
  } else {
    return state;
  }
}

function setAggregations(state, { aggregations }) {
  return {
    ...state,
    aggregations,
  };
}

function sortRows(state, { sort }) {
  return {
    ...state,
    sort,
  };
}

function addFilter(state, { filter }) {
  return {
    ...state,
    filter,
  };
}

function groupRows(state, { groupBy = null }) {
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

/** @type {GridModelReducer<GridModelResizeHeadingAction>} */
function resizeHeading(state, { phase, column, width }) {
  if (phase === "begin") {
    const { columnGroups } = updateGroupHeadings(
      state.columnGroups,
      column,
      RESIZING,
      RESIZING,
      RESIZING
    );
    let headingResizeState = {
      lastSizedCol: 0,
      ...getColumnPositions(columnGroups, splitKeys(column.key)),
    };
    resizeColumnHeaderHeading = (state, column, width) =>
      resizeColumnHeading(state, column, width, headingResizeState);
    return { ...state, columnGroups };
  } else if (phase === "resize") {
    return resizeColumnHeaderHeading(state, column, width);
  } else {
    const { columnGroups } = updateGroupHeadings(
      state.columnGroups,
      column,
      NOT_RESIZING,
      NOT_RESIZING,
      NOT_RESIZING
    );
    resizeColumnHeaderHeading = null;
    return {
      ...state,
      columnGroups,
    };
  }
}

let resizeColumnHeaderHeading = null;

function resizeColumnHeading(state, column, width, headingResizeState) {
  const diff = width - column.width;
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
          column: targetCol,
          width: targetCol.width + diffs[i],
        }
      );
    }
  }
  return newState;
}

/** @type {GridModelReducer<GridModelHideColumnAction>} */
function hideColumn(state, { column }) {
  const columns = GridModel.columns(state).filter(
    (col) => col.name !== column.name
  );
  const groupBy = GridModel.groupBy(state);
  const { columnNames, columnGroups } = buildColumnGroups(
    state,
    columns,
    groupBy
  );
  return {
    ...state,
    columnGroups,
    columnNames,
  };
}

/** @type {GridModelReducer<GridModelShowColumnAction>} */
function showColumn(state) {
  return state;
}

/** @type {GridModelReducer<GridModelAddColumnAction>} */
function addColumn(
  state,
  { insertIdx: absInsertIdx, targetColumnGroup, column }
) {
  if (absInsertIdx !== -1) {
    targetColumnGroup = getColumnGroup(state, absInsertIdx);
  }
  const insertIdx = getColumnGroupColumnIdx(state, absInsertIdx);

  const targetIdx = state.columnGroups.indexOf(targetColumnGroup);
  const sourceColumnGroup = getColumnGroup(state, column);
  const sourceIdx = state.columnGroups.indexOf(sourceColumnGroup);
  const sourceColumn = state.columnGroups[sourceIdx].columns.find(
    (col) => col.key === column.key
  );
  const columns = state.columnGroups.flatMap((columnGroup, idx) => {
    if (idx === sourceIdx && sourceIdx !== targetIdx) {
      return columnGroup.columns.filter((col) => col.key !== column.key);
    } else if (idx === sourceIdx) {
      if (sourceIdx === targetIdx) {
        const sourceColumnIdx = sourceColumnGroup.columns.findIndex(
          (col) => col.key === sourceColumn.key
        );
        if (insertIdx > sourceColumnIdx) {
          return ColumnGroup.moveColumnTo(columnGroup, sourceColumn, insertIdx);
        } else {
          return ColumnGroup.moveColumnTo(columnGroup, sourceColumn, insertIdx);
        }
      } else {
        return ColumnGroup.insertColumnAt(columnGroup, sourceColumn, insertIdx);
      }
    } else if (idx === targetIdx) {
      return ColumnGroup.insertColumnAt(columnGroup, sourceColumn, insertIdx);
    } else {
      return columnGroup.columns;
    }
  });

  const { columnGroups } = buildColumnGroups(
    state,
    columns.filter((col) => !col.isSystemColumn),
    null
  );

  const { key: _, ...columnProps } = column;
  const leadingSystemColumns = GridModel.countLeadingSystemColumns(columns);

  return {
    ...state,
    columnGroups,
    columns: GridModel.addColumnToColumns(
      columnProps,
      state.columns,
      absInsertIdx - leadingSystemColumns
    ),
  };
}

/** @type {GridModelReducer<'resize-col'>} */
function resizeColumn(state, { phase, column, width }) {
  if (phase === "resize") {
    const columnGroups = GridModel.updateGroupColumnWidth(state, column, width);
    return { ...state, columnGroups };
  } else if (phase === "begin") {
    const [columnGroups] = GridModel.updateGroupColumn(state, column, RESIZING);
    return { ...state, columnGroups };
  } else {
    const [columnGroups] = GridModel.updateGroupColumn(
      state,
      column,
      NOT_RESIZING
    );
    return {
      ...state,
      columnGroups,
      columns: state.columns.map((c) =>
        c.name === column.name
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

/** @type {GridModelReducer<GridModelRowHeightAction>} */
function setRowHeight(state, { rowHeight }) {
  const { height, totalHeaderHeight } = state;
  return {
    ...state,
    rowHeight,
    viewportRowCount: (height - totalHeaderHeight) / rowHeight,
  };

  //TODO what abl=our scroll bar calculations
}

const NO_COLUMN_GROUPS = { headingDepth: 0 };

function buildColumnGroups(state, columns) {
  if (!columns) {
    return NO_COLUMN_GROUPS;
  }
  const {
    columnSizing,
    defaultColumnWidth,
    groupBy,
    minColumnWidth,
    selectionModel,
    showLineNumbers,
    width: gridWidth,
  } = state;
  let column = null;
  let columnGroup = null;
  let columnGroups = [];
  let gridContentWidth = gridWidth - 15; // how do we know about vertical scrollbar
  let availableWidth = gridContentWidth;

  const preCols =
    selectionModel === "checkbox"
      ? [CHECKBOX_COLUMN]
      : showLineNumbers
      ? [LINE_NUMBER_COLUMN]
      : [];

  const headingDepth = getMaxHeadingDepth(columns);
  // TODO separate keys from columns
  const keyedColumns = assignKeysToColumns(
    columns,
    defaultColumnWidth,
    showLineNumbers
  );
  const columnNames = keyedColumns.map((col) => col.name);

  const [groupColumn, nonGroupedColumns] = extractGroupColumn(
    keyedColumns,
    groupBy
  );
  if (groupColumn) {
    const headings = headingDepth > 1 ? [] : undefined;
    columnGroups.push(
      (columnGroup = {
        locked: false,
        columns: preCols.concat(groupColumn),
        headings,
        width: 0,
        contentWidth: 0,
      })
    );
    addColumnToHeadings(headingDepth, groupColumn, headings);
    preCols.length = 0;
  }

  // TODO we need a min Width on the group column as well
  let minTotalColumnWidth = groupColumn ? groupColumn.width : 0;
  let totalColumnWidth = minTotalColumnWidth;
  let flexTotal = 0;
  let flexCount = 0;
  const initialFlex = { $count: 0, $total: 0 };

  for (let {
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
          locked,
          columns: [],
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

      for (let columnGroup of columnGroups) {
        for (let column of columnGroup.columns) {
          let columnAdjustment = 0;
          if (initialFlex[column.name]) {
            columnAdjustment = columnWidthAdjustment * initialFlex[column.name];
          } else if (noInitialFlex && column.flex === undefined) {
            columnAdjustment = columnWidthAdjustment;
          } else if (noInitialFlex && column.flex > 0) {
            columnAdjustment = columnWidthAdjustment * column.flex;
          }
          column.width += columnAdjustment;
          columnGroup.contentWidth += columnAdjustment;
        }
      }
    }
  }

  return { columnNames, columnGroups, headingDepth };
}

const getMaxHeadingDepth = (columns) => {
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
  maxHeadingDepth,
  column,
  headings,
  collapsedColumns = null
) {
  const sortable = false;
  const collapsible = true;
  const isHeading = true;

  const { key, heading: colHeader, width } = column;
  for (let depth = 1; depth < maxHeadingDepth; depth++) {
    const heading = headings[depth - 1] || (headings[depth - 1] = []);
    const colHeaderLabel = colHeader[depth];
    const lastHeading = heading.length > 0 ? heading[heading.length - 1] : null;

    if (colHeaderLabel !== undefined) {
      if (lastHeading && lastHeading.label === colHeader[depth]) {
        lastHeading.width += width;
        lastHeading.key += `:${key}`;
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
            const colHeadingLabel = colHeader[d + 1];
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
          key,
          label: colHeaderLabel,
          width,
          sortable,
          collapsible,
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

      if (lastLowerDepth && lastLowerDepth.key === key) {
        // Need to check whether a heading at level below is collapsed
        heading.push({
          key,
          label: "",
          width,
          collapsed: lastLowerDepth.collapsed,
          sortable,
          isHeading,
        });
      } else if (lastLowerDepth && endsWith(lastLowerDepth.key, `:${key}`)) {
        lastHeading.width += width;
        lastHeading.key += `:${key}`;
      } else {
        heading.push({ key, label: "", width, isHeading });
      }
    }
  }
}

function updateGroupHeadings(
  groups,
  column,
  headingUpdates,
  subHeadingUpdates,
  columnUpdates
) {
  const keys = splitKeys(column.key);
  const { groupIdx, groupHeadingIdx, headingColIdx } = getHeadingPosition(
    groups,
    column
  );

  const group = groups[groupIdx];
  const updatedGroup = { ...group, headings: [...group.headings] };

  // 1) Apply changes to the target heading ...
  const heading = updatedGroup.headings[groupHeadingIdx];
  const updatedHeading = [...heading];
  updatedGroup.headings[groupHeadingIdx] = updatedHeading;
  updatedHeading[headingColIdx] = { ...column, ...headingUpdates };

  // 2) Optionally, apply updates to nested sub-headings ...
  if (subHeadingUpdates) {
    for (let i = 0; i < groupHeadingIdx; i++) {
      const h = updatedGroup.headings[i];
      let updatedH = null;
      for (let j = 0; j < h.length; j++) {
        if (column.key.indexOf(h[j].key) !== -1) {
          updatedH = updatedH || [...h];
          updatedH[j] = { ...h[j], ...subHeadingUpdates };
        }
      }
      if (updatedH !== null) {
        updatedGroup.headings[i] = updatedH;
      }
    }
  }

  // 3) Optionally, apply updates to underlying columns ...
  if (columnUpdates) {
    const { groupColIdx } = getColumnPositions(groups, keys);
    updatedGroup.columns = [...group.columns];
    groupColIdx.forEach((idx) => {
      const updatedColumn = { ...updatedGroup.columns[idx], ...columnUpdates };
      updatedGroup.columns[idx] = updatedColumn;
    });
  }

  const columnGroups = [...groups];
  columnGroups[groupIdx] = updatedGroup;
  return { columnGroups, updatedGroup };
}

function getHeadingPosition(groups, column) {
  for (let i = 0; i < groups.length; i++) {
    const { headings = null } = groups[i];
    for (let j = 0; headings && j < headings.length; j++) {
      const idx = headings[j].findIndex(
        (h) => h.key === column.key && h.label === column.label
      );
      if (idx !== -1) {
        return { groupIdx: i, groupHeadingIdx: j, headingColIdx: idx };
      }
    }
  }
  return { groupIdx: -1, groupHeadingIdx: -1, headingColIdx: -1 };
}

function getColumnPositions(groups, keys) {
  for (let i = 0; i < groups.length; i++) {
    const indices = columnKeysToIndices(keys, groups[i].columns);
    if (indices.every((key) => key !== -1)) {
      return { groupIdx: i, groupColIdx: indices };
    }
  }
  return { groupIdx: -1, groupColIdx: [] };
}

function getColumnAdjustments(pos, numCols, diff) {
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

function endsWith(string, subString) {
  const str = typeof string === "string" ? string : string.toString();

  return subString.length >= str.length
    ? false
    : str.slice(-subString.length) === subString;
}
