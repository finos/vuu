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
  RowUpdates,
  UpdateGenerator,
} from "@finos/vuu-data-test/src/rowUpdates";
import { DataSourceRow } from "@finos/vuu-data-types";
import {
  ClientToServerEditRpc,
  ClientToServerMenuRPC,
  VuuMenu,
  VuuRange,
} from "@finos/vuu-protocol-types";

export type RpcService = {
  rpcName: string;
  service: (rpcRequest: any) => Promise<any>;
};

export interface TickingArrayDataSourceConstructorProps
  extends ArrayDataSourceConstructorProps {
  menu?: VuuMenu;
  rpcServices?: RpcService[];
  updateGenerator?: UpdateGenerator;
}

//TODO this should accept a Table object rather than raw data array
// Table will emit events. These will cause update messages to user
// if within viewport
export class TickingArrayDataSource extends ArrayDataSource {
  #rpcServices: RpcService[] | undefined;
  #updateGenerator: UpdateGenerator | undefined;
  constructor({
    rpcServices,
    updateGenerator,
    menu,
    ...arrayDataSourceProps
  }: TickingArrayDataSourceConstructorProps) {
    super(arrayDataSourceProps);
    this._menu = menu;
    this.#rpcServices = rpcServices;
    this.#updateGenerator = updateGenerator;
    updateGenerator?.setDataSource(this);
    updateGenerator?.setUpdateHandler(this.processUpdates);
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

  private processUpdates = (rowUpdates: RowUpdates[]) => {
    const updatedRows: DataSourceRow[] = [];
    const data = super.currentData;
    for (const [rowIndex, ...updates] of rowUpdates) {
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
