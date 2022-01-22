import { KeySet } from './keyset';
import * as Message from './messages';
import { ArrayBackedMovingWindow } from './array-backed-moving-window';
import { getFullRange } from '@vuu-ui/utils/src/range-utils';
import { bufferBreakout } from './buffer-range';

const EMPTY_ARRAY = [];

const byRowIndex = ([index1], [index2]) => index1 - index2;
export class Viewport {
  constructor({
    viewport,
    tablename,
    aggregations,
    columns,
    range,
    bufferSize = 0,
    filter = '',
    sort = [],
    groupBy = [],
    visualLink
  }) {
    this.clientViewportId = viewport;
    this.table = tablename;
    this.status = '';
    this.disabled = false;
    this.suspended = false;
    this.aggregations = aggregations;
    this.columns = columns;
    this.clientRange = range;
    this.bufferSize = bufferSize;
    this.sort = {
      sortDefs: sort
    };
    this.groupBy = groupBy;
    this.filterSpec = {
      filter
    };
    this.isTree = false;
    this.dataWindow = undefined;
    this.rowCountChanged = false;
    this.keys = new KeySet(range);
    this.links = null;
    this.linkedParent = null;
    this.pendingLinkedParent = visualLink;
    this.pendingOperations = new Map();
    this.pendingRangeRequest = null;
    this.hasUpdates = false;
    this.holdingPen = [];
    this.selection = [];
    this.lastTouchIdx = null;
  }

  get hasUpdatesToProcess() {
    if (this.suspended) {
      return false;
    }
    return this.rowCountChanged || this.hasUpdates;
  }

  subscribe() {
    return {
      type: Message.CREATE_VP,
      table: this.table,
      range: getFullRange(this.clientRange, this.bufferSize),
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: this.filterSpec
    };
  }

  handleSubscribed({ viewPortId, aggregations, columns, table, range, sort, groupBy, filterSpec }) {
    this.serverViewportId = viewPortId;
    this.status = 'subscribed';
    this.aggregations = aggregations;
    this.columns = columns;
    this.table = table;
    this.range = range;
    this.sort = sort;
    this.groupBy = groupBy;
    this.filterSpec = filterSpec;
    this.isTree = groupBy && groupBy.length > 0;
    this.dataWindow = new ArrayBackedMovingWindow(this.clientRange, range, this.bufferSize);

    console.log(
      `%cViewport subscribed
        clientVpId: ${this.clientViewportId}
        serverVpId: ${this.serverViewportId}
        table: ${this.table}
        aggregations: ${JSON.stringify(aggregations)}
        columns: ${columns.join(',')}
        range: ${JSON.stringify(range)}
        sort: ${JSON.stringify(sort)}
        groupBy: ${JSON.stringify(groupBy)}
        filterSpec: ${JSON.stringify(filterSpec)}
        bufferSize: ${this.bufferSize}
      `,
      'color: blue'
    );

    return {
      type: 'subscribed',
      clientViewportId: this.clientViewportId,
      columns
    };
  }

  awaitOperation(requestId, type) {
    //TODO set uip a timeout mechanism here
    this.pendingOperations.set(requestId, type);
  }

  // Return a message if we need to communicate this to client UI
  completeOperation(requestId, ...params) {
    const { clientViewportId, pendingOperations } = this;
    const { type, data } = pendingOperations.get(requestId);
    pendingOperations.delete(requestId);
    if (type === Message.CHANGE_VP_RANGE) {
      const [from, to] = params;
      this.dataWindow.setRange(from, to);
      //this.hasUpdates = true; // is this right ??????????
      this.pendingRangeRequest = null;
    } else if (type === 'groupBy') {
      this.isTree = true;
      this.groupBy = data;
      return { clientViewportId, type, groupBy: data };
    } else if (type === 'groupByClear') {
      this.isTree = false;
      this.groupBy = [];
      return { clientViewportId, type: 'groupBy', groupBy: null };
    } else if (type === 'filter') {
      this.filterSpec = { filter: data.filterQuery };
      return { clientViewportId, type, ...data };
    } else if (type === 'aggregate') {
      this.aggregations = data;
      return { clientViewportId, type, aggregations: data };
    } else if (type === 'sort') {
      this.sort = { sortDefs: data };
      return { clientViewportId, type, sort: data };
    } else if (type === 'selection') {
      // should we do this here ?
      // this.selection = data;
    } else if (type === 'disable') {
      this.disabled = true; // assuming its _SUCCESS, of course
      return {
        type: 'disabled',
        clientViewportId
      };
    } else if (type === 'enable') {
      this.disabled = false;
      return {
        type: 'enabled',
        clientViewportId
      };
    } else if (type === Message.CREATE_VISUAL_LINK) {
      const [colName, parentViewportId, parentColName] = params;
      this.linkedParent = {
        colName,
        parentViewportId,
        parentColName
      };
      this.pendingLinkedParent = null;
      return {
        type: 'visual-link-created',
        clientViewportId,
        colName,
        parentViewportId,
        parentColName
      };
    }
  }

