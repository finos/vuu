import { sortBy, sortPosition, GROUP_ROW_TEST } from './sort';
import { metadataKeys } from '@vuu-ui/utils';

const {
  IDX,
  RENDER_IDX,
  IS_LEAF,
  IS_EXPANDED,
  DEPTH,
  COUNT,
  KEY,
  SELECTED,
  // these all needto be adjusted by column count
  PARENT_IDX,
  IDX_POINTER,
  FILTER_COUNT,
  NEXT_FILTER_IDX,
  count: metadataOffset
} = metadataKeys;

const DEFAULT_OPTIONS = {
  startIdx: 0,
  rootIdx: null,
  baseGroupby: []
};

const GROUP_KEY_DELIMITER = '|';

export function indexOfCol(key, cols = null) {
  if (cols !== null) {
    for (let i = 0; i < cols.length; i++) {
      // check both while we transition from groupBy to extendedGroupby
      // groupBy = [colName, dir] extendedGroupby = [colIdx, dir,colName]
      const [col1, , col2] = cols[i];
      if (col1 === key || col2 === key) {
        return i;
      }
    }
  }
  return -1;
}

// // should be called toggleColumnInGroupBy
// export function updateGroupBy(existingGroupBy = null, column/*, replace = false*/) {
//   console.log(``)
//   if (existingGroupBy === null) {
//       return [[column.name, ASC]];
//   } else {
//       return indexOfCol(column.name, existingGroupBy) === -1
//           ? existingGroupBy.concat([[column.name, ASC]])
//           : existingGroupBy.length === 1
//               ? null
//               : existingGroupBy.filter(([colName]) => colName !== column.name);
//   }
// }

/** @type {import('./group-utils').lowestIdxPointerFunc} */
export function lowestIdxPointer(groups, IDX, DEPTH, start, depth) {
  let result = Number.MAX_SAFE_INTEGER;
  for (let i = start; i < groups.length; i++) {
    const group = groups[i];
    const groupDepth = group[DEPTH];

    if (groupDepth < depth) {
      break;
    } else if (groupDepth === depth) {
      const idx = group[IDX];
      if (typeof idx === 'number' && idx < result) {
        result = idx;
      }
    }
  }

  return result === Number.MAX_SAFE_INTEGER ? undefined : result;
}

/** @type {import('./group-utils').getCountFunc} */
export function getCount(groupRow, PRIMARY_COUNT, FALLBACK_COUNT) {
  return typeof groupRow[PRIMARY_COUNT] === 'number'
    ? groupRow[PRIMARY_COUNT]
    : groupRow[FALLBACK_COUNT];
}

export class SimpleTracker {
  constructor(levels) {
    this.levels = Array(levels)
      .fill(0)
      .reduce((acc, el, i) => {
        acc[i + 1] = { key: null, pos: null, pPos: null };
        return acc;
      }, {});
  }
  set(depth, pos, groupKey) {
    if (this.levels) {
      const level = this.levels[Math.abs(depth)];
      if (level && level.key !== groupKey) {
        if (level.key !== null) {
          level.pPos = level.pos;
        }
        level.key = groupKey;
        level.pos = pos;
      }
    }
  }

  hasParentPos(level) {
    return this.levels[level + 1] && this.levels[level + 1].pos !== null;
  }

  parentPos(level) {
    return this.levels[level + 1].pos;
  }

  hasPreviousPos(level) {
    return this.levels[level] && this.levels[level].pPos !== null;
  }

  previousPos(level) {
    return this.levels[level].pPos;
  }
}

export class GroupIdxTracker {
  constructor(levels) {
    this.idxAdjustment = 0;
    this.maxLevel = levels + 1;
    this.levels =
      levels > 0
        ? Array(levels)
            .fill(0)
            .reduce((acc, el, i) => {
              acc[i + 2] = { key: null, current: 0, previous: 0 };
              return acc;
            }, {})
        : null;
  }

  increment(count) {
    this.idxAdjustment += count;
    if (this.levels) {
      for (let i = 2; i < this.maxLevel + 1; i++) {
        this.levels[i].current += count;
      }
    }
  }

  previous(level) {
    return (this.levels && this.levels[level] && this.levels[level].previous) || 0;
  }

