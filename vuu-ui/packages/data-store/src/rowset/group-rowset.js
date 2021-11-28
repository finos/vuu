import {
  ASC,
  mapSortCriteria,
  extendsFilter,
  functor as filterPredicate,
  metadataKeys
} from '@vuu-ui/utils';
import BaseRowSet from './rowSet';
import {
  expandRow,
  findSortedCol,
  findDoomedColumnDepths,
  findGroupPositions,
  getGroupStateChanges,
  groupbyExtendsExistingGroupby,
  groupbyReducesExistingGroupby,
  groupbySortReversed,
  groupRows,
  splitGroupsAroundDoomedGroup,
  lowestIdxPointer,
  GroupIdxTracker,
  SimpleTracker,
  getCount,
  aggregateGroup,
  findAggregatedColumns,
  adjustGroupIndices,
  adjustLeafIdxPointers,
  allGroupsExpanded
} from '../group-utils';
import { sortBy, sortPosition } from '../sort';
import GroupIterator from '../group-iterator';
import { NULL_RANGE } from '../range-utils';
import { leafRow } from '../group-utils';

const EMPTY_ARRAY = [];

export class GroupRowSet extends BaseRowSet {
  constructor(
    rowSet,
    columns,
    groupby,
    groupState,
    sortCriteria = null,
    filter = rowSet.currentFilter
  ) {
    super(rowSet.table, rowSet.baseOffset, rowSet.range);
    this.columns = columns;
    this.groupby = groupby;
    this.groupState = groupState;
    this.aggregations = [];
    this.currentLength = 0; // TODO
    this.groupRows = [];
    this.aggregatedColumn = {};

    this.collapseChildGroups = this.collapseChildGroups.bind(this);
    this.countChildGroups = this.countChildGroups.bind(this);

    columns.forEach((column) => {
      if (column.aggregate) {
        const key = rowSet.table.columnMap[column.name];
        this.aggregations.push([key, column.aggregate]); // why ?
        this.aggregatedColumn[key] = column.aggregate;
      }
    });
    this.expandedByDefault = false;
    this.sortCriteria = Array.isArray(sortCriteria) && sortCriteria.length ? sortCriteria : null;

    // can we lazily build the sortSet as we fetch data for the first time ?
    this.sortSet = rowSet.data.map((d, i) => i);
    // we will store an array of pointers to parent Groups.mirroring sequence of leaf rows
    this.rowParents = Array(rowSet.data.length);

    this.applyGroupby(groupby);

    const [navSet, IDX, COUNT] = this.selectNavigationSet(false);
    // TODO roll the IDX and COUNT overrides into meta
    this.iter = GroupIterator(this.groupRows, this.groupBy, navSet, this.data, IDX, COUNT);

    if (filter) {
      this.filter(filter);
    }
  }

  get length() {
    return this.currentLength;
  }
  get first() {
    return this.data[0];
  }
  get last() {
    return this.data[this.data.length - 1];
  }

  currentRange() {
    return this.setRange(this.range, false);
  }

  clearRange() {
    this.iter.clear();
    this.range = NULL_RANGE;
  }

  setSubscribedColumns(columns) {
    console.log(`GroupRowset setSubscribedColumns ${columns.join(',')}`);
  }

  setRange(range, useDelta = true) {
    // A common scenario, eg after groupBy or sort, reposition range at top of viewport
    if (useDelta === false && range.lo === 0) {
      this.clearRange();
    }

    const [rowsInRange, idx] =
      !useDelta && range.lo === this.range.lo && range.hi === this.range.hi
        ? this.iter.currentRange()
        : this.iter.setRange(range, useDelta);

    const filterCount = this.filterSet && metadataKeys.FILTER_COUNT;
    const rows = rowsInRange.map((row, i) => this.cloneRow(row, idx + i, filterCount));
    this.range = range;
    return {
      dataType: this.type,
      rows,
      range,
      size: this.currentLength,
      offset: this.offset,
      stats: undefined
    };
  }

  cloneRow(row, idx, FILTER_COUNT) {
    const { IDX, DEPTH, COUNT } = metadataKeys;
    const dolly = row.slice();
    dolly[IDX] = idx + this.offset;

    if (FILTER_COUNT && dolly[DEPTH] !== 0 && typeof dolly[FILTER_COUNT] === 'number') {
      dolly[COUNT] = dolly[FILTER_COUNT];
    }
    return dolly;
  }

