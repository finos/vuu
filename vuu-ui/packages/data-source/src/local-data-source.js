import { createLogger, DataTypes, EventEmitter, logColor } from '@vuu-ui/utils';
import { DataStore, Table } from '@vuu-ui/data-store';
import LocalUpdateQueue from './local-update-queue';

const { ROW_DATA } = DataTypes;

const buildDataView = async (url) => {
  return import(/* webpackIgnore: true */ url).catch((err) =>
    console.log(`failed to load data at ${url} ${err}`)
  );
};

const loadData = (data) => {
  return data.constructor === Promise
    ? data.then((data) => ({ default: data }))
    : Promise.resolve({ default: data });
};

const logger = createLogger('LocalDataSource', logColor.blue);

export default class LocalDataSource extends EventEmitter {
  constructor({ bufferSize = 100, schema, data, primaryKey, dataUrl, tableName }) {
    super();

    this.bufferSize = bufferSize;
    this.columns = schema.columns;
    this.primaryKey = primaryKey;

    this.tableName = tableName;
    this.subscription = null;
    this.viewport = null;
    this.filterDataCallback = null;
    this.filterDataMessage = null;

    this.updateQueue = new LocalUpdateQueue();
    this.dataStore = null;
    this.clientCallback = null;

    this.pendingRangeRequest = null;
    this.pendingFilterColumn = null;
    this.pendingFilterRange = null;

    this.status = 'initialising';

    this.readyToSubscribe = new Promise((resolve) => {
      const eventualData = dataUrl
        ? buildDataView(dataUrl)
        : data
        ? loadData(data)
        : Promise.reject('bad params, LocalDataSource expects either data or a dataUrl');

      eventualData.then(({ default: data }) => {
        const table = new Table({ data, columns: schema.columns, primaryKey: this.primaryKey });
        this.dataStore = new DataStore(table, { columns: schema.columns }, this.updateQueue);
        this.status = 'ready';
        resolve();
      });
    });
  }

  async subscribe(
    {
      tableName = this.tableName,
      columns = this.columns,
      range
      // TODO support groupBy, sort etc
    },
    callback
  ) {
    if (!columns) throw Error('LocalDataView subscribe called without columns');

    await this.readyToSubscribe;

    // this only makes sense if a localdatasource can holdmore than one table - maybe ?
    this.tableName = tableName;
    this.clientCallback = callback;

    this.updateQueue.on(DataTypes.ROW_DATA, (evtName, message) => callback(message));

    if (this.pendingFilterColumn) {
      this.getFilterData(this.pendingFilterColumn, this.pendingFilterRange);
      this.pendingFilterColumn = null;
      this.pendingFilterRange = null;
    }

    callback({ type: 'subscribed', columns });

    if (range) {
      this.setRange(range.lo, range.hi);
    }
  }

  unsubscribe() {
    console.log('LocalDataSource unsubscribe');
    this.clientCallback = null;
    this.dataStore.destroy();
    this.updateQueue.removeAllListeners(DataTypes.ROW_DATA);
    this.dataStore = null;
  }

  subscribeToFilterData(column, range, callback) {
    this.clientFilterCallback = callback;
    this.getFilterData(column, range);
  }

  unsubscribeFromFilterData() {
    logger.log(`<unsubscribeFromFilterData>`);
    this.clientFilterCallback = null;
  }

  // Maybe we just need a modify subscription
  setSubscribedColumns(columns) {
    if (
      columns.length !== this.columns.length ||
      !columns.every((columnName) => this.columns.includes(columnName))
    ) {
      this.columns = columns;
      if (this.dataStore !== null) {
        this.dataStore.setSubscribedColumns(columns);
      }
    }
  }

  setRange(lo, hi, dataType = ROW_DATA) {
    if (this.dataStore === null) {
      this.pendingRangeRequest = [lo, hi, dataType];
    } else {
      // console.log(`%cLocalDataSource setRange ${lo} ${hi}`,'color:blue;font-weight:bold');
      const low = Math.max(0, lo - this.bufferSize);
      const high = hi + this.bufferSize;
      const result = this.dataStore.setRange({ lo: low, hi: high }, true, dataType);
      if (dataType === ROW_DATA) {
        this.clientCallback(result);
      } else {
        this.clientFilterCallback(result);
      }
    }
  }

  select(idx, rangeSelect, keepExistingSelection, dataType = ROW_DATA) {
    const result = this.dataStore.select(idx, rangeSelect, keepExistingSelection, dataType);
    dataType === ROW_DATA ? this.clientCallback(result) : this.clientFilterCallback(result);
  }

  selectAll(dataType = ROW_DATA) {
    const result = this.dataStore.selectAll(dataType);
    dataType === ROW_DATA ? this.clientCallback(result) : this.clientFilterCallback(result);
  }

  selectNone(dataType = ROW_DATA) {
    const result = this.dataStore.selectNone(dataType);
    dataType === ROW_DATA ? this.clientCallback(result) : this.clientFilterCallback(result);
  }

  filter(filter, dataType = ROW_DATA, incremental = false) {
    const [rowData, filterData] = this.dataStore.filter(filter, dataType, incremental);
    if (rowData) {
      this.clientCallback(rowData);
    }
    if (filterData && this.clientFilterCallback) {
      this.clientFilterCallback(filterData);
    }
  }

  group(columns) {
    this.emit('group', columns);
    if (this.clientCallback) {
      this.clientCallback(this.dataStore.groupBy(columns));
    } else if (this.dataStore) {
      this.dataStore.groupBy(columns);
    }
  }

  setGroupState(groupState) {
    if (this.clientCallback) {
      this.clientCallback(this.dataStore.setGroupState(groupState));
    } else if (this.dataStore) {
      this.dataStore.setGroupState(groupState);
    }
  }

  sort(columns) {
    this.emit('sort', columns);
    if (this.clientCallback) {
      this.clientCallback(this.dataStore.sort(columns));
    } else if (this.dataStore) {
      this.dataStore.sort(columns);
    }
  }

  getFilterData(column, range) {
    logger.log(`getFilterData column=${column.name} range ${JSON.stringify(range)}`);
    if (this.dataStore) {
      logger.log(`getFilterData, dataView exists`);
      const filterData = this.dataStore.getFilterData(column, range);
      this.clientFilterCallback(filterData);
    } else {
      this.pendingFilterColumn = column;
      this.pendingFilterRange = range;
    }
  }
}
