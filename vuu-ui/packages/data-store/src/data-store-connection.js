import { AND, OR, EQUALS, GREATER_THAN, LESS_THAN, IN } from '@vuu-ui/utils/src/filter-utils';

import DataStore from './data-store';
import Table from './worker-table';
import { viewportChanges } from './data-store-utils';

const logger = console;

const OP_TO_FILTER_TYPE = {
  and: AND,
  or: OR,
  '=': EQUALS,
  '>': GREATER_THAN,
  '<': LESS_THAN,
  in: IN
};

const filterFromQuery = (filter) => {
  const { column, op, value, values, filters } = filter;
  if (filters) {
    return {
      type: OP_TO_FILTER_TYPE[op],
      filters: filters.map(filterFromQuery)
    };
  } else {
    return {
      type: OP_TO_FILTER_TYPE[op],
      colName: column,
      value,
      values
    };
  }
};

export default async function connectDataStore(connectionString, callback) {
  return makeConnection(connectionString, (msg) => {
    callback(msg);
  });
}

async function makeConnection(url, callback, connection) {
  callback({ type: 'connection-status', status: 'connecting' });
  const dataStore = await createDataStore(url);

  connection = new DataStoreConnection(dataStore, url, callback);
  const status = 'connected';
  callback({ type: 'connection-status', status });
  connection.status = status;
  return connection;
}

const createDataStore = async (url) => {
  console.log(`table config url ${url}`);
  const loadTableConfiguration = async () => await import(url);

  const { config } = await loadTableConfiguration();
  console.log(`got config ${JSON.stringify(config, null, 2)}`);
  const { generateData } = await import(config.dataUrl);
  const table = new Table(config);
  table.setData(generateData());
  return new DataStore(table, { columns: config.columns } /*, updateQueue*/);
};

class DataStoreConnection {
  constructor(dataStore, url, callback) {
    this.url = url;
    this.connectionCallback = callback;
    this.viewPortId = undefined;
    this.setDataStore(dataStore);
    this.status = 'ready';
    this.viewportMeta = null;
  }

  setDataStore(dataStore) {
    const { connectionCallback: callback } = this;

    const send = (msg, options) => {
      const { requestId, body } = msg;
      switch (body.type) {
        case 'CREATE_VP':
          {
            const viewPortId = (this.viewPortId = requestId);
            const { columns, filterSpec, groupBy, sort, range, table } = body;
            callback({
              requestId,
              body: {
                type: 'CREATE_VP_SUCCESS',
                viewPortId,
                columns,
                range,
                table
              }
            });
            const { rows, size: vpSize } = dataStore.setRange(
              { lo: range.from, hi: range.to },
              true
            );
            const ts = +new Date();
            callback({
              requestId: 'NA',
              body: {
                type: 'TABLE_ROW',
                timeStamp: ts,
                rows: [
                  {
                    viewPortId,
                    vpSize,
                    rowIndex: -1,
                    rowKey: 'SIZE',
                    updateType: 'SIZE',
                    sel: 0,
                    ts,
                    data: []
                  }
                ].concat(
                  rows.map(([rowIndex, , , , , , rowKey, sel, ...data]) => ({
                    viewPortId,
                    vpSize,
                    rowIndex,
                    rowKey,
                    updateType: 'U',
                    sel,
                    ts,
                    data
                  }))
                )
              }
            });
            this.viewportMeta = { columns, filterSpec, groupBy, sort };
          }
          break;

        case 'CHANGE_VP_RANGE':
          {
            const { from, to, viewPortId } = body;
            callback({
              requestId,
              body: { type: 'CHANGE_VP_RANGE_SUCCESS', viewPortId, from, to }
            });
            const { rows, size } = dataStore.setRange({ lo: from, hi: to }, true);
            if (dataStore.hasGroupBy) {
              callback(groupedRows(viewPortId, rows, size));
            } else {
              callback(leafRows(viewPortId, rows, size));
            }
          }
          break;

        case 'CHANGE_VP':
          {
            const { type, viewPortId, ...viewportMeta } = body;
            const diff = viewportChanges(this.viewportMeta, viewportMeta);
            this.viewportMeta = viewportMeta;
            callback({
              requestId,
              body: { type: 'CHANGE_VP_SUCCESS', viewPortId }
            });
            if (diff.filter) {
              const filter = filterFromQuery(options.filter);
              const [{ rows, size }] = dataStore.filter(filter);
              if (dataStore.hasGroupBy) {
                callback(groupedRows(viewPortId, rows, size));
              } else {
                callback(leafRows(viewPortId, rows, size));
              }
            } else if (diff.sort) {
              const sortCriteria = body.sort.sortDefs.map(({ column, sortType }) => [
                column,
                sortType === 'D' ? 'dsc' : 'asc'
              ]);
              const { rows, size } = dataStore.sort(sortCriteria);
              if (dataStore.hasGroupBy) {
                callback(groupedRows(viewPortId, rows, size));
              } else {
                callback(leafRows(viewPortId, rows, size));
              }
            } else if (diff.groupBy) {
              const { rows, size } = dataStore.groupBy(body.groupBy);
              if (body.groupBy.length > 0) {
                callback(groupedRows(viewPortId, rows, size));
              } else {
                callback(leafRows(viewPortId, rows, size));
              }
            }
          }
          break;

        case 'SET_SELECTION':
          {
            const { viewPortId } = this;
            const { rows } = dataStore.select(body.selection);
            callback(leafRows(viewPortId, rows));
          }
          break;

        case 'OPEN_TREE_NODE':
          {
            const { viewPortId } = this;
            const { rows, size } = dataStore.openTreeNode(body.treeKey);
            callback(groupedRows(viewPortId, rows, size));
          }
          break;
        case 'CLOSE_TREE_NODE':
          {
            const { viewPortId } = this;
            const { rows, size } = dataStore.closeTreeNode(body.treeKey);
            callback(groupedRows(viewPortId, rows, size));
          }
          break;

        default:
          logger.log(`Unknown message type from client ${body.type}`);
      }
    };

    this.send = send;

    const warn = (msg) => {
      logger.log(`Message cannot be sent, socket closed: ${msg.type}`);
    };

    this.close = () => {
      console.log('[Connection] close dataStoreConnection');
      this.status = 'closed';
      this.send = warn;
    };
  }
}

function leafRows(viewPortId, rows, size) {
  const ts = +new Date();
  return {
    requestId: 'NA',
    body: {
      type: 'TABLE_ROW',
      timeStamp: ts,
      rows: rows.map(([rowIndex, , , , , , rowKey, sel, ...data]) => ({
        viewPortId,
        vpSize: size,
        rowIndex,
        rowKey,
        updateType: 'U',
        sel,
        ts,
        data
      }))
    }
  };
}

function groupedRows(viewPortId, rows, size) {
  const ts = +new Date();
  return {
    requestId: 'NA',
    body: {
      type: 'TABLE_ROW',
      timeStamp: ts,
      rows: [
        {
          viewPortId,
          vpSize: size,
          rowIndex: -1,
          rowKey: 'SIZE',
          updateType: 'SIZE',
          sel: 0,
          ts,
          data: []
        }
      ].concat(
        rows.map(([rowIndex, , isLeaf, isExpanded, depth, count, rowKey, sel, ...data]) => ({
          viewPortId,
          vpSize: size,
          rowIndex,
          rowKey,
          updateType: 'U',
          sel,
          ts,
          data: [Math.abs(depth), isExpanded, rowKey, isLeaf, '', count, ...data]
        }))
      )
    }
  };
}