  hasPrevious(level) {
    return this.previous(level) > 0;
  }

  get(idx) {
    return this.levels === null ? null : this.levels[idx];
  }

  set(depth, groupKey) {
    if (this.levels) {
      const level = this.levels[depth];
      if (level && level.key !== groupKey) {
        if (level.key !== null) {
          level.previous += level.current;
          level.current = 0;
        }
        level.key = groupKey;
      }
    }
  }
}

const itemIsNumeric = (item) => !isNaN(parseInt(item, 10));
const numerically = (a, b) => parseInt(a) - parseInt(b);

function sortKeys(o) {
  const keys = Object.keys(o);
  if (keys.every(itemIsNumeric)) {
    return keys.sort(numerically);
  } else {
    return keys.sort();
  }
}

export function fillNavSetsFromGroups(
  groups,
  sortSet,
  sortIdx = 0,
  filterSet = null,
  filterIdx,
  filterLen
) {
  const keys = sortKeys(groups);
  const filtered = filterSet !== null;
  const filterIndices = filtered ? filterSet.slice(filterIdx, filterLen) : null;
  for (let i = 0; i < keys.length; i++) {
    const groupedRows = groups[keys[i]];
    if (Array.isArray(groupedRows)) {
      for (let j = 0, len = groupedRows.length; j < len; j++) {
        const rowIdx = groupedRows[j];
        sortSet[sortIdx] = rowIdx;
        sortIdx += 1;
        // this could be prohibitively slow (the includes test) ...
        if (filtered && filterIndices.includes(rowIdx)) {
          filterSet[filterIdx] = rowIdx;
          filterIdx += 1;
        }
      }
    } else {
      sortIdx = fillNavSetsFromGroups(groupedRows, sortSet, sortIdx);
    }
  }
  return sortIdx;
}

// WHY is param order different from groupLeafRows
/** @type {import('./group-utils').groupRowsFunc} */
export function groupRows(rows, sortSet, columns, columnMap, groupby, options = DEFAULT_OPTIONS) {
  const {
    startIdx = 0,
    length = rows.length,
    rootIdx = null,
    baseGroupby = [],
    groups = [],
    rowParents = null,
    filterLength,
    filterSet,
    filterFn: filter
  } = options;
  let { depth: depthProp = 1, groupIdx = -1, filterIdx } = options;
  const aggregations = findAggregatedColumns(columns, columnMap, groupby);
  const groupedLeafRows = groupLeafRows(sortSet, rows, groupby, startIdx, length);
  fillNavSetsFromGroups(groupedLeafRows, sortSet, startIdx, filterSet, filterIdx, filterLength);

  const groupCount = groupby.length;
  const fullGroupCount = groupCount + baseGroupby.length;
  const currentGroups = Array(groupCount).fill(null);
  let parentIdx = rootIdx;
  let leafCount = 0;
  for (let i = startIdx, len = startIdx + length; i < len; i++) {
    const rowIdx = sortSet[i];
    const row = rows[rowIdx];

    for (let level = 0; level < groupCount; level++) {
      const [columnIdx] = groupby[level];
      const currentGroup = currentGroups[level];
      const groupValue = row[columnIdx];
      // as soon as we identify a group change, each group at that level and below
      // is then aggregated and new group(s) initiated.
      // TODO how do we map from table idx (with 2 x metadata)
      if (
        currentGroup === null ||
        currentGroup[metadataOffset + columnIdx - 2 /* !!!!!!! */] !== groupValue
      ) {
        if (currentGroup !== null) {
          // as soon as we know we're regrouping, aggregate the open groups, in reverse order
          for (let ii = groupCount - 1; ii >= level; ii--) {
            const group = currentGroups[ii];
            aggregate(
              group,
              groups,
              sortSet,
              rows,
              aggregations,
              fullGroupCount,
              leafCount,
              filter
            );
            if (filterSet && Math.abs(group[DEPTH]) === 1 && group[FILTER_COUNT] > 0) {
              group[NEXT_FILTER_IDX] = filterIdx;
              filterIdx += group[FILTER_COUNT];
            }
          }

          leafCount = 0;
        }
        for (let ii = level; ii < groupCount; ii++) {
          groupIdx += 1;
          parentIdx = ii === 0 ? rootIdx : currentGroups[ii - 1][IDX];
          const depth = depthProp + ii;
          // for first-level groups, row pointer is a pointer into the sortSet
          const childIdx = depth === fullGroupCount ? i : groupIdx + 1;

          const groupRow = (currentGroups[ii] = GroupRow(
            row,
            depth,
            groupIdx,
            childIdx,
            parentIdx,
            groupby,
            columns,
            columnMap,
            baseGroupby
          ));
          groups.push(groupRow);
        }
        break; // do not continue looping once we identify the change point
      }
    }
    rowParents && (rowParents[rowIdx] = groupIdx);
    leafCount += 1;
  }

  // aggregation for last group
  for (let i = groupCount - 1; i >= 0; i--) {
    if (currentGroups[i] !== null) {
      const group = currentGroups[i];
      aggregate(group, groups, sortSet, rows, aggregations, fullGroupCount, leafCount, filter);
      if (filterSet && Math.abs(group[DEPTH]) === 1 && group[FILTER_COUNT] > 0) {
        group[NEXT_FILTER_IDX] = filterIdx;
      }
    }
  }

  return groups;
}