  applyGroupby(groupby, rows = this.data) {
    const { columns } = this;
    this.groupRows.length = 0;
    const groupCols = mapSortCriteria(groupby, this.table.columnMap);
    this.groupRows = groupRows(rows, this.sortSet, columns, this.table.columnMap, groupCols, {
      groups: this.groupRows,
      rowParents: this.rowParents
    });
    this.currentLength = this.countVisibleRows(this.groupRows, this.groupBy);
  }

  groupBy(groupby) {
    if (groupbySortReversed(groupby, this.groupby)) {
      this.sortGroupby(groupby);
    } else if (groupbyExtendsExistingGroupby(groupby, this.groupby)) {
      this.extendGroupby(groupby);
      this.currentLength = this.countVisibleRows(
        this.groupRows,
        this.groupBy,
        this.filterSet !== null
      );
    } else if (groupbyReducesExistingGroupby(groupby, this.groupby)) {
      this.reduceGroupby(groupby);
      this.range = NULL_RANGE;
      this.iter.clear();
      this.currentLength = this.countVisibleRows(
        this.groupRows,
        this.groupBy,
        this.filterSet !== null
      );
    } else {
      this.applyGroupby(groupby);
    }

    this.iter.setGroupCount(groupby.length);
    this.groupby = groupby;
  }

  // User interaction will never produce more than one change, but programatic change might !
  //TODO if we have sortCriteria, apply to leaf rows as we expand
  setGroupState(groupState) {
    // onsole.log(`[groupRowSet.setGroupState] ${JSON.stringify(groupState,null,2)}`)
    const changes = getGroupStateChanges(groupState, this.groupState);
    changes.forEach(([key, , isExpanded]) => {
      const { groupRows } = this;
      if (key === '*') {
        this.toggleAll(isExpanded);
        this.currentLength = this.countVisibleRows(groupRows, this.groupBy, false);
      } else {
        const groupIdx = this.findGroupIdx(key);
        if (groupIdx !== -1) {
          if (isExpanded) {
            this.currentLength += this.expandGroup(groupIdx, groupRows);
          } else {
            this.currentLength -= this.collapseGroup(groupIdx, groupRows);
          }
        } else {
          console.warn(`setGroupState could not find row to toggle`);
        }
      }
    });
    this.groupState = groupState;
  }

  expandGroup(idx, groups) {
    return this.toggleGroup(idx, groups, this.countChildGroups);
  }

  collapseGroup(idx, groups) {
    return this.toggleGroup(idx, groups, this.collapseChildGroups);
  }

  toggleGroup(groupIdx, groupRows, processChildGroups) {
    const { COUNT, DEPTH, FILTER_COUNT, IS_EXPANDED } = metadataKeys;
    let adjustment = 0;
    const groupRow = groupRows[groupIdx];
    const depth = groupRow[DEPTH];
    const isExpanded = groupRow[IS_EXPANDED];
    const maxDepth = this.groupby.length;

    const useFilter = this.filterSet !== null;
    groupRow[IS_EXPANDED] = !isExpanded;
    if (depth === maxDepth) {
      const COUNT_IDX = useFilter ? FILTER_COUNT : COUNT;
      adjustment = groupRow[COUNT_IDX];
    } else {
      adjustment = processChildGroups(depth + 1, groupIdx + 1, groupRows, useFilter);
    }
    return adjustment;
  }

  countChildGroups(childDepth, startIdx, groupRows, useFilter) {
    const { DEPTH, FILTER_COUNT } = metadataKeys;
    let adjustment = 0;
    for (let i = startIdx; i < groupRows.length; i++) {
      const nextDepth = groupRows[i][DEPTH];
      if (nextDepth === childDepth) {
        if (!useFilter || groupRows[i][FILTER_COUNT] > 0) {
          adjustment += 1;
        }
      } else if (nextDepth < childDepth) {
        break;
      }
    }
    return adjustment;
  }

