import {
  ArrayDataSource,
  ArrayDataSourceConstructorProps,
} from "@finos/vuu-data-local";
import type {
  DataSourceRow,
  SelectionItem,
  SubscribeCallback,
  SubscribeProps,
} from "@finos/vuu-data-types";
import type {
  VuuRpcMenuRequest,
  LinkDescriptorWithLabel,
  RpcNamedParams,
  VuuMenu,
  VuuRange,
  VuuRowDataItemType,
  VuuRpcResponse,
  VuuRpcMenuResponse,
  VuuRpcRequest,
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuCreateVisualLinkResponse,
  VuuRemoveVisualLinkResponse,
} from "@finos/vuu-protocol-types";
import {
  isViewportRpcRequest,
  isVuuMenuRpcRequest,
  metadataKeys,
} from "@finos/vuu-utils";
import { makeSuggestions } from "./makeSuggestions";
import { Table } from "./Table";
import { RpcService, SessionTableMap } from "./VuuModule";

const { KEY } = metadataKeys;

export type VisualLinkHandler = (
  message: VuuCreateVisualLink | VuuRemoveVisualLink,
) => Promise<VuuCreateVisualLinkResponse | VuuRemoveVisualLinkResponse>;

export interface TickingArrayDataSourceConstructorProps
  extends Omit<ArrayDataSourceConstructorProps, "data"> {
  data?: Array<VuuRowDataItemType[]>;
  menu?: VuuMenu;
  menuRpcServices?: RpcService[];
  rpcServices?: RpcService[];
  sessionTables?: SessionTableMap;
  table?: Table;
  visualLinks?: LinkDescriptorWithLabel[];
  visualLinkService?: VisualLinkHandler;
}

// type DataSourceBroadcastSubscribeMessage = {
//   type: "subscribe-link-filter" | "subscribe-link-select" | "unsubscribe";
//   targetId: string;
//   targetColumn: string;
//   sourceId: string;
//   sourceColumn?: string;
// };

// type DataSourceBroadcastSelectionMessage = {
//   sourceColumnName?: string;
//   columnName: string;
//   linkType: "subscribe-link-filter" | "subscribe-link-select";
//   targetId: string;
//   type: "selection-changed";
//   selectedValues: string[];
//   sourceId: string;
// };

// type DataSourceBroadcastMessage =
//   | DataSourceBroadcastSubscribeMessage
//   | DataSourceBroadcastSelectionMessage;