// Checks very specifically for new cols added at end
/** @type {import('./group-utils').groupbyExtendsExistingGroupby} */
export function groupbyExtendsExistingGroupby(groupBy, existingGroupBy) {
  return (
    groupBy.length > existingGroupBy.length &&
    existingGroupBy.every((g, i) => g[0] === groupBy[i][0])
  );
}

// doesn't care from which position col is removed, as long as it is not the first
/** @type {import('./group-utils').groupbyReducesExistingGroupby} */
export function groupbyReducesExistingGroupby(groupby, existingGroupby) {
  return (
    existingGroupby.length > groupby.length &&
    groupby[0][0] === existingGroupby[0][0] &&
    groupby.every(([key]) => existingGroupby.find(([key2]) => key2 === key))
  );
}

/** @type {import('./group-utils').groupbySortReversed} */
export function groupbySortReversed(groupBy, existingGroupBy) {
  const [col] = findSortedCol(groupBy, existingGroupBy);
  return col !== null;
}

/** @type {import('./group-utils').findDoomedColumnDepths} */
export function findDoomedColumnDepths(groupby, existingGroupby) {
  return existingGroupby.reduce((results, [colIdx], idx) => {
    if (!groupby.some((group) => group[0] === colIdx)) {
      results.push(idx + 1);
    }
    return results;
  }, []);
}

/** @type {import('./group-utils').groupbyExtendsExistingGroupby} */
export function findSortedCol(groupby, existingGroupby) {
  let results = [null];
  let len1 = groupby && groupby.length;
  let len2 = existingGroupby && existingGroupby.length;
  if (len1 && len2 && len1 === len2) {
    for (let i = 0; i < len1; i++) {
      if (groupby[i][0] !== existingGroupby[i][0]) {
        return results;
      } else if (groupby[i][1] !== existingGroupby[i][1]) {
        results[0] = i;
        results[1] = len1 - i;
      }
    }
  }
  return results;
}

function byKey([key1], [key2]) {
  return key1 > key2 ? 1 : key2 > key1 ? -1 : 0;
}

const EMPTY = {};
/** @type {import('./group-utils').getGroupStateChanges} */
export function getGroupStateChanges(
  groupState,
  existingGroupState = null,
  baseKey = '',
  groupIdx = 0
) {
  const results = [];
  const entries = Object.entries(groupState);

  entries.forEach(([key, value]) => {
    if (value && (existingGroupState === null || !existingGroupState[key])) {
      results.push([baseKey + key, groupIdx, true]);
      if (value !== null && typeof value === 'object' && Object.keys(value).length > 0) {
        const diff = getGroupStateChanges(value, EMPTY, baseKey + key + '/', groupIdx + 1);
        if (diff.length) {
          results.push(...diff);
        }
      }
    } else if (value) {
      const diff = getGroupStateChanges(
        value,
        existingGroupState[key],
        baseKey + key + '/',
        groupIdx + 1
      );
      if (diff.length) {
        results.push(...diff);
      }
    }
  });

  if (existingGroupState !== null && typeof existingGroupState === 'object') {
    Object.entries(existingGroupState).forEach(([key, value]) => {
      if (value && !groupState[key]) {
        results.push([baseKey + key, groupIdx, false]);
      }
    });
  }

  return results.sort(byKey);
}