  collapseChildGroups(childDepth, startIdx, groupRows, useFilter) {
    const { DEPTH, FILTER_COUNT, IS_EXPANDED } = metadataKeys;
    let adjustment = 0;
    for (let i = startIdx; i < groupRows.length; i++) {
      const { [DEPTH]: nextDepth, [IS_EXPANDED]: isNextExpanded } = groupRows[i];
      if (nextDepth === childDepth) {
        if (!useFilter || groupRows[i][FILTER_COUNT] > 0) {
          adjustment += 1;
          if (isNextExpanded) {
            adjustment += this.collapseGroup(i, groupRows);
          }
        }
      } else if (nextDepth < childDepth) {
        break;
      }
    }
    return adjustment;
  }

  sort(sortCriteria) {
    const { groupRows: groups } = this;
    const { IDX, DEPTH, COUNT, IDX_POINTER } = metadataKeys;
    this.sortCriteria = Array.isArray(sortCriteria) && sortCriteria.length ? sortCriteria : null;

    const sortCols = mapSortCriteria(sortCriteria, this.table.columnMap);
    //TODO only need to handle visible rows
    for (let i = 0; i < groups.length; i++) {
      const groupRow = groups[i];
      const depth = groupRow[DEPTH];
      const count = groupRow[COUNT];
      const absDepth = Math.abs(depth);
      const sortIdx = groupRow[IDX_POINTER];
      if (absDepth === 1) {
        this.sortDataSubset(sortIdx, count, sortCols, IDX);
      }
    }
  }

  sortDataSubset(startIdx, length, sortCriteria, IDX) {
    const rows = [];
    for (let i = startIdx; i < startIdx + length; i++) {
      const rowIdx = this.sortSet[i];
      rows.push(this.data[rowIdx]);
    }
    rows.sort(sortBy(sortCriteria));
    for (let i = 0; i < rows.length; i++) {
      this.sortSet[i + startIdx] = rows[i][IDX];
    }
  }

  clearFilter(/*cloneChanges*/) {
    this.currentFilter = null;
    this.filterSet = null;
    // rebuild agregations for groups where filter count is less than count, remove filter count
    const { data: rows, groupRows, sortSet, columns } = this;
    const { COUNT, FILTER_COUNT, NEXT_FILTER_IDX } = metadataKeys;
    const maxDepth = this.groupby.length;
    const aggregations = findAggregatedColumns(columns, this.table.columnMap, this.groupby);

    for (let i = 0; i < groupRows.length; i++) {
      let groupRow = groupRows[i];
      if (typeof groupRow[FILTER_COUNT] === 'number' && groupRow[COUNT] > groupRow[FILTER_COUNT]) {
        aggregateGroup(groupRows, i, sortSet, rows, columns, aggregations, maxDepth);
        groupRow[FILTER_COUNT] = null;
        groupRow[NEXT_FILTER_IDX] = null;
      }
    }

    this.iter.setNavSet(this.selectNavigationSet(false));
    this.currentLength = this.countVisibleRows(groupRows, false);
  }

