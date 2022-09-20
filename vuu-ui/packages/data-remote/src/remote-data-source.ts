import { DataTypes, EventEmitter, FilterClause, uuid } from '@vuu-ui/utils';
import { DataSource, DataSourceProps, SubscribeCallback, SubscribeProps } from './data-source';
import {
  VuuUIMessageIn,
  VuuUIMessageOutFilterQuery,
  VuuUIMessageOutSort
} from './vuuUIMessageTypes';
import { VuuAggregation, VuuSortCol, VuuTable } from '@vuu-ui/data-types';

import { msgType as Msg } from './constants';

import { ConnectionManager, ServerAPI } from './connection-manager';

const { ROW_DATA } = DataTypes;

const logger = console;

const NullServer = {
  handleMessageFromClient: (message: unknown) =>
    console.log(`%cNullServer.handleMessageFromClient ${JSON.stringify(message)}`, 'color:red')
};

const defaultRange = { from: 0, to: 0 };

export interface DataSourceColumn {}

/*-----------------------------------------------------------------
 A RemoteDataView manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
export class RemoteDataSource extends EventEmitter implements DataSource {
  private bufferSize: number;
  private table: VuuTable;
  private columns: DataSourceColumn[];
  private viewport: string;
  private server: ServerAPI | null = null;
  private url: string;
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
    table,
    configUrl,
    serverUrl,
    viewport,
    'visual-link': visualLink
  }: DataSourceProps) {
    super();
    this.bufferSize = bufferSize;
    this.table = table;
    this.columns = columns;
    this.viewport = viewport;

    this.url = serverUrl || configUrl;
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

    console.log(`[RemoteDataSource] call ConnectionManager.connect, but don't block`);
    this.pendingServer = ConnectionManager.connect(this.url);
  }

  async subscribe(
    {
      viewport = this.viewport ?? uuid(),
      table = this.table,
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
    if (!table) throw Error('RemoteDataSource subscribe called without table');

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
    this.table = table;
    this.columns = columns;

    console.group(`[RemoteDataSource].subscribe  about to block until ServerAPI resolves`);
    this.server = await this.pendingServer;
    console.groupEnd(`[RemoteDataSource].subscribe  unblocked - server resolved`);

    const { bufferSize } = this;
    this.server.subscribe(
      {
        viewport,
        table,
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
        `unsubscribe from ${this.table ? JSON.stringify(this.table) : 'no table'} (viewport ${
          this?.viewport
        })`
      );
      this.server?.unsubscribe(this.viewport);
      this.server?.destroy();
    }
  }

  suspend() {
    this.suspended = true;
    this.server?.send({
      viewport: this.viewport,
      type: Msg.suspend
    });
    return this;
  }

  resume() {
    if (this.suspended) {
      // should we await this ?s
      this.server?.send({
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
    this.server?.send({
      viewport: this.viewport,
      type: Msg.disable
    });
    return this;
  }

  enable() {
    if (this.disabled) {
      this.status = 'enabling';
      // should we await this ?s
      this.server?.send({
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

  setRange(from: number, to: number) {
    this.server?.send({
      viewport: this.viewport,
      type: Msg.setViewRange,
      range: { from, to }
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
  sort(columns: VuuSortCol[]) {
    this.server?.send({
      viewport: this.viewport,
      type: 'sort',
      sortDefs: columns
    } as VuuUIMessageOutSort);
  }

  filter(filter: FilterClause, filterQuery: string) {
    console.log({ filter, filterQuery });
    this.server?.send({
      viewport: this.viewport,
      type: 'filterQuery',
      filter,
      filterQuery
    } as VuuUIMessageOutFilterQuery);
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
