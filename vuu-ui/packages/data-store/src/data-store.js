import { RowSet, GroupRowSet } from './rowset/index';
import { addFilter, DataTypes, IN, getFilterType, resetRange } from '@vuu-ui/utils';
import UpdateQueue from './update-queue';

const DEFAULT_INDEX_OFFSET = 0;
const WITH_STATS = true;
export default class DataStore {
  constructor(
    table,
    { columns = [], sortCriteria = null, groupBy = null, filter = null },
    updateQueue = new UpdateQueue()
  ) {
    this._table = table;
    this._index_offset = DEFAULT_INDEX_OFFSET;
    this._filter = filter;
    this._groupState = null;
    this._sortCriteria = sortCriteria;

    this.columns = columns;

    this._groupby = groupBy;
    this._update_queue = updateQueue;

    this.reset = this.reset.bind(this);
    this.rowUpdated = this.rowUpdated.bind(this);
    this.rowsUpdated = this.rowsUpdated.bind(this);
    this.rowInserted = this.rowInserted.bind(this);

    this.reset();

    table.on('ready', this.reset);
    table.on('rowUpdated', this.rowUpdated);
    table.on('rowsUpdated', this.rowsUpdated);
    table.on('rowInserted', this.rowInserted);
  }

  destroy() {
    this._table.removeListener('rowUpdated', this.rowUpdated);
    this._table.removeListener('rowInserted', this.rowInserted);
    this._table = null;
    this.rowSet = null;
    this.filterRowSet = null;
    this._update_queue = null;
  }

  get status() {
    return this._table.status;
  }

  get hasGroupBy() {
    return this._groupby?.length;
  }

  reset() {
    const { _table: table, _groupby: groupBy, rowSet } = this;

    let range = rowSet ? rowSet.range : null;

    // TODO we should pass yarn build into the rowset as it will be needed for computed columns
    this.rowSet = new RowSet(table, this.columns, this._index_offset);
    // Is one filterRowset enough, or should we manage one for each column ?
    this.filterRowSet = null;

    // What if data is BOTH grouped and sorted ...
    if (groupBy !== null) {
      // more efficient to compute this directly from the table projection
      this.rowSet = new GroupRowSet(this.rowSet, this.columns, this._groupby, this._groupState);
    } else if (this._sortCriteria !== null) {
      this.rowSet.sort(this._sortCriteria);
    }

    if (range) {
      const result = this.setRange(range, false);
      console.log(result);
      this._update_queue.replace(result);
    }
  }

  rowInserted(event, idx, row) {
    const { _update_queue, rowSet } = this;
    const { size = null, replace, updates } = rowSet.insert(idx, row);
    if (size !== null) {
      _update_queue.resize(size);
    }
    if (replace) {
      const { rows, size, offset } = rowSet.currentRange();
      _update_queue.replace({ rows, size, offset, filter: undefined, range: undefined });
    } else if (updates) {
      updates.forEach((update) => {
        _update_queue.update(update);
      });
    }
    // what about offset change only ?
  }

  rowUpdated(event, idx, updates) {
    const { rowSet, _update_queue } = this;
    const result = rowSet.update(idx, updates);

    if (result) {
      if (rowSet instanceof RowSet) {
        _update_queue.update(result);
      } else {
        result.forEach((rowUpdate) => {
          _update_queue.update(rowUpdate);
        });
      }
    }
  }

  rowsUpdated(event, updates, doNotPublish) {
    const { rowSet, _update_queue } = this;
    const results = [];
    for (let i = 0; i < updates.length; i++) {
      const [idx, ...updatedValues] = updates[i];
      const result = rowSet.update(idx, updatedValues);
      if (result) {
        if (rowSet instanceof RowSet) {
          results.push(result);
        } else {
          result.forEach((rowUpdate) => {
            results.push(rowUpdate);
          });
        }
      }
    }

    if (results.length > 0 && doNotPublish !== true) {
      _update_queue.update(results);
    }
  }

  getData(dataType) {
    return dataType === DataTypes.ROW_DATA
      ? this.rowSet
      : dataType === DataTypes.FILTER_DATA
      ? this.filterRowSet
      : null;
  }

  setSubscribedColumns(columns) {
    this.rowSet.setSubscribedColumns(columns);
  }