  filter(filter) {
    const extendsCurrentFilter = extendsFilter(this.currentFilter, filter);
    const fn = filter && filterPredicate(this.table.columnMap, filter);
    const { COUNT, DEPTH, PARENT_IDX, FILTER_COUNT, NEXT_FILTER_IDX } = metadataKeys;
    const { data: rows, groupRows: groups } = this;
    let [navSet, NAV_IDX, NAV_COUNT] = this.selectNavigationSet(
      extendsCurrentFilter && this.filterSet
    );
    const newFilterSet = [];

    for (let i = 0; i < groups.length; i++) {
      let groupRow = groups[i];
      const depth = groupRow[DEPTH];
      const count = getCount(groupRow, NAV_COUNT, COUNT);
      const absDepth = Math.abs(depth);

      if (absDepth === 1) {
        const sortIdx = groupRow[NAV_IDX];
        let rowCount = 0;

        for (let ii = sortIdx; ii < sortIdx + count; ii++) {
          const rowIdx = navSet[ii];
          const row = rows[rowIdx];
          const includerow = fn(row);
          if (includerow) {
            rowCount += 1;
            if (rowCount === 1) {
              groupRow[NEXT_FILTER_IDX] = newFilterSet.length;
            }
            newFilterSet.push(rowIdx);
          }
        }

        groupRow[FILTER_COUNT] = rowCount;
        let aggregations = EMPTY_ARRAY;
        // we cannot be sure what filter changes have taken effect, so we must recalculate aggregations
        if (this.aggregations.length) {
          aggregations = this.aggregations.map(([i, a]) => [i, a, 0]);
          const len = newFilterSet.length;
          for (let ii = len - rowCount; ii < len; ii++) {
            const rowIdx = newFilterSet[ii];
            const row = rows[rowIdx];
            for (let j = 0; j < aggregations.length; j++) {
              let [colIdx] = aggregations[j];
              aggregations[j][2] += row[colIdx];
            }
          }

          // 2) store aggregates at lowest level of the group hierarchy
          aggregations.forEach((aggregation) => {
            const [colIdx, type, sum] = aggregation;
            const dataIdx = colIdx + metadataKeys.count - 2; // <<<<<<<<<<<
            if (type === 'sum') {
              groupRow[dataIdx] = sum;
            } else if (type === 'avg') {
              groupRow[dataIdx] = sum / rowCount;
            }
          });
        }

        // update parent counts
        if (rowCount > 0) {
          let parentGroupRow = groupRow;
          while (parentGroupRow[PARENT_IDX] !== null) {
            groupRow = groups[parentGroupRow[PARENT_IDX]];

            aggregations.forEach((aggregation) => {
              const [colIdx, type, sum] = aggregation;
              const dataIdx = colIdx + metadataKeys.count - 2; // <<<<<<<<<<<
              if (type === 'sum') {
                parentGroupRow[dataIdx] += sum;
              } else if (type === 'avg') {
                const originalCount = parentGroupRow[FILTER_COUNT];
                const originalSum = originalCount * parentGroupRow[dataIdx];
                parentGroupRow[dataIdx] = (originalSum + sum) / (originalCount + rowCount);
              }
            });
            parentGroupRow[FILTER_COUNT] += rowCount;
          }
        }
      } else {
        // Higher-level group aggregations are calculated from lower level groups
        // initialize aggregated columns
        groupRow[FILTER_COUNT] = 0;
        this.aggregations.forEach((aggregation) => {
          const [colIdx] = aggregation;
          const dataIdx = colIdx + metadataKeys.count - 2; // <<<<<<<<<<<
          groupRow[dataIdx] = 0;
        });
      }
    }
    this.filterSet = newFilterSet;
    this.currentFilter = filter;
    this.currentLength = this.countVisibleRows(this.groupRows, true);

    this.iter.setNavSet(this.selectNavigationSet(true));
  }

  update(rowIdx, updates) {
    const {
      groupRows: groups,
      offset,
      rowParents,
      range: { lo }
    } = this;
    const { COUNT, FILTER_COUNT, PARENT_IDX } = metadataKeys;

    let groupUpdates;
    const rowUpdates = [];

    for (let i = 0; i < updates.length; i += 3) {
      // the col mappings in updates refer to base column definitions
      const colIdx = updates[i];
      const dataIdx = colIdx + metadataKeys.count - 2; // <<<<<<<<<<<

      const originalValue = updates[i + 1];
      const value = updates[i + 2];
      rowUpdates.push(dataIdx, originalValue, value);

      let grpIdx = rowParents[rowIdx];
      // this seems to return 0 an awful lot
      let ii = 0;

      // If this column is being aggregated
      if (this.aggregatedColumn[colIdx]) {
        groupUpdates = groupUpdates || [];
        // collect adjusted aggregations for each group level
        do {
          let groupRow = groups[grpIdx];
          let originalGroupValue = groupRow[dataIdx];
          const diff = value - originalValue;
          const type = this.aggregatedColumn[colIdx];
          if (type === 'sum') {
            // ... wnd in the groupRow we have a further offset of 2 ...
            groupRow[dataIdx] += diff; // again with the +2
          } else if (type === 'avg') {
            const count = getCount(groupRow, FILTER_COUNT, COUNT);
            groupRow[dataIdx] = (groupRow[dataIdx] * count + diff) / count;
          }

          (groupUpdates[ii] || (groupUpdates[ii] = [grpIdx])).push(
            dataIdx,
            originalGroupValue,
            groupRow[dataIdx]
          );

          grpIdx = groupRow[PARENT_IDX];
          ii += 1;
        } while (grpIdx !== null);
      }
    }

    const outgoingUpdates = [];
    // check rangeIdx for both row and group updates, if they are not in range, they have not been
    // sent to client and do not need to be added to outgoing updates
    if (groupUpdates) {
      // the groups are currently in reverse order, lets send them out outermost group first
      for (let i = groupUpdates.length - 1; i >= 0; i--) {
        const [grpIdx, ...updates] = groupUpdates[i];
        // won't work - need to chnage groupIterator
        const rangeIdx = this.iter.getRangeIndexOfGroup(grpIdx);
        if (rangeIdx !== -1) {
          outgoingUpdates.push([lo + rangeIdx + offset, ...updates]);
        }
      }
    }
    const rangeIdx = this.iter.getRangeIndexOfRow(rowIdx);
    if (rangeIdx !== -1) {
      // onsole.log(`[GroupRowSet.update] updates for row idx ${idx} ${rangeIdx+offset} ${JSON.stringify(rowUpdates)}`)
      outgoingUpdates.push([lo + rangeIdx + offset, ...rowUpdates]);
    }

    return outgoingUpdates;
  }