export function getDirection(depth, groupby) {
  const idx = groupby.length - depth;
  const [, direction] = groupby[idx];
  return direction;
}

/** @type {import('./group-utils').expanded} */
export function expanded(group, groupby, groupState) {
  const groupIdx = groupby.length - Math.abs(group[1]);
  let groupVal;
  let stateEntry = groupState;
  for (let i = 0; i <= groupIdx; i++) {
    const [colIdx] = groupby[i];
    groupVal = group[colIdx];
    if (i === groupIdx) {
      return stateEntry[groupVal];
    } else {
      stateEntry = stateEntry[groupVal];
      if (!stateEntry) {
        return false;
      }
    }
  }
  return false;
}

/** @type {import('./group-utils').allGroupsExpanded} */
export function allGroupsExpanded(groups, group) {
  do {
    if (group[DEPTH] < 0) {
      return false;
    }
    group = groups[group[PARENT_IDX]];
  } while (group);

  return true;
}

/** @type {import('./group-utils').adjustGroupIndices} */
export function adjustGroupIndices(groups, grpIdx, adjustment = 1) {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i][IDX] >= grpIdx) {
      groups[i][IDX] += adjustment;
      if (Math.abs(groups[i][DEPTH]) > 1) {
        groups[i][IDX_POINTER] += adjustment;
      }
      let parentIdx = groups[i][PARENT_IDX];
      if (parentIdx !== null && parentIdx >= grpIdx) {
        groups[i][PARENT_IDX] += adjustment;
      }
    }
  }
}

/** @type {import('./group-utils').adjustLeafIdxPointers} */
export function adjustLeafIdxPointers(groups, insertionPoint, adjustment = 1) {
  for (let i = 0; i < groups.length; i++) {
    if (Math.abs(groups[i][DEPTH]) === 1 && groups[i][IDX_POINTER] >= insertionPoint) {
      groups[i][IDX_POINTER] += adjustment;
    }
  }
}

/**
 * Find the groups that will be affectes by an inserted row.
 *
 * @type {import('./group-utils').findGroupPositions} */
export function findGroupPositions(groups, groupby, dataRow) {
  const positions = [];

  out: for (let i = 0; i < groupby.length; i++) {
    const sorter = sortBy(groupby.slice(0, i + 1), GROUP_ROW_TEST);
    const position = sortPosition(groups, sorter, dataRow, 'first-available');
    const group = groups[position];
    // if all groups are missing and insert position is end of list ...
    if (group === undefined) {
      break;
    }
    // position is confirmed if all groupCol values in this comparison match values of row
    // and other groupCol values  are null
    for (let j = 0; j < groupby.length; j++) {
      const colIdx = groupby[j][0];
      const colValue = group[colIdx];
      if (j > i) {
        if (colValue !== null) {
          break out;
        }
      } else if (colValue !== dataRow[colIdx]) {
        break out;
      }
    }
    positions.push(position);
  }

  return positions;
}

/** @type {import('./group-utils').expandRow} */
export const expandRow = (groupCols, row, meta) => {
  const r = row.slice();
  r[meta.IDX] = 0;
  r[meta.DEPTH] = 0;
  r[meta.COUNT] = 0;
  r[meta.KEY] = buildGroupKey(groupCols, row);
  r[meta.SELECTED] = 0;
  return r;
};

function buildGroupKey(groupby, row) {
  const extractKey = ([idx]) => row[idx];
  return groupby.map(extractKey).join('/');
}