// const isMessageForSelf = (message: DataSourceBroadcastMessage, id: string) =>
//   message.targetId === id;

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
  // #broadcastChannel: VuuBroadcastChannel<DataSourceBroadcastMessage> =
  // new BroadcastChannel("vuu-datasource");
  #selectionLinkSubscribers: Map<string, LinkSubscription> | undefined;
  #visualLinkService?: VisualLinkHandler;

  constructor({
    data,
    menuRpcServices,
    rpcServices,
    sessionTables,
    table,
    menu,
    visualLinks,
    visualLinkService,
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
    this.#visualLinkService = visualLinkService;

    if (table) {
      this.tableSchema = table.schema;
      table.on("insert", this.insert);
      table.on("update", this.updateRow);
    }

    // this.#broadcastChannel.onmessage = (evt) => {
    //   if (isMessageForSelf(evt.data, this.viewport)) {
    //     this.receiveBroadcastMessage(evt.data);
    //   }
    // };
  }

  async subscribe(subscribeProps: SubscribeProps, callback: SubscribeCallback) {
    const subscription = super.subscribe(subscribeProps, callback);
    // if (subscribeProps.range) {
    //   this.#updateGenerator?.setRange(subscribeProps.range);
    // }
    return subscription;
  }

  unsubscribe() {
    super.unsubscribe();
    this.#table = undefined;
  }

  set range(range: VuuRange) {
    super.range = range;
    // this.#updateGenerator?.setRange(range);
  }
  get range() {
    return super.range;
  }

  // private pickUniqueSelectedValues(column: string) {
  //   const map = this.columnMap;
  //   const set = new Set();
  //   const colIndex = map[column];
  //   for (const row of this.getSelectedRows()) {
  //     set.add(row[colIndex]);
  //   }
  //   return Array.from(set) as string[];
  // }

  // select(selected: Selection) {
  //   super.select(selected);
  // const numberOfSelectionSubscribers =
  // this.#selectionLinkSubscribers?.size ?? 0;
  // if (numberOfSelectionSubscribers > 0) {
  // this.#selectionLinkSubscribers?.forEach(
  //   ({ sourceColumnName, columnName, linkType }, targetId) => {
  //     this.sendBroadcastMessage({
  //       sourceColumnName,
  //       columnName,
  //       linkType,
  //       sourceId: this.viewport,
  //       targetId,
  //       type: "selection-changed",
  //       selectedValues: this.pickUniqueSelectedValues(columnName),
  //     });
  //   },
  // );
  // }
  // }

  // private getSelectedRows() {
  //   return this.selectedRows.reduce<DataSourceRow[]>(
  //     (rows: DataSourceRow[], selected: SelectionItem) => {
  //       if (Array.isArray(selected)) {
  //         for (let i = selected[0]; i <= selected[1]; i++) {
  //           const row = this.data[i];
  //           if (row) {
  //             rows.push(row);
  //           }
  //         }
  //       } else {
  //         const row = this.data[selected];
  //         if (row) {
  //           rows.push(row);
  //         }
  //       }
  //       return rows;
  //     },
  //     [],
  //   );
  // }

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
      [],
    );
  }

  applyEdit(
    rowKey: string,
    columnName: string,
    value: VuuRowDataItemType,
  ): Promise<true> {
    this.#table?.update(rowKey, columnName, value);
    return Promise.resolve(true);
  }

  async rpcCall<T extends VuuRpcResponse = VuuRpcResponse>(
    rpcRequest: Omit<VuuRpcRequest, "vpId">,
  ): Promise<T> {
    if (isViewportRpcRequest(rpcRequest)) {
      const rpcService = this.#rpcServices?.find(
        (service) => service.rpcName === rpcRequest.rpcName,
      );
      if (rpcService && isViewportRpcRequest(rpcRequest)) {
        switch (rpcRequest.rpcName) {
          case "VP_BULK_EDIT_COLUMN_CELLS_RPC": {
            return rpcService.service({
              ...rpcRequest,
              vpId: this.viewport,
            }) as Promise<T>;
          }
        }
        return rpcService.service({
          ...rpcRequest,
          namedParams: {
            selectedRowIds: this.getSelectedRowIds(),
            table: this.tableSchema.table,
          },
          vpId: this.viewport,
        }) as Promise<T>;
      }
    }
    throw Error(`no implementation for PRC service ${rpcRequest.type}`);
  }

  async menuRpcCall(
    rpcRequest: Omit<VuuRpcRequest, "vpId"> & {
      namedParams?: RpcNamedParams;
    },
  ): Promise<VuuRpcResponse> {
    const rpcService = this.#rpcServices?.find(
      (service) =>
        service.rpcName === (rpcRequest as VuuRpcMenuRequest).rpcName,
    );

    if (isVuuMenuRpcRequest(rpcRequest)) {
      return rpcService?.service({
        ...rpcRequest,
        namedParams: {
          selectedRowIds: this.getSelectedRowIds(),
          table: this.tableSchema.table,
        },
        vpId: this.viewport,
      }) as Promise<VuuRpcMenuResponse>;
    }

    return super.menuRpcCall(rpcRequest);
  }

  getTypeaheadSuggestions(column: string, pattern?: string): Promise<string[]> {
    if (this.#table) {
      return makeSuggestions(this.#table, column, pattern);
    } else {
      throw Error(
        "cannot call getTypeaheadSuggestions on TickingDataSource if table has not been provided",
      );
    }
  }

  // sendBroadcastMessage(message: DataSourceBroadcastMessage) {
  //   this.#broadcastChannel.postMessage(message);
  // }

  // protected receiveBroadcastMessage = (message: DataSourceBroadcastMessage) => {
  //   switch (message.type) {
  //     case "subscribe-link-filter":
  //     case "subscribe-link-select":
  //       {
  //         const subscribers =
  //           this.#selectionLinkSubscribers ||
  //           (this.#selectionLinkSubscribers = new Map<
  //             string,
  //             LinkSubscription
  //           >());
  //         subscribers.set(message.sourceId, {
  //           sourceColumnName: message.sourceColumn,
  //           columnName: message.targetColumn,
  //           linkType: message.type,
  //         });
  //       }
  //       break;

  //     case "selection-changed":
  //       {
  //         const { sourceColumnName, columnName, linkType, selectedValues } =
  //           message;
  //         const selectedIndices = [];
  //         const colIndex = this.columnMap[columnName];
  //         if (linkType === "subscribe-link-select") {
  //           for (const value of selectedValues) {
  //             const index = this.data.findIndex(
  //               (row) => row[colIndex] === value,
  //             );
  //             selectedIndices.push(index);
  //           }
  //           this.select(selectedIndices);
  //         } else {
  //           this.filter = {
  //             filter: `${sourceColumnName} in ["${selectedValues.join(
  //               '","',
  //             )}"]`,
  //           };
  //         }
  //       }

  //       break;
  //     default:
  //       console.log(`unrecognised message ${message.type}`);
  //   }
  // };

  set visualLink(visualLink: LinkDescriptorWithLabel | undefined) {
    if (visualLink) {
      const {
        parentClientVpId,
        link: { fromColumn, toColumn },
      } = visualLink;

      if (this.viewport) {
        this.#visualLinkService?.({
          childVpId: this.viewport,
          childColumnName: fromColumn,
          type: "CREATE_VISUAL_LINK",
          parentVpId: parentClientVpId,
          parentColumnName: toColumn,
        }).then((response) => {
          console.log({ response });
        });
      }
    }
  }
}