  insert(newRowIdx, row) {
    // TODO look at append and idx manipulation for insertion at head.
    const { groupRows: groups, groupby, data: rows, sortSet, columns, iter: iterator } = this;

    let dataGroupCols = mapSortCriteria(groupby, this.table.columnMap, metadataKeys.count - 2); // <<<<<<<<<
    const groupPositions = findGroupPositions(groups, dataGroupCols, leafRow(row));

    const { IDX, COUNT, KEY, IDX_POINTER } = metadataKeys;
    const GROUP_KEY_SORT = [[KEY, 'asc']];
    const allGroupsExist = groupPositions.length === groupby.length;
    const noGroupsExist = groupPositions.length === 0;
    const someGroupsExist = !noGroupsExist && !allGroupsExist;
    let result;
    let newGroupIdx = null;

    if (allGroupsExist) {
      // all necessary groups are already in place, we will just insert a row and update counts/aggregates
      let grpIdx = groupPositions[groupPositions.length - 1];
      const groupRow = groups[grpIdx];
      this.rowParents[newRowIdx] = grpIdx;
      let count = groupRow[COUNT];

      const insertionPoint = groupRow[IDX_POINTER] + count;
      // all existing pointers from the insertionPoint forward are going to be displaced by +1
      adjustLeafIdxPointers(groups, insertionPoint);
      sortSet.splice(insertionPoint, 0, row[IDX]);
      if (allGroupsExpanded(groups, groupRow)) {
        this.currentLength += 1;
      }
    } else {
      let groupCols = mapSortCriteria(groupby, this.table.columnMap);
      newGroupIdx = sortPosition(
        groups,
        sortBy(GROUP_KEY_SORT),
        expandRow(groupCols, row, metadataKeys),
        'last-available'
      );
      sortSet.push(newRowIdx);
      let nestedGroups, baseGroupby, rootIdx;

      if (someGroupsExist) {
        baseGroupby = groupCols.slice(0, groupPositions.length);
        rootIdx = groups[groupPositions[groupPositions.length - 1]][IDX];
        groupCols = groupCols.slice(groupPositions.length);
      }

      nestedGroups = groupRows(rows, sortSet, columns, this.table.columnMap, groupCols, {
        startIdx: sortSet.length - 1,
        length: 1,
        groupIdx: newGroupIdx - 1,
        baseGroupby,
        rootIdx
      });

      adjustGroupIndices(groups, newGroupIdx, nestedGroups.length);
      groups.splice.apply(groups, [newGroupIdx, 0].concat(nestedGroups));
    }

    // Note: we update the aggregates
    this.updateAggregatedValues(groupPositions, row);
    this.incrementGroupCounts(groupPositions);

    iterator.refresh(); // force iterator to rebuild rangePositions
    let rangeIdx = allGroupsExist
      ? iterator.getRangeIndexOfRow(newRowIdx)
      : iterator.getRangeIndexOfGroup(newGroupIdx);

    if (rangeIdx !== -1) {
      // New row is visible within viewport so we will force render all rows
      result = { replace: true };
      if (newGroupIdx !== null) {
        this.currentLength += 1;
      }
    } else if (noGroupsExist === false) {
      // new row is not visible as group is collapsed, but we need to update groiup row(s)
      result = { updates: this.collectGroupUpdates(groupPositions) };
    }

    return result;
  }

  incrementGroupCounts(groupPositions) {
    const { groupRows } = this;
    const { COUNT } = metadataKeys;
    groupPositions.forEach((grpIdx) => {
      const group = groupRows[grpIdx];
      group[COUNT] += 1;
    });
  }

