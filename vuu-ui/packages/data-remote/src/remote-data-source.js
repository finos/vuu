import { createLogger, DataTypes, EventEmitter, logColor, uuid } from '@vuu-ui/utils';
import { msgType as Msg } from './constants';

import { ConnectionManager } from './connection-manager';

const { ROW_DATA } = DataTypes;

const logger = createLogger('RemoteDataSource', logColor.blue);

export const AvailableProxies = {
  Viewserver: 'viewserver',
  Vuu: 'vuu'
};

const NullServer = {
  handleMessageFromClient: (message) =>
    console.log(`%cNullServer.handleMessageFromClient ${JSON.stringify(message)}`, 'color:red')
};

const defaultRange = { lo: 0, hi: 0 };

/*-----------------------------------------------------------------
 A RemoteDataView manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
export default class RemoteDataSource extends EventEmitter {
  constructor({
    bufferSize = 100,
    aggregations,
    columns,
    filter,
    group,
    sort,
    tableName,
    configUrl,
    serverName,
    serverUrl,
    viewport,
    'visual-link': visualLink
  }) {
    super();
    this.bufferSize = bufferSize;
    this.tableName = tableName;
    this.columns = columns;
    this.subscription = null;
    this.viewport = viewport;

    this.server = NullServer;
    this.url = serverUrl || configUrl;
    this.serverName = serverName;
    this.visualLink = visualLink;

    this.filterDataCallback = null;
    this.filterDataMessage = null;
    this.status = 'initialising';
    this.remoteId = null;
    this.disabled = false;
    this.suspended = false;

    this.initialGroup = group;
    this.initialSort = sort;
    this.initialFilter = filter;
    this.initialAggregations = aggregations;

    this.rowCount = 0;

    if (tableName.table === 'instruments') {
      this.initialAggregations = [{ column: 'lotSize', aggType: 3 }];
    }

    if (!serverUrl && !configUrl) {
      throw Error('RemoteDataSource expects serverUrl or configUrl');
    }

    this.server = null;
    this.pendingServer = ConnectionManager.connect(this.url, this.serverName);
  }

  async subscribe(
    {
      viewport = this.viewport ?? uuid(),
      tableName = this.tableName,
      columns = this.columns || [],
      aggregations = this.initialAggregations,
      range = defaultRange,
      sort = this.initialSort,
      groupBy = this.initialGroup,
      filter = this.initialFilter
    },
    callback
  ) {
    if (!tableName) throw Error('RemoteDataSource subscribe called without table name');

    this.clientCallback = callback;

    if (this.status !== 'initialising') {
      //TODO check if subscription details are still the same
      return;
    }

    // console.log(
    //   `%c[remoteDataSource] ${this.viewport} subscribe status ${this.status}`,
    //   'color:green;font-weight: bold;'
    // );

    this.status = 'subscribing';
    this.viewport = viewport;
    this.tableName = tableName;
    this.columns = columns;

    this.server = await this.pendingServer;

    const { bufferSize } = this;
    this.server.subscribe(
      {
        viewport,
        tablename: tableName,
        columns,
        aggregations,
        range,
        sort,
        groupBy,
        filter,
        bufferSize,
        visualLink: this.visualLink
      },
      this.handleMessageFromServer
    );
  }

  handleMessageFromServer = (message) => {
    if (message.dataType === DataTypes.FILTER_DATA) {
      this.filterDataCallback(message);
    } else if (message.type === 'subscribed') {
      this.status = 'subscribed';
      this.serverViewportId = message.serverViewportId;
      this.emit('subscribed', message);
      const { viewportId, ...rest } = message;
      this.clientCallback(rest);
    } else if (message.type === 'disabled') {
      this.status = 'disabled';
    } else if (message.type === 'enabled') {
      this.status = 'enabled';
    } else {
      if (
        message.type === 'viewport-update' &&
        message.size !== undefined &&
        message.size !== this.rowCount
      ) {
        this.rowCount = message.size;
      }
      this.clientCallback(message);
    }
  };

  unsubscribe() {
    if (!this.disabled && !this.suspended) {
      logger.log(
        `unsubscribe from ${
          this.tableName ? JSON.stringify(this.tableName) : 'no table'
        } (viewport ${this?.viewport})`
      );
      this.server?.unsubscribe(this.viewport);
      this.server?.destroy();
    }
  }

  suspend() {
    this.suspended = true;
    this.server.send({
      viewport: this.viewport,
      type: Msg.suspend
    });
    return this;
  }

  resume() {
    if (this.suspended) {
      // should we await this ?s
      this.server.send({
        viewport: this.viewport,
        type: Msg.resume
      });
      this.suspended = false;
    }
    return this;
  }

  disable() {
    this.status = 'disabling';
    this.disabled = true;
    this.server.send({
      viewport: this.viewport,
      type: Msg.disable
    });
    return this;
  }

  enable() {
    if (this.disabled) {
      this.status = 'enabling';
      // should we await this ?s
      this.server.send({
        viewport: this.viewport,
        type: Msg.enable
      });
      this.disabled = false;
    }
    return this;
  }

  setColumns(columns) {
    this.columns = columns;
    return this;
  }

  setSubscribedColumns(columns) {
    if (
      columns.length !== this.columns.length ||
      !columns.every((columnName) => this.columns.includes(columnName))
    ) {
      this.columns = columns;
      // ???
    }
  }

  setRange(lo, hi, dataType = ROW_DATA) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.setViewRange,
      range: { lo, hi },
      dataType
    });
  }

  select(selected, dataType = ROW_DATA) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.select,
      selected,
      dataType
    });
  }

  selectAll(dataType = ROW_DATA) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.selectAll,
      dataType
    });
  }

  selectNone(dataType = ROW_DATA) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.selectNone,
      dataType
    });
  }

  filter(filter, dataType = ROW_DATA) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.filter,
      filter,
      dataType
    });
  }

  aggregate(aggregations, dataType = ROW_DATA) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.aggregate,
      aggregations,
      dataType
    });
  }

  filterQuery(filter) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.filterQuery,
      filter
    });
  }

  openTreeNode(key) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.openTreeNode,
      key
    });
  }

  closeTreeNode(key) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.closeTreeNode,
      key
    });
  }

  group(columns) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.groupBy,
      groupBy: columns
    });
  }

  setGroupState(groupState) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.setGroupState,
      groupState
    });
  }

  sort(columns) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.sort,
      sortCriteria: columns
    });
  }

  getFilterData(column, searchText) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.getFilterData,
      column,
      searchText
    });
  }

  createLink({ parentVpId, link: { fromColumn, toColumn } }) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.createLink,
      parentVpId: parentVpId,
      childVpId: this.serverViewportId,
      parentColumnName: toColumn,
      childColumnName: fromColumn
    });
  }

  async rpcCall(options) {
    return this.server?.rpcCall({
      viewport: this.viewport,
      ...options
    });
  }

  subscribeToFilterData(column, range, callback) {
    logger.log(`<subscribeToFilterData> ${column.name}`);
    this.filterDataCallback = callback;
    this.getFilterData(column, range);

    // this.setFilterRange(range.lo, range.hi);
    // if (this.filterDataMessage) {
    //   callback(this.filterDataMessage);
    //   // do we need to nullify now ?
    // }
  }

  unsubscribeFromFilterData() {
    logger.log(`<unsubscribeFromFilterData>`);
    this.filterDataCallback = null;
  }

  // // To support multiple open filters, we need a column here
  // setFilterRange(lo, hi) {
  //   console.log(`setFilerRange ${lo}:${hi}`)
  //   this.server.send({
  //     viewport: this.viewport,
  //     type: Msg.setViewRange,
  //     dataType: DataTypes.FILTER_DATA,
  //     range: { lo, hi }
  //   })

  // }
}