  //TODO we seem to get a setRange when we reverse sort order, is that correct ?
  setRange(range, useDelta = true, dataType = DataTypes.ROW_DATA) {
    return this.getData(dataType).setRange(range, useDelta);
  }

  select(selectedIndices, dataType = DataTypes.ROW_DATA) {
    const rowset = this.getData(dataType);
    return rowset.select(selectedIndices);
    // if (dataType === DataTypes.ROW_DATA){
    //     return this.selectResponse(updates, dataType, rowset);
    // } else {
    //     console.log(`[dataView] select on filterSet (range ${JSON.stringify(rowset.range)})`)
    // we need to handle this case here, as the filter we construct depends on the selection details
    // TODO we shouldn't be using the sortSet here, need an API method
    // const value = rowset.getSelectedValue(idx);
    // const isSelected = rowset.selected.rows.includes(idx);
    // const filter = {
    //     type: isSelected ? IN : NOT_IN,
    //     colName: rowset.columnName,
    //     values: [value]
    // }
    // this.applyFilterSetChangeToFilter(filter);

    // if (updates.length > 0){
    //     return {
    //         dataType,
    //         updates,
    //         stats: rowset.stats
    //     }
    // }
    // }
  }

  selectAll(dataType = DataTypes.ROW_DATA) {
    const rowset = this.getData(dataType);
    return this.selectResponse(rowset.selectAll(), dataType, rowset, true);
  }

  selectNone(dataType = DataTypes.ROW_DATA) {
    const rowset = this.getData(dataType);
    return this.selectResponse(rowset.selectNone(), dataType, rowset, false);
  }

  // Handle response to a selecAll / selectNode operation. This may be operating on
  // the entire resultset, or a filtered subset
  selectResponse(updates, dataType, rowset, allSelected) {
    const updatesInViewport = updates.length > 0;
    const { stats } = rowset;
    if (dataType === DataTypes.ROW_DATA) {
      if (updatesInViewport) {
        return { updates };
      }
    } else {
      const { totalSelected } = stats;

      // Maybe defer the filter operation ?
      if (totalSelected === 0) {
        this.applyFilterSetChangeToFilter({ colName: rowset.columnName, type: IN, values: [] });
        // } else if (totalSelected === totalRowCount) {
        //   this.applyFilterSetChangeToFilter({ colName: rowset.columnName, type: NOT_IN, values: [] });
      } else {
        // we are not operating on the whole dataset, therefore it is a filtered subset
        if (allSelected) {
          this.applyFilterSetChangeToFilter({
            colName: rowset.columnName,
            type: IN,
            values: rowset.values
          });
        }
      }

      // always return, as the stats might be needed
      // if (updatesInViewport){
      return {
        dataType,
        updates,
        stats: rowset.stats
      };
      // }
    }
  }

  sort(sortCriteria) {
    this._sortCriteria = sortCriteria;
    this.rowSet.sort(sortCriteria);
    // assuming the only time we would not useDelta is when we want to reset ?
    return this.setRange(resetRange(this.rowSet.range), false);
  }

  // filter may be called directly from client, in which case changes should be propagated, where
  // appropriate, to any active filterSet(s). However, if the filterset has been changed, e.g. selection
  // within a set, then filter applied here in consequence must not attempt to reset the same filterSet
  // that originates the change.
  filter(filter, dataType = 'rowData', incremental = false, ignoreFilterRowset = false) {
    if (dataType === DataTypes.FILTER_DATA) {
      return [undefined, this.filterFilterData(filter)];
    } else {
      if (incremental) {
        filter = addFilter(this._filter, filter);
      }
      const { rowSet, _filter, filterRowSet } = this;
      const { range } = rowSet;
      this._filter = filter;
      let filterResultset;

      if (filter === null && _filter) {
        rowSet.clearFilter();
      } else if (filter) {
        this.rowSet.filter(filter);
      } else {
        throw Error(`InMemoryView.filter setting null filter when we had no filter anyway`);
      }

      if (filterRowSet && dataType === DataTypes.ROW_DATA && !ignoreFilterRowset) {
        if (filter) {
          if (filterRowSet.type === DataTypes.FILTER_DATA) {
            filterResultset = filterRowSet.setSelectedFromFilter(filter);
          } else if (filterRowSet.type === DataTypes.FILTER_BINS) {
            this.filterRowSet = rowSet.getBinnedValuesForColumn({
              name: this.filterRowSet.columnName
            });
            filterResultset = this.filterRowSet.setRange();
          }
        } else {
          // TODO examine this. Must be a more efficient way to reset counts in filterRowSet
          const { columnName, range } = filterRowSet;
          this.filterRowSet = rowSet.getDistinctValuesForColumn({ name: columnName });
          filterResultset = this.filterRowSet.setRange(range, false);
        }
      }

      const resultSet = {
        ...this.rowSet.setRange(resetRange(range), false),
        filter
      };

      return filterResultset ? [resultSet, filterResultset] : [resultSet];
    }
  }