  updateAggregatedValues(groupPositions, row) {
    const { groupRows } = this;

    groupPositions.forEach((grpIdx) => {
      const groupRow = groupRows[grpIdx];
      for (let [colIdx, type] of this.aggregations) {
        const value = row[colIdx];
        const dataIdx = colIdx + metadataKeys.count - 2; // <<<<<<<<<<<
        const groupValue = groupRow[dataIdx];
        if (type === 'sum') {
          groupRow[dataIdx] = groupValue + value;
        } else if (type === 'avg') {
          const originalCount = groupRow[metadataKeys.COUNT]; // do we need to consider the FILTER_COUNT ?
          const originalSum = originalCount * groupRow[dataIdx];
          groupRow[dataIdx] = (originalSum + value) / (originalCount + 1);
        }
      }
    });
  }

  collectGroupUpdates(groupPositions) {
    const { aggregations, groupRows: groups, offset } = this;
    const { COUNT } = metadataKeys;
    const updates = [];
    for (let grpIdx of groupPositions) {
      const rangeIdx = this.iter.getRangeIndexOfGroup(grpIdx);
      if (rangeIdx !== -1) {
        const group = groups[grpIdx];
        const update = [rangeIdx + offset, COUNT, group[COUNT]];
        for (let [colIdx] of aggregations) {
          const dataIdx = colIdx + metadataKeys.count - 2; // <<<<<<<<<<<
          update.push(dataIdx, group[dataIdx]);
        }
        updates.push(update);
      }
    }
    return updates;
  }

  // start with a simplesequential search
  findGroupIdx(groupKey) {
    const { groupRows } = this;
    for (let i = 0; i < groupRows.length; i++) {
      if (groupRows[i][metadataKeys.KEY] === groupKey) {
        return i;
      }
    }
    return -1;
  }

  //TODO simple implementation first
  toggleAll(isExpanded) {
    const sign = isExpanded ? 1 : -1;
    // iterate groupedRows and make every group row depth positive,
    // Then visible rows is not going to be different from grouped rows
    const { DEPTH } = metadataKeys;
    const { groupRows: groups } = this;
    this.expandedByDefault = isExpanded;
    for (let i = 0, len = groups.length; i < len; i++) {
      const depth = groups[i][DEPTH];
      // if (depth !== 0) {
      groups[i][DEPTH] = Math.abs(depth) * sign;
      // }
    }
  }

  sortGroupby(groupby) {
    const { IDX, KEY, DEPTH, IDX_POINTER, PARENT_IDX } = metadataKeys;
    const { groupRows } = this;
    const groupCols = mapSortCriteria(groupby, this.table.columnMap, metadataKeys.count - 2);
    const [colIdx, depth] = findSortedCol(groupby, this.groupby);
    let count = 0;
    let i = 0;
    for (; i < groupRows.length; i++) {
      if (Math.abs(groupRows[i][DEPTH]) > depth) {
        if (count > 0) {
          this.sortGroupRowsSubset(groupCols, colIdx, i - count, count);
          count = 0;
        }
      } else {
        count += 1;
      }
    }

    this.sortGroupRowsSubset(groupCols, colIdx, i - count, count);

    const tracker = new SimpleTracker(groupby.length);
    this.groupRows.forEach((groupRow, i) => {
      const depth = groupRow[DEPTH];
      const groupKey = groupRow[KEY];
      const absDepth = Math.abs(depth);
      tracker.set(absDepth, i, groupKey);
      groupRow[IDX] = i;
      if (absDepth > 1) {
        groupRow[IDX_POINTER] = i + 1;
      }
      if (tracker.hasParentPos(absDepth)) {
        groupRow[PARENT_IDX] = tracker.parentPos(absDepth);
      }
    });
  }

  sortGroupRowsSubset(groupby, colIdx, startPos = 0, length = this.groupRows.length) {
    const { groupRows } = this;
    let insertPos = startPos + length;
    const [groupColIdx, direction] = groupby[colIdx];
    const before = (k1, k2) => (direction === ASC ? k2 > k1 : k1 > k2);
    const after = (k1, k2) => (direction === ASC ? k2 < k1 : k1 < k2);
    let currentKey = null;
    for (let i = startPos; i < startPos + length; i++) {
      const key = groupRows[i][groupColIdx];
      if (currentKey === null) {
        currentKey = key;
      } else if (before(key, currentKey)) {
        const splicedRows = groupRows.splice(startPos, i - startPos);
        insertPos -= splicedRows.length;
        groupRows.splice.apply(groupRows, [insertPos, 0].concat(splicedRows));
        currentKey = key;
        i = startPos - 1;
      } else if (after(key, currentKey)) {
        break;
      }
    }
  }

