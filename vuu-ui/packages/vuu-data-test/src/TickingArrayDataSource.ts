import {
  ArrayDataSource,
  type ArrayDataSourceConstructorProps,
} from "@vuu-ui/vuu-data-local";
import type {
  DataSourceBase,
  DataSource,
  DataSourceRowWithBigint,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  DataSourceVisualLinkCreatedMessage,
  DeleteRowMode,
  CopyOption,
  EditSessionMode,
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
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import {
  isRpcSuccess,
  isTypeaheadRequest,
  StaleUpdateError,
} from "@vuu-ui/vuu-utils";
import type {
  IVuuModule,
  RpcMenuService,
  RpcService,
} from "./core/module/VuuModule";
import { makeSuggestions } from "./makeSuggestions";
import type { Table } from "./Table";

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
  table?: Table;
  visualLinkService?: VisualLinkHandler;
  vuuModule?: IVuuModule;
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
  #sourceTableDataSource: TickingArrayDataSource | undefined;
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
    row: Array<bigint | VuuRowDataItemType>,
    columnName?: string,
    sessionId?: string,
  ) => {
    if (sessionId && sessionId === this.viewport) {
      this.updateRow(row, columnName);
    } else if (sessionId) {
      // will never happen
      console.warn("THIS IS NEVER EXPECTED TO HAPPEN");
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

  set links(links: LinkDescriptorWithLabel[] | undefined) {
    super.links = links;
  }

  get links() {
    return this.#getVisualLinks?.(this.table.table);
  }

  getSelectedRowIds(): string[] {
    return Array.from(this.selectedRows);
  }

  isSessionDataSourceOf(dataSource: DataSource): boolean {
    return this.#sourceTableDataSource === dataSource;
  }

  async createSessionDataSource(
    copyOption: CopyOption,
  ): Promise<DataSourceBase<DataSourceRowWithBigint> | undefined> {
    const rpcResponse = await this?.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "createSessionTable",
      params: { copyOption },
    });
    if (isRpcSuccess(rpcResponse)) {
      const { table: sessionTable } = rpcResponse.data as { table: VuuTable };
      const columns = this.config.columns.includes("vuuAction")
        ? this.config.columns
        : this.config.columns.concat("vuuAction");
      const sessionDataSource = this.#vuuModule?.createDataSource(
        sessionTable.table,
        sessionTable.table,
        { ...this.config, columns },
      );
      if (sessionDataSource instanceof TickingArrayDataSource) {
        sessionDataSource.#sourceTableDataSource = this;
      }
      return sessionDataSource;
    } else {
      throw Error(
        `[TickingArrayDataSource] createSessionDataSource ${rpcResponse?.errorMessage}`,
      );
    }
  }

  async beginEditSession(
    editSessionMode: EditSessionMode = "all-rows",
  ): Promise<DataSourceBase<DataSourceRowWithBigint> | undefined> {
    const rpcResponse = await this?.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "beginEditSession",
      params: { editSessionMode },
    });
    if (isRpcSuccess(rpcResponse)) {
      const { table: sessionTable } = rpcResponse.data as { table: VuuTable };
      const sessionDataSource = this.#vuuModule?.createDataSource(
        sessionTable.table,
        sessionTable.table,
        { ...this.config },
      );
      if (sessionDataSource instanceof TickingArrayDataSource) {
        sessionDataSource.#sourceTableDataSource = this;
      }
      return sessionDataSource;
    } else {
      throw Error(
        `[TickingArrayDataSource] beginEditSession ${rpcResponse?.errorMessage}`,
      );
    }
  }

  async editCell(key: string, column: string, data: VuuRowDataItemType) {
    return this.rpcRequest({
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
    const response = await this.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "addRow",
      params: { key: rowData[this.tableSchema.key] as string, data: rowData },
    });
    if (isRpcSuccess(response)) {
      return true;
    }
    return response?.errorMessage ?? "addRow failed";
  };

  deleteRow = async (
    key: string,
    mode: DeleteRowMode = "hard",
  ): Promise<true | string> => {
    const response = await this.rpcRequest({
      type: "RPC_REQUEST",
      rpcName: "deleteRow",
      params: { key, mode },
    });
    if (isRpcSuccess(response)) {
      return true;
    }
    return response?.errorMessage ?? "deleteRow failed";
  };

  deleteSelectedRows = async (
    mode: DeleteRowMode = "soft",
  ): Promise<RpcResultSuccess | RpcResultError> => {
    const response = await this.rpcRequest({
      type: "RPC_REQUEST",
      rpcName: "deleteSelectedRows",
      params: { mode },
    });
    return (
      response ?? {
        type: "ERROR_RESULT",
        errorMessage: "deleteSelectedRows failed",
      }
    );
  };

  undoRowChange = async (
    key: string,
  ): Promise<RpcResultSuccess | RpcResultError> => {
    const response = await this.rpcRequest({
      type: "RPC_REQUEST",
      rpcName: "undoRowChange",
      params: { key },
    });
    return (
      response ?? { type: "ERROR_RESULT", errorMessage: "undoRowChange failed" }
    );
  };

  set columns(columns: string[]) {
    super.columns = columns;
  }

  get columns() {
    return super.columns;
  }

  async endEditSession(saveChanges = false) {
    const type = "RPC_REQUEST";
    const rpcName = "endEditSession";

    const rpcResponse = await this.rpcRequest(
      saveChanges
        ? { type, rpcName, params: { save: true } }
        : { type, rpcName, params: {} },
    );

    if (isRpcSuccess(rpcResponse)) {
      const sourceTableDataSource = this.#sourceTableDataSource;
      if (sourceTableDataSource) {
        this.#sourceTableDataSource = undefined;
        this.unsubscribe();
      } else {
        this.sendRowsToClient(true);
      }
    } else {
      if (rpcResponse?.errorMessage === "stale update") {
        throw new StaleUpdateError(rpcResponse.errorMessage);
      } else {
        throw Error(rpcResponse?.errorMessage ?? "endEditSession failed");
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