  //TODO merge with method above
  filterFilterData(filter) {
    const { filterRowSet } = this;
    if (filterRowSet) {
      if (filter === null) {
        filterRowSet.clearFilter();
      } else if (filter) {
        filterRowSet.filter(filter);
      }

      return filterRowSet.setRange(resetRange(filterRowSet.range), false, WITH_STATS);
    } else {
      console.error(`[InMemoryView] filterfilterRowSet no filterRowSet`);
    }
  }

  applyFilterSetChangeToFilter(partialFilter) {
    const [result] = this.filter(partialFilter, DataTypes.ROW_DATA, true, true);
    this._update_queue.replace(result);
  }

  applyFilter() {}

  groupBy(groupby) {
    const { rowSet, columns, _groupState, _sortCriteria, _groupby } = this;
    this._groupby = groupby;
    if (groupby.length === 0) {
      this.rowSet = RowSet.fromGroupRowSet(this.rowSet);
    } else {
      if (_groupby === null) {
        this.rowSet = new GroupRowSet(rowSet, columns, groupby, _groupState, _sortCriteria);
      } else {
        rowSet.groupBy(groupby);
      }
    }

    return this.rowSet.currentRange();
  }

  toggleGroupState(treeKey) {
    let groupState = { ...this._groupState };
    if (groupState[treeKey]) {
      delete groupState[treeKey];
    } else {
      groupState[treeKey] = true;
    }
    return groupState;
  }

  openTreeNode(treeKey) {
    const newGroupState = this.toggleGroupState(treeKey);
    return this.setGroupState(newGroupState);
  }

  closeTreeNode(treeKey) {
    const newGroupState = this.toggleGroupState(treeKey);
    return this.setGroupState(newGroupState);
  }

  setGroupState(groupState) {
    this._groupState = groupState;
    const { rowSet } = this;
    rowSet.setGroupState(groupState);

    return rowSet.setRange(rowSet.range, false);
  }

  get updates() {
    const {
      _update_queue,
      rowSet: { range }
    } = this;
    let results = {
      updates: _update_queue.popAll(),
      range: {
        lo: range.lo,
        hi: range.hi
      }
    };
    return results;
  }

  getFilterData(column, range) {
    const { rowSet, filterRowSet, _filter: filter } = this;
    // If our own dataset has been filtered by the column we want values for, we cannot use it, we have
    // to go back to the source, using a filter which excludes the one in place on the target column.
    const columnName = column.name;
    const colDef = this.columns.find((col) => col.name === columnName);
    // No this should be decided beforehand (on client)
    const type = getFilterType(colDef);

    if (type === 'number') {
      // // we need a notification from server to tell us when this is closed.
      // we should assign to filterRowset
      this.filterRowSet = rowSet.getBinnedValuesForColumn(column);
    } else if (!filterRowSet || filterRowSet.columnName !== column.name) {
      this.filterRowSet = rowSet.getDistinctValuesForColumn(column);
    } else if (filterRowSet && filterRowSet.columnName === column.name) {
      // if we already have the data for this filter, nothing further to do except reset the filterdata range
      // so next request will return full dataset.
      filterRowSet.setRange({ lo: 0, hi: 0 });
    }
    // If we already have a filterRowset for this column, but a filter on another column has changed, we need to
    // recreate the filterRowset: SHould this happen when filter happens ?

    if (filter) {
      this.filterRowSet.setSelectedFromFilter(filter);
    } else {
      this.filterRowSet.selectAll();
    }

    // do we need to returtn searchText ? If so, it should
    // be returned by the rowSet

    // TODO wrap this, we use it  alot
    return this.filterRowSet.setRange(range, false, WITH_STATS);
  }
}
