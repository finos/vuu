import { createLogger, DataTypes, EventEmitter, logColor, uuid } from '@vuu-ui/utils';
import { DataSource, DataSourceProps, SubscribeCallback, SubscribeProps } from './data-source';
import { VuuUIMessageIn } from './vuuUIMessageTypes';
import { VuuAggregation } from './vuuProtocolMessageTypes';

import { msgType as Msg } from './constants';

import { ConnectionManager } from './connection-manager';

const { ROW_DATA } = DataTypes;

const logger = createLogger('RemoteDataSource', logColor.blue);

export const AvailableProxies = {
  Vuu: 'vuu'
};

const NullServer = {
  handleMessageFromClient: (message: unknown) =>
    console.log(`%cNullServer.handleMessageFromClient ${JSON.stringify(message)}`, 'color:red')
};

const defaultRange = { lo: 0, hi: 0 };

export interface DataSourceColumn {}

/*-----------------------------------------------------------------
 A RemoteDataView manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
export default class RemoteDataSource extends EventEmitter implements DataSource {
  private bufferSize: number;
  private tableName: string;
  private columns: DataSourceColumn[];
  private viewport: string;
  private server: any;
  private url: string;
  private serverName: string;
  private visualLink: string;
  private status: string;
  private disabled: boolean;
  private suspended: boolean;
  private initialGroup: any;
  private initialSort: any;
  private initialFilter: any;
  private initialFilterQuery: any;
  private initialAggregations: any;
  private rowCount: number;
  private pendingServer: any;
  private clientCallback: any;
  // private serverViewportId?: string;

  constructor({
    bufferSize = 100,
    aggregations,
    columns,
    filter,
    filterQuery,
    group,
    sort,
    tableName,
    configUrl,
    serverName,
    serverUrl,
    viewport,
    'visual-link': visualLink
  }: DataSourceProps) {
    super();
    this.bufferSize = bufferSize;
    this.tableName = tableName;
    this.columns = columns;
    this.viewport = viewport;

    this.server = NullServer;
    this.url = serverUrl || configUrl;
    this.serverName = serverName;
    this.visualLink = visualLink;

    this.status = 'initialising';
    this.disabled = false;
    this.suspended = false;

    this.initialGroup = group;
    this.initialSort = sort;
    this.initialFilter = filter;
    this.initialFilterQuery = filterQuery;
    this.initialAggregations = aggregations;

    this.rowCount = 0;

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
      filter = this.initialFilter,
      filterQuery = this.initialFilterQuery
    }: SubscribeProps,
    callback: SubscribeCallback
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
        filterQuery,
        bufferSize,
        visualLink: this.visualLink
      },
      this.handleMessageFromServer
    );
  }

  handleMessageFromServer = (message: VuuUIMessageIn) => {
    if (message.type === 'subscribed') {
      this.status = 'subscribed';
      // this.serverViewportId = message.serverViewportId;
      this.emit('subscribed', message);
      const { clientViewportId, ...rest } = message;
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

  setColumns(columns: string[]) {
    this.columns = columns;
    return this;
  }

  setSubscribedColumns(columns: string[]) {
    if (
      columns.length !== this.columns.length ||
      !columns.every((columnName) => this.columns.includes(columnName))
    ) {
      this.columns = columns;
      // ???
    }
  }

  setRange(lo: number, hi: number) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.setViewRange,
      range: { lo, hi }
    });
  }

  select(selected: number[]) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.select,
      selected
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

  aggregate(aggregations: VuuAggregation[]) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.aggregate,
      aggregations
    });
  }

  // TODO we shouldn't have to parse the filter here, makes this package dependent on parsing package
  filter(filter: any, filterQuery: string) {
    console.log({ filter, filterQuery });
    this.server?.send({
      viewport: this.viewport,
      type: Msg.filterQuery,
      filter,
      filterQuery
    });
  }

  openTreeNode(key: string) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.openTreeNode,
      key
    });
  }

  closeTreeNode(key: string) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.closeTreeNode,
      key
    });
  }

  group(columns: string[]) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.groupBy,
      groupBy: columns
    });
  }

  // TODO columns cannot simply be strings
  sort(columns: string[]) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.sort,
      sortCriteria: columns
    });
  }

  getFilterData(column: string, searchText: string) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.getFilterData,
      column,
      searchText
    });
  }

  createLink({ parentVpId, link: { fromColumn, toColumn } }: any) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.createLink,
      parentVpId: parentVpId,
      // childVpId: this.serverViewportId,
      parentColumnName: toColumn,
      childColumnName: fromColumn
    });
  }

  async rpcCall(options: any) {
    return this.server?.rpcCall({
      viewport: this.viewport,
      ...options
    });
  }
}