  // there is a current assumption here that new col(s) are always added at the end of existing cols in the groupBy
  // Need to think about a new col inserted at start or in between existing cols
  //TODO we might want to do this on expanded nodes only and repat in a lazy fashion as more nodes are revealed
  extendGroupby(groupby) {
    const groupCols = mapSortCriteria(groupby, this.table.columnMap);
    const baseGroupCols = groupCols.slice(0, this.groupby.length);
    const newGroupbyClause = groupCols.slice(this.groupby.length);
    const {
      groupRows: groups,
      groupby: baseGroupby,
      data: rows,
      columns,
      sortSet,
      filterSet
    } = this;
    const { IDX_POINTER, PARENT_IDX, NEXT_FILTER_IDX } = metadataKeys;
    const baseLevels = baseGroupby.length;
    const tracker = new GroupIdxTracker(baseLevels - 1);
    const filterFn = this.currentFilter
      ? filterPredicate(this.table.columnMap, this.currentFilter)
      : null;

    // we are going to insert new rows into groupRows and update the PARENT_IDX pointers in data rows
    for (let i = 0; i < groups.length; i++) {
      const groupRow = groups[i];
      if (tracker.idxAdjustment) {
        groupRow[metadataKeys.IDX] += tracker.idxAdjustment;
      }

      const rootIdx = groupRow[metadataKeys.IDX];
      const depth = groupRow[metadataKeys.DEPTH];
      const length = groupRow[metadataKeys.COUNT];
      const groupKey = groupRow[metadataKeys.KEY];

      const filterLength = groupRow[metadataKeys.FILTER_COUNT];
      const filterIdx = groupRow[NEXT_FILTER_IDX];
      groupRow[metadataKeys.NEXT_FILTER_IDX] = undefined;

      if (tracker.hasPrevious(depth + 1)) {
        groupRow[PARENT_IDX] += tracker.previous(depth + 1);
      }

      if (depth === baseLevels) {
        const startIdx = groupRow[IDX_POINTER];
        const nestedGroupRows = groupRows(
          rows,
          sortSet,
          columns,
          this.table.columnMap,
          newGroupbyClause,
          {
            depth: depth + 1,
            startIdx,
            length,
            rootIdx,
            baseGroupby: baseGroupCols,
            groupIdx: rootIdx,
            filterIdx,
            filterLength,
            filterSet,
            filterFn,
            rowParents: this.rowParents
          }
        );
        const nestedGroupCount = nestedGroupRows.length;
        // this might be a performance problem for large arrays, might need to concat
        groups.splice(i + 1, 0, ...nestedGroupRows);
        i += nestedGroupCount;
        tracker.increment(nestedGroupCount);
      } else {
        tracker.set(depth, groupKey);
      }
      // This has to be a pointer into sortSet NOT rows
      groupRow[IDX_POINTER] = rootIdx + 1;
    }
  }

