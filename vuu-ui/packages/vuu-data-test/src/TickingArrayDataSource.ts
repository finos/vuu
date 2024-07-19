import {
  ArrayDataSource,
  ArrayDataSourceConstructorProps,
} from "@finos/vuu-data-local";
import type {
  DataSourceRow,
  MenuRpcResponse,
  RpcResponse,
  Selection,
  SelectionItem,
  SubscribeCallback,
  SubscribeProps,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
} from "@finos/vuu-data-types";
import type {
  ClientToServerEditRpc,
  ClientToServerMenuRPC,
  ClientToServerViewportRpcCall,
  LinkDescriptorWithLabel,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { VuuBroadcastChannel, metadataKeys } from "@finos/vuu-utils";
import { makeSuggestions } from "./makeSuggestions";
import { Table } from "./Table";
import { RpcService, SessionTableMap } from "./VuuModule";

const { KEY } = metadataKeys;

export interface TickingArrayDataSourceConstructorProps
  extends Omit<ArrayDataSourceConstructorProps, "data"> {
  data?: Array<VuuRowDataItemType[]>;
  menu?: VuuMenu;
  menuRpcServices?: RpcService[];
  rpcServices?: RpcService[];
  sessionTables?: SessionTableMap;
  table?: Table;
  visualLinks?: LinkDescriptorWithLabel[];
}

type DataSourceBroadcastSubscribeMessage = {
  type: "subscribe-link-filter" | "subscribe-link-select" | "unsubscribe";
  targetId: string;
  targetColumn: string;
  sourceId: string;
  sourceColumn?: string;
};

type DataSourceBroadcastSelectionMessage = {
  sourceColumnName?: string;
  columnName: string;
  linkType: "subscribe-link-filter" | "subscribe-link-select";
  targetId: string;
  type: "selection-changed";
  selectedValues: string[];
  sourceId: string;
};

type DataSourceBroadcastMessage =
  | DataSourceBroadcastSubscribeMessage
  | DataSourceBroadcastSelectionMessage;

const isMessageForSelf = (message: DataSourceBroadcastMessage, id: string) =>
  message.targetId === id;

type LinkSubscription = {
  sourceColumnName?: string;
  columnName: string;
  linkType: "subscribe-link-filter" | "subscribe-link-select";
};

export class TickingArrayDataSource extends ArrayDataSource {
  #menuRpcServices: RpcService[] | undefined;
  #rpcServices: RpcService[] | undefined;
  // A reference to session tables hosted within client side module
  #sessionTables: SessionTableMap | undefined;
  #table?: Table;
  #broadcastChannel: VuuBroadcastChannel<DataSourceBroadcastMessage> =
    new BroadcastChannel("vuu-datasource");
  #selectionLinkSubscribers: Map<string, LinkSubscription> | undefined;

  constructor({
    data,
    menuRpcServices,
    rpcServices,
    sessionTables,
    table,
    menu,
    visualLinks,
    ...arrayDataSourceProps
  }: TickingArrayDataSourceConstructorProps) {
    if (data === undefined && table === undefined) {
      throw Error("TickingArrayDataSource must be constructed with data");
    }
    super({
      ...arrayDataSourceProps,
      data: data ?? table?.data ?? [],
    });
    this._menu = menu;
    this.#menuRpcServices = menuRpcServices;
    this.#sessionTables = sessionTables;
    this.#rpcServices = rpcServices;
    this.#table = table;
    this.links = visualLinks;

    if (table) {
      this.tableSchema = table.schema;
      table.on("insert", this.insert);
      table.on("update", this.updateRow);
    }

    this.#broadcastChannel.onmessage = (evt) => {
      if (isMessageForSelf(evt.data, this.viewport)) {
        this.receiveBroadcastMessage(evt.data);
      }
    };
  }

  async subscribe(subscribeProps: SubscribeProps, callback: SubscribeCallback) {
    const subscription = super.subscribe(subscribeProps, callback);
    // if (subscribeProps.range) {
    //   this.#updateGenerator?.setRange(subscribeProps.range);
    // }
    return subscription;
  }

  set range(range: VuuRange) {
    super.range = range;
    // this.#updateGenerator?.setRange(range);
  }
  get range() {
    return super.range;
  }

  private pickUniqueSelectedValues(column: string) {
    const map = this.columnMap;
    const set = new Set();
    const colIndex = map[column];
    for (const row of this.getSelectedRows()) {
      set.add(row[colIndex]);
    }
    return Array.from(set) as string[];
  }

  select(selected: Selection) {
    super.select(selected);
    const numberOfSelectionSubscribers =
      this.#selectionLinkSubscribers?.size ?? 0;
    if (numberOfSelectionSubscribers > 0) {
      this.#selectionLinkSubscribers?.forEach(
        ({ sourceColumnName, columnName, linkType }, targetId) => {
          this.sendBroadcastMessage({
            sourceColumnName,
            columnName,
            linkType,
            sourceId: this.viewport,
            targetId,
            type: "selection-changed",
            selectedValues: this.pickUniqueSelectedValues(columnName),
          });
        }
      );
    }
  }

  private getSelectedRows() {
    return this.selectedRows.reduce<DataSourceRow[]>(
      (rows: DataSourceRow[], selected: SelectionItem) => {
        if (Array.isArray(selected)) {
          for (let i = selected[0]; i <= selected[1]; i++) {
            const row = this.data[i];
            if (row) {
              rows.push(row);
            }
          }
        } else {
          const row = this.data[selected];
          if (row) {
            rows.push(row);
          }
        }
        return rows;
      },
      []
    );
  }

  private getSelectedRowIds() {
    return this.selectedRows.reduce<string[]>(
      (rowIds: string[], selection: SelectionItem) => {
        if (Array.isArray(selection)) {
          for (let i = selection[0]; i <= selection[1]; i++) {
            const row = this.data[i];
            if (row) {
              rowIds.push(row[KEY]);
            }
          }
        } else {
          const row = this.data[selection];
          if (row) {
            rowIds.push(row[KEY]);
          }
        }
        return rowIds;
      },
      []
    );
  }

  applyEdit(
    row: DataSourceRow,
    columnName: string,
    value: VuuRowDataItemType
  ): Promise<true> {
    const key = row[KEY];
    this.#table?.update(key, columnName, value);
    return Promise.resolve(true);
  }

  async rpcCall<T extends RpcResponse = RpcResponse>(
    rpcRequest: Omit<ClientToServerViewportRpcCall, "vpId">
  ): Promise<T | undefined> {
    const rpcService = this.#rpcServices?.find(
      (service) =>
        service.rpcName ===
        (rpcRequest as ClientToServerViewportRpcCall).rpcName
    );

    if (rpcService) {
      switch (rpcRequest.rpcName) {
        case "VP_BULK_EDIT_COLUMN_CELLS_RPC": {
          return rpcService.service(rpcRequest) as Promise<T>;
        }
      }
      const selectedRows = this.getSelectedRows();
      return rpcService.service({
        ...rpcRequest,
        selectedRows,
      }) as Promise<T>;
    } else {
      console.log(`no implementation for PRC service ${rpcRequest.rpcName}`);
    }
  }

  async menuRpcCall(
    rpcRequest: Omit<ClientToServerMenuRPC, "vpId"> | ClientToServerEditRpc
  ): Promise<
    | MenuRpcResponse
    | VuuUIMessageInRPCEditReject
    | VuuUIMessageInRPCEditResponse
    | undefined
  > {
    const rpcService = this.#rpcServices?.find(
      (service) =>
        service.rpcName === (rpcRequest as ClientToServerMenuRPC).rpcName
    );

    if (rpcService) {
      switch (rpcRequest.type) {
        case "VIEW_PORT_MENU_ROW_RPC":
        case "VIEW_PORT_MENUS_SELECT_RPC": {
          // selectedRowIds is specific to the client implementation. Because the dataSource
          //  itself stores the selected rows (rather than server) we need to inject these
          // here so rpc service has access to them. In Vuu scenario, Vuu server module would
          // already know selected rows.
          return rpcService.service({
            ...rpcRequest,
            // vpId: this.viewport,
            selectedRowIds: this.getSelectedRowIds(),
            // include table for now in the rpcRequest. In future we will support
            //a viewportId, same as server, but for that we have to map viewports
            // to tables in module.
            table: this.tableSchema.table,
          } as any) as any;
        }
        default:
      }
    }
    return super.menuRpcCall(rpcRequest);
  }

  getTypeaheadSuggestions(column: string, pattern?: string): Promise<string[]> {
    if (this.#table) {
      return makeSuggestions(this.#table, column, pattern);
    } else {
      throw Error(
        "cannot call getTypeaheadSuggestions on TickingDataSource if table has not been provided"
      );
    }
  }

  createSessionDataSource(vuuTable: VuuTable) {
    const table = this.#sessionTables?.[vuuTable.table];
    if (table) {
      return new TickingArrayDataSource({
        columnDescriptors: table.schema.columns,
        keyColumn: table.schema.key,
        table,
        rpcServices: this.#rpcServices,
      });
    } else {
      throw Error(
        "TickingDataSource cannot create session datasource, no session table ${table.table}"
      );
    }
  }

  sendBroadcastMessage(message: DataSourceBroadcastMessage) {
    this.#broadcastChannel.postMessage(message);
  }

  protected receiveBroadcastMessage = (message: DataSourceBroadcastMessage) => {
    switch (message.type) {
      case "subscribe-link-filter":
      case "subscribe-link-select":
        {
          const subscribers =
            this.#selectionLinkSubscribers ||
            (this.#selectionLinkSubscribers = new Map<
              string,
              LinkSubscription
            >());
          subscribers.set(message.sourceId, {
            sourceColumnName: message.sourceColumn,
            columnName: message.targetColumn,
            linkType: message.type,
          });
        }
        break;

      case "selection-changed":
        {
          const { sourceColumnName, columnName, linkType, selectedValues } =
            message;
          const selectedIndices = [];
          const colIndex = this.columnMap[columnName];
          if (linkType === "subscribe-link-select") {
            for (const value of selectedValues) {
              const index = this.data.findIndex(
                (row) => row[colIndex] === value
              );
              selectedIndices.push(index);
            }
            this.select(selectedIndices);
          } else {
            this.filter = {
              filter: `${sourceColumnName} in ["${selectedValues.join(
                '","'
              )}"]`,
            };
          }
        }

        break;
      default:
        console.log(`unrecognised message ${message.type}`);
    }
  };
}
