import {
  ArrayDataSource,
  ArrayDataSourceConstructorProps,
} from "@vuu-ui/vuu-data-local";
import type {
  DataSource,
  DataSourceCallbackMessage,
  DataSourceRow,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  DataSourceVisualLinkCreatedMessage,
  DeleteRowMode,
  EditSessionMode,
} from "@vuu-ui/vuu-data-types";
import type {
  LinkDescriptorWithLabel,
  RpcResultError,
  RpcResultSuccess,
  SelectRequest,
  VuuCreateVisualLink,
  VuuMenu,
  VuuRemoveVisualLink,
  VuuRowDataItemType,
  VuuRpcMenuRequest,
  VuuRpcMenuResponse,
  VuuRpcServiceRequest,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import { isRpcSuccess, isTypeaheadRequest, Range, uuid } from "@vuu-ui/vuu-utils";
import {
  IVuuModule,
  RpcMenuService,
  RpcService,
  SessionTableMap,
} from "./core/module/VuuModule";
import { makeSuggestions } from "./makeSuggestions";
import { Table } from "./Table";
import { isInlineEditingSession } from "@vuu-ui/vuu-utils";

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
  vuuModule?: IVuuModule;
}

type LinkSubscription = {
  sourceColumnName?: string;
  columnName: string;
  linkType: "subscribe-link-filter" | "subscribe-link-select";
};

type SelectedRowIdsReader = {
  getSelectedRowIds?: () => string[];
};

const readSelectedRowIds = (dataSource?: DataSource): string[] => {
  return (dataSource as SelectedRowIdsReader | undefined)?.getSelectedRowIds?.() ?? [];
};