  reduceGroupby(groupby) {
    const { groupRows: groups, filterSet } = this;
    const [doomed] = findDoomedColumnDepths(groupby, this.groupby);
    const groupCols = mapSortCriteria(this.groupby, this.table.columnMap);
    const [lastGroupIsDoomed, baseGroupby, addGroupby] = splitGroupsAroundDoomedGroup(
      groupCols,
      doomed
    );
    const { IDX, DEPTH, KEY, IDX_POINTER, PARENT_IDX, NEXT_FILTER_IDX } = metadataKeys;
    const maxDepth = groupby.length;
    const tracker = new GroupIdxTracker(maxDepth);
    const useFilter = filterSet !== null;
    let currentGroupIdx = null;
    let i = 0;
    for (let len = groups.length; i < len; i++) {
      const groupRow = groups[i];
      const depth = groupRow[DEPTH];
      const groupKey = groupRow[KEY];

      if (depth === doomed) {
        this.reParentLeafRows(i, currentGroupIdx);
        groups.splice(i, 1);
        i -= 1;
        len -= 1;
        tracker.increment(1);
      } else {
        if (depth < doomed) {
          tracker.set(depth, groupKey);
          if (depth === doomed - 1) {
            if (lastGroupIsDoomed) {
              // our pointer will no longer be to a child group but (via the sortSet) to the data.
              // This can be taken from the first child group (which will be removed)
              groupRow[IDX_POINTER] = lowestIdxPointer(
                groups,
                IDX_POINTER,
                DEPTH,
                i + 1,
                depth + 1
              );
              groupRow[NEXT_FILTER_IDX] = useFilter
                ? lowestIdxPointer(groups, NEXT_FILTER_IDX, DEPTH, i + 1, depth + 1)
                : undefined;
            } else if (currentGroupIdx !== null) {
              const diff = this.regroupChildGroups(currentGroupIdx, i, baseGroupby, addGroupby);
              i -= diff;
              len -= diff;
              tracker.increment(diff);
            }
          }
          currentGroupIdx = i;
          if (tracker.hasPrevious(depth - 1)) {
            groupRow[PARENT_IDX] -= tracker.previous(depth - 1);
          }
        }
        if (tracker.idxAdjustment > 0) {
          groupRow[IDX] -= tracker.idxAdjustment;
          if (groupRow[DEPTH] < maxDepth) {
            groupRow[IDX_POINTER] -= tracker.idxAdjustment;
          }
        }
      }
    }
    if (!lastGroupIsDoomed) {
      // don't forget the final group ...
      this.regroupChildGroups(currentGroupIdx, i, baseGroupby, addGroupby);
    }
  }

  reParentLeafRows(groupIdx, newParentGroupIdx) {
    // TODO what about filterSet ?
    const { groupRows: groups, rowParents, sortSet } = this;
    const { IDX_POINTER, COUNT } = metadataKeys;
    const group = groups[groupIdx];
    const idx = group[IDX_POINTER];
    const count = group[COUNT];

    for (let i = idx; i < idx + count; i++) {
      const rowIdx = sortSet[i];
      rowParents[rowIdx] = newParentGroupIdx;
    }
  }

  regroupChildGroups(currentGroupIdx, nextGroupIdx, baseGroupby, addGroupby) {
    const { groupRows: groups, data: rows, columns } = this;
    const { COUNT, IDX_POINTER } = metadataKeys;
    const group = groups[currentGroupIdx];
    const length = group[COUNT];
    const startIdx = groups[currentGroupIdx + 1][IDX_POINTER];
    // We don't really need to go back to rows to regroup, we have partially grouped data already
    // we could perform the whole operation within groupRows
    const nestedGroupRows = groupRows(
      rows,
      this.sortSet,
      columns,
      this.table.columnMap,
      addGroupby,
      {
        startIdx,
        length,
        rootIdx: currentGroupIdx,
        baseGroupby,
        groupIdx: currentGroupIdx,
        rowParents: this.rowParents
      }
    );
    const existingChildNodeCount = nextGroupIdx - currentGroupIdx - 1;
    groups.splice(currentGroupIdx + 1, existingChildNodeCount, ...nestedGroupRows);
    group[IDX_POINTER] = currentGroupIdx + 1;
    return existingChildNodeCount - nestedGroupRows.length;
  }

  // Note: this assumes no leaf rows visible. Is that always valid ?
  // NOt after removing a groupBy ! Not after a filter
  countVisibleRows(groupRows, groupCount, usingFilter = false) {
    const { IS_EXPANDED, DEPTH, COUNT, FILTER_COUNT } = metadataKeys;
    let count = 0;
    for (let i = 0, len = groupRows.length; i < len; i++) {
      const zeroCount = usingFilter && groupRows[i][FILTER_COUNT] === 0;
      if (!zeroCount) {
        count += 1;
      }
      const { [IS_EXPANDED]: isExpanded, [DEPTH]: depth } = groupRows[i];
      if (!isExpanded || zeroCount) {
        while (i < len - 1 && Math.abs(groupRows[i + 1][DEPTH]) > depth) {
          i += 1;
        }
      } else if (depth === groupCount) {
        count += usingFilter ? groupRows[i][FILTER_COUNT] : groupRows[i][COUNT];
      }
    }
    return count;
  }
}