  rangeRequest(requestId, from, to) {
    // If we can satisfy the range request from the buffer, we will.
    // May or may not need to make a server request, depending on status of buffer
    const type = Message.CHANGE_VP_RANGE;
    // If dataWindow has all data for the new range, it will return the
    // delta of rows which are in the new range but were not in the
    // previous range.
    // Note: what if it doesn't have the entire range but DOES have all
    // rows that constitute the delta ? Is this even possible ?
    const [serverDataRequired, clientRows, holdingRows] = this.dataWindow.setClientRange(from, to);
    const serverRequest =
      serverDataRequired && bufferBreakout(this.pendingRangeRequest, from, to, this.bufferSize)
        ? {
            type,
            viewPortId: this.serverViewportId,
            ...getFullRange({ lo: from, hi: to }, this.bufferSize, this.dataWindow.rowCount)
          }
        : undefined;
    if (serverRequest) {
      // TODO check that there os not already a pending server request for more data
      this.awaitOperation(requestId, { type });
      this.pendingRangeRequest = serverRequest;
    }

    // always reset the keys here, even if we're not going to return rows immediately.
    this.keys.reset(this.dataWindow.clientRange);

    if (this.holdingPen.some(([index]) => index < from || index >= to)) {
      this.holdingPen = this.holdingPen.filter(([index]) => index >= from && index < to);
    }

    const toClient = this.isTree ? toClientRowTree(this.groupBy, this.columns) : toClientRow;

    if (holdingRows) {
      holdingRows.forEach((row) => {
        this.holdingPen.push(toClient(row, this.keys));
      });
    }

    if (clientRows) {
      return [serverRequest, clientRows.map((row) => toClient(row, this.keys))];
    } else {
      return [serverRequest];
    }
  }

  setLinks(links) {
    this.links = links;
    return [
      {
        type: 'VP_VISUAL_LINKS_RESP',
        links,
        clientViewportId: this.clientViewportId
      },
      this.pendingLinkedParent
    ];
  }

  setMenu(menu) {
    return {
      type: 'VIEW_PORT_MENUS_RESP',
      menu,
      clientViewportId: this.clientViewportId
    };
  }

  createLink(requestId, colName, parentVpId, parentColumnName) {
    const message = {
      type: Message.CREATE_VISUAL_LINK,
      parentVpId,
      childVpId: this.serverViewportId,
      parentColumnName,
      childColumnName: colName
    };
    this.awaitOperation(requestId, message);
    return message;
  }

  suspend() {
    this.suspended = true;
  }

  resume() {
    this.suspended = false;
    return this.currentData();
  }

  currentData() {
    const records = this.dataWindow.getData();
    const { keys } = this;
    const toClient = this.isTree ? toClientRowTree(this.groupBy, this.columns) : toClientRow;
    const out = [];
    for (let row of records) {
      if (row) {
        out.push(toClient(row, keys));
      }
    }
    return out;
  }

  enable(requestId) {
    this.awaitOperation(requestId, { type: 'enable' });
    return {
      type: Message.ENABLE_VP,
      viewPortId: this.serverViewportId
    };
  }

  disable(requestId) {
    this.awaitOperation(requestId, { type: 'disable' });
    return {
      type: Message.DISABLE_VP,
      viewPortId: this.serverViewportId
    };
  }

