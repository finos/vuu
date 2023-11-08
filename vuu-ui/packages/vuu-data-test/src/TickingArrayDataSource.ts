import {
  ArrayDataSource,
  ArrayDataSourceConstructorProps,
  MenuRpcResponse,
  SubscribeCallback,
  SubscribeProps,
  VuuUIMessageInRPCEditReject,
  VuuUIMessageInRPCEditResponse,
} from "@finos/vuu-data";
import {
  UpdateGenerator,
  UpdateHandler,
} from "@finos/vuu-data-test/src/rowUpdates";
import { DataSourceRow } from "@finos/vuu-data-types";
import {
  ClientToServerEditRpc,
  ClientToServerMenuRPC,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";
import { Table } from "./Table";

export type RpcService = {
  rpcName: string;
  service: (rpcRequest: any) => Promise<any>;
};

export interface TickingArrayDataSourceConstructorProps
  extends Omit<ArrayDataSourceConstructorProps, "data"> {
  data?: Array<VuuRowDataItemType[]>;
  menu?: VuuMenu;
  rpcServices?: RpcService[];
  table?: Table;
  updateGenerator?: UpdateGenerator;
}

export class TickingArrayDataSource extends ArrayDataSource {
  #rpcServices: RpcService[] | undefined;
  #updateGenerator: UpdateGenerator | undefined;
  constructor({
    data,
    rpcServices,
    table,
    updateGenerator,
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
    this.#rpcServices = rpcServices;
    this.#updateGenerator = updateGenerator;
    updateGenerator?.setDataSource(this);
    updateGenerator?.setUpdateHandler(this.processUpdates);

    if (table) {
      table.on("insert", this.insert);
    }
  }

  async subscribe(subscribeProps: SubscribeProps, callback: SubscribeCallback) {
    const subscription = super.subscribe(subscribeProps, callback);
    if (subscribeProps.range) {
      this.#updateGenerator?.setRange(subscribeProps.range);
    }
    return subscription;
  }

  set range(range: VuuRange) {
    super.range = range;
    this.#updateGenerator?.setRange(range);
  }
  get range() {
    return super.range;
  }

  private processUpdates: UpdateHandler = (rowUpdates) => {
    const updatedRows: DataSourceRow[] = [];
    const data = super.currentData;
    for (const [updateType, ...updateRecord] of rowUpdates) {
      switch (updateType) {
        case "U": {
          const [rowIndex, ...updates] = updateRecord;
          const row = data[rowIndex].slice() as DataSourceRow;
          if (row) {
            for (let i = 0; i < updates.length; i += 2) {
              const colIdx = updates[i] as number;
              const colVal = updates[i + 1];
              row[colIdx] = colVal;
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            // TODO this is problematic if we're filtered
            // we need to update the correct underlying row
            data[rowIndex] = row;
            updatedRows.push(row);
          }
          break;
        }
        case "I": {
          this.insert(updateRecord);

          break;
        }
        case "D": {
          console.log(`delete row`);
          break;
        }
      }
    }
    super._clientCallback?.({
      clientViewportId: super.viewport,
      mode: "update",
      rows: updatedRows,
      type: "viewport-update",
    });
  };

  private getSelectedRows() {
    return this.selectedRows.reduce<DataSourceRow[]>((rows, selected) => {
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
    }, []);
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
}