export class TickingArrayDataSource extends ArrayDataSource {
  #menuRpcServices: RpcService[] | undefined;
  #pendingVisualLink?: LinkDescriptorWithLabel;
  #rpcMenuServices: RpcMenuService[] | undefined;
  #rpcServices: RpcService[] | undefined;
  // A reference to session tables hosted within client side module
  #sessionTables: SessionTableMap | undefined;
  #sessionDataSource: DataSource | undefined = undefined;
  #table?: Table;
  #selectionLinkSubscribers: Map<string, LinkSubscription> | undefined;
  #visualLinkService?: VisualLinkHandler;
  #getVisualLinks?: (
    tableName: string,
  ) => LinkDescriptorWithLabel[] | undefined;
  #vuuModule?: IVuuModule;

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
    vuuModule,
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
    this.#vuuModule = vuuModule;

    if (table) {
      this.tableSchema = table.schema;
      table.on("insert", this.insert);
      table.on("update", this.updateRowWithSessionCheck);
      // Use the base-class low-level handler so the overridden deleteRow
      // (which routes through rpcRequest)
      table.on("delete", this.handleDeleteFromTable);
    }
  }

  updateRowWithSessionCheck = (
    row: VuuRowDataItemType[],
    columnName?: string,
    sessionId?: string,
  ) => {
    if (sessionId && sessionId === this.viewport) {
      this.updateRow(row, columnName);
    } else if (sessionId) {
      // will never happen
      console.warn("THIS IS NEVER EXPECTED TO HAPPEN");
    } else if (this.#sessionDataSource) {
      // queue updates for deferred application, issue warnings when edits in progress
      // this.emit("remote-update-during-local-edit", row);
    } else {
      this.updateRow(row, columnName);
    }
  };

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
    // Keep session datasource range in sync while editing.
    if (this.#sessionDataSource) {
      (this.#sessionDataSource as ArrayDataSource).range = range;
    }
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

  getSelectedRowIds(): string[] {
    if (this.#sessionDataSource) {
      // Merge base and session selections.
      const sessionIds = readSelectedRowIds(this.#sessionDataSource);
      return [...new Set([...this.selectedRows, ...sessionIds])];
    }
    return Array.from(this.selectedRows);
  }

  /**
   * Suppress row updates from the main data source during an edit session
   * to prevent overwriting the session view.
   */
  sendRowsToClient(forceFullRefresh = false, row?: DataSourceRow) {
    if (this.#sessionDataSource) {
      return;
    }
    super.sendRowsToClient(forceFullRefresh, row);
  }

  select(selectRequest: Omit<SelectRequest, "vpId">) {
    // Forwarding the select request to the session 
    // datasource causes it to update its own selectedRows
    // and re-send its rows
    super.select(selectRequest);
    if (this.#sessionDataSource) {
      (this.#sessionDataSource as ArrayDataSource).select(selectRequest);
    }
  }

  handleSessionMessage = (msg: DataSourceCallbackMessage) => {
    if (msg.type === "subscribed") {
      // console.log(`[VuuDataSource subscribed to session table]`);
    } else if (msg.type === "viewport-update") {
      if (msg.size !== undefined && msg.size !== this.size) {
        this.emit("resize", msg.size);
      }
      this.clientCallback?.(msg);
    }
  };

  createSessionDataSource(sessionTable: VuuTable) {
    if (this.#vuuModule) {
      return this.#vuuModule?.createDataSource(
        sessionTable.table,
        sessionTable.table,
      );
    } else {
      throw Error(
        `[TickingArrayDataSource] unable to createSessionDataSource, not constructed with VuuModule`,
      );
    }
  }

  async beginEditSession(editSessionMode: EditSessionMode = "inline-all-rows") {
    const rpcResponse = await this?.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "beginEditSession",
      params: {
        editSessionMode,
      },
    });

    if (isRpcSuccess(rpcResponse)) {
      const { table: sessionTable } = rpcResponse.data as { table: VuuTable };

      if (isInlineEditingSession(editSessionMode)) {
        this.#sessionDataSource = this.#vuuModule?.createDataSource(
          sessionTable.table,
          sessionTable.table,
          this.config,
        );

        this.#sessionDataSource?.subscribe(
          {
            range: this.range,
          },
          this.handleSessionMessage,
        );
      } else {
        return this.#vuuModule?.createDataSource(
          sessionTable.table,
          sessionTable.table,
          this.config,
        );
      }

      // we need to route messages from the session datasource to listening
      // client whilst still monitoring responses on the source table to which
      // we are currently subscribed.
    } else {
      throw Error(
        `[VuuDataSource] beginEditSession ${rpcResponse.errorMessage}`,
      );
      ///
    }
  }

  async editCell(key: string, column: string, data: VuuRowDataItemType) {
    console.log(
      `[VuuDataSource] editCell ${this.#sessionDataSource?.viewport} rowKey ${key}, column ${column}, value ${data}`,
    );

    const rpcHost = this.#sessionDataSource ?? this;

    return rpcHost.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "editCell",
      params: {
        column,
        data,
        key,
      },
    });
  }

  addRow = async (
    rowData: Record<string, VuuRowDataItemType> = {},
  ): Promise<true | string> => {
    // Ensure each added row has a unique key.
    const keyColumn = this.tableSchema.key;
    const rowKey = (rowData[keyColumn] as string | undefined) ?? uuid();
    const rowDataWithKey: Record<string, VuuRowDataItemType> = {
      ...rowData,
      [keyColumn]: rowKey,
    };
    const response = await this.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "addRow",
      params: { key: rowKey, data: rowDataWithKey },
    });
    if (isRpcSuccess(response)) {
      return true;
    }
    return response?.errorMessage ?? "addRow failed";
  };

  deleteRow = async (key: string, mode: DeleteRowMode = "hard"): Promise<true | string> => {
    const rpcHost = this.#sessionDataSource ?? this;
    const response = await rpcHost.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "deleteRow",
      params: { key, mode },
    });
    if (isRpcSuccess(response)) {
      return true;
    }
    return response?.errorMessage ?? "deleteRow failed";
  };

  async endEditSession(saveChanges = false) {
    const type = "RPC_REQUEST";
    const rpcName = "endEditSession";

    const sessionDataSource = this.#sessionDataSource;

    const rpcHost = sessionDataSource ?? this;

    if (sessionDataSource) {
      // timing is important here. By breaking this reference before
      // we send the endEdit RPC call, the application of session edits
      // to the source table will be handled correctly.
      this.#sessionDataSource = undefined;
    }

    const rpcResponse = await rpcHost.rpcRequest?.(
      saveChanges
        ? { type, rpcName, params: { save: true } }
        : { type, rpcName, params: {} },
    );

    if (isRpcSuccess(rpcResponse)) {
      sessionDataSource?.unsubscribe();
      this.sendRowsToClient(true);
    } else {
      // TODO do we reinstate the sessionDataSource ?
      if (rpcResponse?.errorMessage === "stale update") {
        sessionDataSource?.unsubscribe();
        this.sendRowsToClient(true);
      } else {
        throw Error("unknown error");
      }
    }
  }

  async rpcRequest(
    rpcRequest: Omit<VuuRpcServiceRequest, "context">,
  ): Promise<RpcResultSuccess | RpcResultError> {
    if (isTypeaheadRequest(rpcRequest)) {
      const {
        params: { column, starts },
      } = rpcRequest;
      const data = await this.getTypeaheadSuggestions(column, starts);
      return {
        type: "SUCCESS_RESULT",
        data,
      } as RpcResultSuccess;
    } else {
      const rpcService = this.#rpcServices?.find(
        (service) => service.rpcName === rpcRequest.rpcName,
      );
      if (rpcService) {
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