// Do we have to take columnMap out again ?
export function GroupRow(
  row,
  depth,
  idx,
  childIdx,
  parentIdx,
  groupby,
  columns,
  columnMap,
  baseGroupby = []
) {
  // The group is a set of metadata values plus data values
  const group = Array(metadataOffset + columns.length);
  // const groupIdx = groupby.length - depth;
  const groupIdx = depth - 1;
  let colIdx;

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    const key = columnMap[column.name];
    // careful here, key maps to the table row (includes 2 metadata slots), groupBy has also been translated to table keys
    // the group represents a full projection, metadata + columns
    const groupKey = metadataOffset + i;
    if (column.aggregate) {
      // implies we can't group on aggregate columns, does the UI know that ?
      group[groupKey] = 0;
    } else if ((colIdx = indexOfCol(key, groupby)) !== -1 && colIdx <= groupIdx) {
      group[groupKey] = row[key];
    } else {
      group[groupKey] = null;
    }
  }
  for (let i = 0; i < baseGroupby.length; i++) {
    // baseGroupBy offsets are tableRow offsets, with 2 slots of metadata
    const [colIdx] = baseGroupby[i];
    // TODO need to convert colIdx to columns ref
    group[metadataOffset + colIdx - 2] = row[colIdx];
  }

  const extractKey = ([idx]) => row[idx];
  const buildKey = (groupby) => groupby.map(extractKey).join(GROUP_KEY_DELIMITER);
  //TODO build the composite key for the grouprow
  const keyRoot = '$root' + GROUP_KEY_DELIMITER;
  const baseKey =
    baseGroupby.length > 0 ? keyRoot + buildKey(baseGroupby) + GROUP_KEY_DELIMITER : keyRoot;
  const groupKey = buildKey(groupby.slice(0, groupIdx + 1));

  group[IDX] = idx;
  group[RENDER_IDX] = 0;
  group[IS_LEAF] = false;
  group[IS_EXPANDED] = false;
  group[DEPTH] = depth;
  group[COUNT] = 0;
  group[KEY] = baseKey + groupKey;
  group[SELECTED] = 0;
  group[PARENT_IDX] = parentIdx;
  group[IDX_POINTER] = childIdx;

  return group;
}

export function groupLeafRows(sortSet, leafRows, groupby, startIdx = 0, length = sortSet.length) {
  const groups = {};
  const levels = groupby.length;
  const lastLevel = levels - 1;
  for (let i = startIdx, len = startIdx + length; i < len; i++) {
    const idx = sortSet[i];
    const leafRow = leafRows[idx];
    let target = groups;
    let targetKey;
    let key;
    for (let level = 0; level < levels; level++) {
      const [colIdx] = groupby[level];
      key = leafRow[colIdx];
      targetKey = target[key];
      if (targetKey && level === lastLevel) {
        targetKey.push(idx);
      } else if (targetKey) {
        target = targetKey;
      } else if (!targetKey && level < lastLevel) {
        target = target[key] = {};
      } else if (!targetKey) {
        target[key] = [idx];
      }
    }
  }
  return groups;
}

/** @type {import('./group-utils').splitGroupsAroundDoomedGroup} */
export function splitGroupsAroundDoomedGroup(groupby, doomed) {
  const maxDepth = groupby.length;
  const lastGroupIsDoomed = doomed === maxDepth;
  const doomedIdx = doomed - 1;
  const preDoomedGroupby = [];
  const postDoomedGroupby = [];

  groupby.forEach((col, i) => {
    if (i < doomedIdx) {
      preDoomedGroupby.push(col);
    } else if (i > doomedIdx) {
      postDoomedGroupby.push(col);
    }
  });

  return [lastGroupIsDoomed, preDoomedGroupby, postDoomedGroupby];
}

// hardcode the index ref for now
// When we build the group index, all groups are collapsed
export function indexGroupedRows(groupedRows) {
  // TODO
  const Fields = {
    Depth: 1,
    Key: 4
  };

  const groupedIndex = {};
  const levels = [];
  const COLLAPSED = -1;

  for (let idx = 0; idx < groupedRows.length; idx++) {
    let row = groupedRows[idx];
    let rowDepth = row[Fields.Depth];

    if (rowDepth === 0) {
      let index = [idx];
      levels.forEach((level) => {
        index.push(level[1], COLLAPSED);
      });
      groupedIndex[row[Fields.Key]] = index;
    } else {
      while (levels.length && Math.abs(levels[levels.length - 1][0]) <= Math.abs(rowDepth)) {
        levels.pop();
      }
      levels.push([rowDepth, idx]);
    }
  }

  return groupedIndex;
}