  filterRequest(requestId, filter, filterQuery) {
    this.awaitOperation(requestId, { type: 'filter', data: { filter, filterQuery } });
    return this.createRequest({ filterSpec: { filter: filterQuery } });
  }

  aggregateRequest(requestId, aggregations) {
    this.awaitOperation(requestId, { type: 'aggregate', data: aggregations });
    return this.createRequest({ aggregations });
  }

  sortRequest(requestId, sortDefs) {
    this.awaitOperation(requestId, { type: 'sort', data: sortDefs });
    return this.createRequest({ sort: { sortDefs } });
  }

  groupByRequest(requestId, groupBy = EMPTY_ARRAY) {
    const type = groupBy === EMPTY_ARRAY ? 'groupByClear' : 'groupBy';
    this.awaitOperation(requestId, { type, data: groupBy });
    return this.createRequest({ groupBy });
  }

  selectRequest(requestId, selection) {
    // TODO we need to do this in the client if we are to raise selection events
    // TODO is it right to set this here or should we wait for ACK from server ?
    this.awaitOperation(requestId, { type: 'selection', data: selection });
    return {
      type: Message.SET_SELECTION,
      vpId: this.serverViewportId,
      selection
    };
  }

  handleUpdate(updateType, rowIndex, row) {
    if (this.dataWindow.rowCount !== row.vpSize) {
      this.dataWindow.setRowCount(row.vpSize);
      this.rowCountChanged = true;
    }
    if (updateType === 'U') {
      // Update will return true if row was within client range
      if (this.dataWindow.setAtIndex(rowIndex, row)) {
        this.hasUpdates = true;
      }
    }
  }

  getNewRowCount = () => {
    if (this.rowCountChanged) {
      this.rowCountChanged = false;
      return this.dataWindow.rowCount;
    }
  };

  // This is called only after new data has been received from server - data
  // returned direcly from buffer does not use this.
  // If we have updates, but we don't yet have data for the full client range
  // in our buffer, store them in the holding pen. We know the remaining rows
  // have been requested and will arrive imminently. Soon as we receive data,
  // contents of holding pen plus additional rows received that fill the range
  // will be dispatched to client.
  // If we have any rows in the holding pen, and we now have a full set of
  // client data, make sure we empty the pen and send those rows to client,
  // along qith the new data.
  // TODO what if we're going backwards
  getClientRows(timeStamp) {
    if (this.hasUpdates) {
      const records = this.dataWindow.getData();
      const { keys } = this;
      const toClient = this.isTree ? toClientRowTree(this.groupBy, this.columns) : toClientRow;

      // NOte this should probably just check that we havs all client rows within range ?
      const clientRows = this.dataWindow.hasAllRowsWithinRange
        ? this.holdingPen.splice(0)
        : undefined;

      const out = clientRows || this.holdingPen;

      for (let row of records) {
        if (row && row.ts >= timeStamp) {
          out.push(toClient(row, keys));
        }
      }
      this.hasUpdates = false;

      // this only matters where we scroll backwards and have holdingPen data
      // should we test for that explicitly ?
      return clientRows && clientRows.sort(byRowIndex);
    }
  }

  createRequest(params) {
    return {
      type: Message.CHANGE_VP,
      viewPortId: this.serverViewportId,
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: this.filterSpec,
      ...params
    };
  }
}

const toClientRow = ({ rowIndex, rowKey, sel: isSelected, data }, keys) =>
  [rowIndex, keys.keyFor(rowIndex), true, null, null, 1, rowKey, isSelected].concat(data);

const toClientRowTree =
  (groupBy, columns) =>
  ({ rowIndex, rowKey, sel: isSelected, data }, keys) => {
    let [depth, isExpanded /* path */, , isLeaf /* label */, , count, ...rest] = data;

    // TODO do we need this - the data is already there
    const steps = rowKey.split('|').slice(1);
    groupBy.forEach((col, i) => {
      const idx = columns.indexOf(col);
      rest[idx] = steps[i];
    });

    const record = [
      rowIndex,
      keys.keyFor(rowIndex),
      isLeaf,
      isExpanded,
      depth,
      count,
      rowKey,
      isSelected
    ].concat(rest);

    return record;
  };
