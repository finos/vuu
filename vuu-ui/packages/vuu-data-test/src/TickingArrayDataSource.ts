import {
  ArrayDataSource,
  ArrayDataSourceConstructorProps,
  MenuRpcResponse,
  RpcResponse,
  SubscribeCallback,
  SubscribeProps,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
} from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import {
  ClientToServerEditRpc,
  ClientToServerMenuRPC,
  ClientToServerViewportRpcCall,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";
import { SelectionItem } from "@finos/vuu-table-types";
import { metadataKeys } from "@finos/vuu-utils";
import { makeSuggestions } from "./makeSuggestions";
import { Table } from "./Table";

export type RpcService = {
  rpcName: string;
  service: (rpcRequest: any) => Promise<any>;
};

export interface TickingArrayDataSourceConstructorProps
  extends Omit<ArrayDataSourceConstructorProps, "data"> {
  data?: Array<VuuRowDataItemType[]>;
  menu?: VuuMenu;
  menuRpcServices?: RpcService[];
  rpcServices?: RpcService[];
  table?: Table;
}

export class TickingArrayDataSource extends ArrayDataSource {
  #menuRpcServices: RpcService[] | undefined;
  #rpcServices: RpcService[] | undefined;
  #table?: Table;

  constructor({
    data,
    menuRpcServices,
    rpcServices,
    table,
    menu,
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
    this.#rpcServices = rpcServices;
    this.#table = table;

    if (table) {
      table.on("insert", this.insert);
      table.on("update", this.updateRow);
    }
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

  private getSelectedRows() {
    return this.selectedRows.reduce<DataSourceRow[]>(
      (rows: DataSourceRow[], selected: SelectionItem) => {
        if (Array.isArray(selected)) {
          selected.forEach((sel) => {
            const row = this.data[sel];
            if (row) {
              rows.push(row);
            }
          });
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

  applyEdit(
    row: DataSourceRow,
    columnName: string,
    value: VuuRowDataItemType
  ): Promise<true> {
    console.log(`applyEdit ${columnName} ${value}`);
    const key = row[metadataKeys.KEY];
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
      return rpcService.service({
        ...rpcRequest,
      });
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
        case "VIEW_PORT_MENUS_SELECT_RPC": {
          const selectedRows = this.getSelectedRows();
          return rpcService.service({
            ...rpcRequest,
            selectedRows,
          });
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
        "cannot call getTypeaheadSuggestions on TickingDataSOurce if table has not been provided"
      );
    }
  }
}