/** @type {import('./group-utils').findAggregatedColumns} */
export function findAggregatedColumns(columns, columnMap, groupby) {
  return columns.reduce((aggregations, column) => {
    if (column.aggregate && indexOfCol(column.name, groupby) === -1) {
      const key = columnMap[column.name];
      aggregations.push([key, column.aggregate]);
    }
    return aggregations;
  }, []);
}

/**
 * Called when we clear a filter
 *
 * @type {import('./group-utils').aggregateGroup} */
export function aggregateGroup(groups, grpIdx, sortSet, rows, columns, aggregations, maxDepth) {
  const groupRow = groups[grpIdx];
  let depth = groupRow[DEPTH];
  let absDepth = Math.abs(depth);
  let count = 0;
  let idx = grpIdx;

  // find the last nested group and work back - first build aggregates for level 1 groups,
  // then use those to aggregate to level 2 etc.
  while (idx < groups.length - 1 && Math.abs(groups[idx + 1][DEPTH]) < absDepth) {
    idx += 1;
    count += 1;
  }

  for (let i = grpIdx + count; i >= grpIdx; i--) {
    for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
      const [colIdx] = aggregations[aggIdx];
      const dataIdx = colIdx + metadataOffset - 2; // <<<<<<<<<<<
      groups[i][dataIdx] = 0;
    }
    aggregate(groups[i], groups, sortSet, rows, aggregations, maxDepth, groups[i][COUNT]);
  }
}

function aggregate(
  groupRow,
  groupRows,
  sortSet,
  rows,
  aggregations,
  maxDepth,
  leafCount,
  filter = null
) {
  let depth = groupRow[DEPTH];
  let count = 0;
  let filteredCount = filter === null ? undefined : 0;

  if (depth === maxDepth) {
    // The first group accumulates aggregates from the raw data...
    let start = groupRow[IDX_POINTER];
    let end = start + leafCount;
    count = leafCount;
    for (let i = start; i < end; i++) {
      const row = rows[sortSet[i]];
      const included = filter === null || filter(row);
      if (filter && included) {
        filteredCount += 1;
      }
      if (filter === null || included) {
        for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
          const [colIdx] = aggregations[aggIdx];
          groupRow[metadataOffset + colIdx - 2 /* !!!!!!! */] += row[colIdx];
        }
      }
    }
  } else {
    // higher-level groups aggregate from child-groups ...
    // we cannot blindly use the grpIndex of the groupRow, as we may be dealing with a smaller subset
    // of groupRows, e,g, when inserting a new row and creating the missing groups
    const startIdx = groupRows.indexOf(groupRow) + 1;
    for (let i = startIdx; i < groupRows.length; i++) {
      const nestedGroupRow = groupRows[i];
      const nestedRowDepth = nestedGroupRow[DEPTH];
      const nestedRowCount = nestedGroupRow[COUNT];
      const absNestedRowDepth = Math.abs(nestedRowDepth);
      if (absNestedRowDepth >= depth) {
        break;
      } else if (absNestedRowDepth === depth - 1) {
        for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
          const [colIdx, method] = aggregations[aggIdx];
          if (method === 'avg') {
            groupRow[metadataOffset + colIdx - 2] +=
              nestedGroupRow[metadataOffset + colIdx - 2] * nestedRowCount;
          } else {
            groupRow[metadataOffset + colIdx - 2] += nestedGroupRow[metadataOffset + colIdx - 2];
          }
        }
        count += nestedRowCount;
      }
    }
  }

  for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
    const [colIdx, method] = aggregations[aggIdx];
    if (method === 'avg') {
      groupRow[metadataOffset + colIdx - 2] = groupRow[metadataOffset + colIdx - 2] / count;
    }
  }

  groupRow[COUNT] = count;
  groupRow[FILTER_COUNT] = filteredCount;
}

export function leafRow(groupKey, [idx, key, ...data]) {
  // TODO find fastest way to do this
  const row = Array(metadataOffset).fill(0).concat(data);
  row[IDX] = idx;
  row[KEY] = `${groupKey}${GROUP_KEY_DELIMITER}${key}`;
  row[IS_LEAF] = true;
  return row;
}
