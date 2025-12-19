import {
  ArrayDataSource,
  ArrayDataSourceConstructorProps,
} from "@vuu-ui/vuu-data-local";
import type {
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  DataSourceVisualLinkCreatedMessage,
} from "@vuu-ui/vuu-data-types";
import type {
  LinkDescriptorWithLabel,
  RpcResultError,
  RpcResultSuccess,
  VuuCreateVisualLink,
  VuuMenu,
  VuuRemoveVisualLink,
  VuuRowDataItemType,
  VuuRpcMenuRequest,
  VuuRpcMenuResponse,
  VuuRpcServiceRequest,
} from "@vuu-ui/vuu-protocol-types";
import { isTypeaheadRequest, Range } from "@vuu-ui/vuu-utils";
import {
  RpcMenuService,
  RpcService,
  SessionTableMap,
} from "./core/module/VuuModule";
import { makeSuggestions } from "./makeSuggestions";
import { Table } from "./Table";

export type VisualLinkHandler = (
  message: VuuCreateVisualLink | VuuRemoveVisualLink,
) => Promise<DataSourceVisualLinkCreatedMessage | void>;

export interface TickingArrayDataSourceConstructorProps
  extends Omit<ArrayDataSourceConstructorProps, "data"> {
  data?: Array<VuuRowDataItemType[]>;
  getVisualLinks?: (tableName: string) => LinkDescriptorWithLabel[] | undefined;
  menu?: VuuMenu;
  rpcMenuServices?: RpcMenuService[];
  rpcServices?: RpcService[];
  sessionTables?: SessionTableMap;
  table?: Table;
  visualLinkService?: VisualLinkHandler;
}

type LinkSubscription = {
  sourceColumnName?: string;
  columnName: string;
  linkType: "subscribe-link-filter" | "subscribe-link-select";
};

export class TickingArrayDataSource extends ArrayDataSource {
  #menuRpcServices: RpcService[] | undefined;
  #pendingVisualLink?: LinkDescriptorWithLabel;
  #rpcMenuServices: RpcMenuService[] | undefined;
  #rpcServices: RpcService[] | undefined;
  // A reference to session tables hosted within client side module
  #sessionTables: SessionTableMap | undefined;
  #table?: Table;
  #selectionLinkSubscribers: Map<string, LinkSubscription> | undefined;
  #visualLinkService?: VisualLinkHandler;
  #getVisualLinks?: (
    tableName: string,
  ) => LinkDescriptorWithLabel[] | undefined;

  constructor({
    data,
    getVisualLinks,
    rpcServices,
    rpcMenuServices,
    sessionTables,
    table,
    menu,
    visualLink,
    visualLinkService,
    ...arrayDataSourceProps
  }: TickingArrayDataSourceConstructorProps) {
    if (data === undefined && table === undefined) {
      throw Error("TickingArrayDataSource must be constructed with data");
    }
    super({
      ...arrayDataSourceProps,
      data: data ?? table?.data ?? [],
      dataMap: table?.map,
    });
    this._menu = menu;

    this.#rpcMenuServices = rpcMenuServices;
    this.#pendingVisualLink = visualLink;
    this.#rpcServices = rpcServices;
    this.#sessionTables = sessionTables;
    this.#table = table;
    this.#visualLinkService = visualLinkService;
    this.#getVisualLinks = getVisualLinks;

    if (table) {
      this.tableSchema = table.schema;
      table.on("insert", this.insert);
      table.on("update", this.updateRow);
      table.on("delete", this.deleteRow);
    }
  }

  async subscribe(
    subscribeProps: DataSourceSubscribeProps,
    callback: DataSourceSubscribeCallback,
  ) {
    const subscription = super.subscribe(subscribeProps, callback);
    // if (subscribeProps.range) {
    //   this.#updateGenerator?.setRange(subscribeProps.range);
    // }
    if (this.#pendingVisualLink) {
      this.visualLink = this.#pendingVisualLink;
      this.#pendingVisualLink = undefined;
    }

    return subscription;
  }

  unsubscribe() {
    super.unsubscribe();
    this.#table = undefined;
  }

  set range(range: Range) {
    super.range = range;
    // this.#updateGenerator?.setRange(range);
  }
  get range() {
    return super.range;
  }

  set links(links: LinkDescriptorWithLabel[] | undefined) {
    super.links = links;
  }

  get links() {
    return this.#getVisualLinks?.(this.table.table);
  }

  getSelectedRowIds() {
    return Array.from(this.selectedRows);
  }

  async rpcRequest(
    rpcRequest: Omit<VuuRpcServiceRequest, "context">,
  ): Promise<RpcResultSuccess | RpcResultError> {
    if (isTypeaheadRequest(rpcRequest)) {
      const {
        params: { column, starts },
      } = rpcRequest;
      return {
        type: "SUCCESS_RESULT",
        data: this.getTypeaheadSuggestions(column, starts),
      } as RpcResultSuccess;
    } else {
      const rpcService = this.#rpcServices?.find(
        (service) => service.rpcName === rpcRequest.rpcName,
      );
      if (rpcService) {
        switch (rpcRequest.rpcName) {
          case "VP_BULK_EDIT_COLUMN_CELLS_RPC": {
            return rpcService.service({
              ...rpcRequest,
              context: {
                type: "VIEWPORT_CONTEXT",
                viewPortId: this.viewport,
              },
            });
          }
        }
        return rpcService.service({
          ...rpcRequest,
          context: {
            type: "VIEWPORT_CONTEXT",
            viewPortId: this.viewport,
          },
        });
      } else {
        throw Error(
          `[TickingArrayDataSource] no service to handle RPC request ${rpcRequest.rpcName}`,
        );
      }
    }
  }

  async menuRpcCall(
    rpcRequest: Omit<VuuRpcMenuRequest, "vpId">,
  ): Promise<VuuRpcMenuResponse> {
    const rpcService = this.#rpcMenuServices?.find(
      (service) => service.rpcName === rpcRequest.rpcName,
    );

    if (rpcService) {
      return rpcService.service({
        ...rpcRequest,
        vpId: this.viewport,
        localDataParameters: {
          selectedRowIds: this.getSelectedRowIds(),
          table: this.tableSchema.table,
        },
      } as VuuRpcMenuRequest);
    } else {
      throw Error(
        `[TickingArrayDataSource] menuRpcCall no service for ${rpcRequest.rpcName}`,
      );
    }
  }

  getTypeaheadSuggestions(column: string, pattern?: string): Promise<string[]> {
    if (this.#table) {
      const columnIndex = this.columnMap[column];
      if (columnIndex === undefined) {
        console.warn(
          `[TickingArrayDataSource] getTypeaheadSuggestions. No column ${column}`,
        );
        return Promise.resolve([]);
      } else {
        return makeSuggestions(this.currentData, columnIndex, pattern);
      }
    } else {
      throw Error(
        "cannot call getTypeaheadSuggestions on TickingDataSource if table has not been provided",
      );
    }
  }

  get visualLink() {
    return this._config.visualLink;
  }

  set visualLink(visualLink: LinkDescriptorWithLabel | undefined) {
    this._config = {
      ...this._config,
      visualLink,
    };

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
          this.emit(
            "visual-link-created",
            response as DataSourceVisualLinkCreatedMessage,
          );
        });
      }
    } else {
      this.#visualLinkService?.({
        childVpId: this.viewport,
        type: "REMOVE_VISUAL_LINK",
      }).then((/* response */) => {
        this.emit("visual-link-removed");
      });
    }
  }

  freeze() {
    super.freeze();
  }

  unfreeze() {
    super.unfreeze();
  }
}
