import {
  ArrayDataSource,
  ArrayDataSourceConstructorProps,
} from "@finos/vuu-data-local";
import type {
  DataSourceVisualLinkCreatedMessage,
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
) => Promise<DataSourceVisualLinkCreatedMessage | void>;

export interface TickingArrayDataSourceConstructorProps
  extends Omit<ArrayDataSourceConstructorProps, "data"> {
  data?: Array<VuuRowDataItemType[]>;
  getVisualLinks?: (tableName: string) => LinkDescriptorWithLabel[] | undefined;
  menu?: VuuMenu;
  menuRpcServices?: RpcService[];
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
    menuRpcServices,
    rpcServices,
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
    });
    this._menu = menu;

    this.#menuRpcServices = menuRpcServices;
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
    }
  }

  async subscribe(subscribeProps: SubscribeProps, callback: SubscribeCallback) {
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

  set range(range: VuuRange) {
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
          console.log({ response });
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
      }).then((response) => {
        console.log({ response });
        this.emit("visual-link-removed");
      });
    }
  }
}
