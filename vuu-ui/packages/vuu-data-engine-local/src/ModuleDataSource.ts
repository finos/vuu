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
  SessionDataSourceOverrides,
  SessionType,
} from "@vuu-ui/vuu-data-types";
import type {
  LinkDescriptorWithLabel,
  RpcResult,
  RpcResultError,
  RpcResultSuccess,
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuRowDataItemType,
  VuuRpcMenuRequest,
  VuuRpcMenuResponse,
  VuuRpcServiceRequest,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import {
  assertExpectedSessionTable,
  isRpcSuccess,
  isTypeaheadRequest,
  sessionDataSourceConfig,
  StaleUpdateError,
} from "@vuu-ui/vuu-utils";
import type {
  IVuuModule,
  RpcMenuService,
  RpcService,
} from "./core/module/VuuModule";
import {
  EngineDataSource,
  type EngineDataSourceConstructorProps,
} from "./EngineDataSource";

export type VisualLinkHandler = (
  message: VuuCreateVisualLink | VuuRemoveVisualLink,
) => Promise<DataSourceVisualLinkCreatedMessage | undefined>;

export interface ModuleDataSourceConstructorProps
  extends EngineDataSourceConstructorProps {
  getVisualLinks?: (tableName: string) => LinkDescriptorWithLabel[] | undefined;
  rpcMenuServices?: RpcMenuService[];
  rpcServices?: RpcService[];
  session?: SessionDataSourceOverrides;
  visualLinkService?: VisualLinkHandler;
  vuuModule?: Pick<IVuuModule, "createDataSource">;
}

/**
 * An EngineDataSource hosted by a VuuModule. Adds RPC services, menus,
 * edit sessions and visual links.
 */
export class ModuleDataSource extends EngineDataSource {
  #pendingVisualLink?: LinkDescriptorWithLabel;
  #rpcMenuServices: RpcMenuService[] | undefined;
  #rpcServices: RpcService[] | undefined;
  #session: SessionDataSourceOverrides | undefined;
  #sourceTableDataSource: ModuleDataSource | undefined;
  #visualLinkService?: VisualLinkHandler;
  #getVisualLinks?: (
    tableName: string,
  ) => LinkDescriptorWithLabel[] | undefined;
  #vuuModule?: Pick<IVuuModule, "createDataSource">;

  constructor({
    getVisualLinks,
    rpcServices,
    rpcMenuServices,
    session,
    visualLink,
    visualLinkService,
    vuuModule,
    ...engineDataSourceProps
  }: ModuleDataSourceConstructorProps) {
    super(engineDataSourceProps);
    this.#rpcMenuServices = rpcMenuServices;
    this.#pendingVisualLink = visualLink;
    this.#rpcServices = rpcServices;
    this.#session = session;
    this.#visualLinkService = visualLinkService;
    this.#getVisualLinks = getVisualLinks;
    this.#vuuModule = vuuModule;
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

  set links(links: LinkDescriptorWithLabel[] | undefined) {
    super.links = links;
  }

  get links() {
    return this.#getVisualLinks?.(this.table.table);
  }

  isSessionDataSourceOf(dataSource: DataSource): boolean {
    return this.#sourceTableDataSource === dataSource;
  }

  async createSessionDataSource(
    copyOption: CopyOption,
    sessionType: SessionType = "edit",
    overrides?: SessionDataSourceOverrides,
  ): Promise<DataSourceBase<DataSourceRowWithBigint> | undefined> {
    const rpcResponse = await this?.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "createSessionTable",
      params: { copyOption, sessionType },
    });
    if (isRpcSuccess(rpcResponse)) {
      const { table: sessionTable } = rpcResponse.data as { table: VuuTable };
      // A call-time override always wins; otherwise fall back to the session
      // config this datasource was constructed with.
      const effectiveOverrides = overrides ?? this.#session;
      assertExpectedSessionTable(sessionTable, effectiveOverrides?.table);
      const sessionConfig = sessionDataSourceConfig(
        this.config,
        effectiveOverrides?.columns,
      );
      const baseColumns = sessionConfig.columns.includes("vuuAction")
        ? sessionConfig.columns
        : sessionConfig.columns.concat("vuuAction");
      const columns =
        sessionType === "import" && !baseColumns.includes("vuuRowNum")
          ? baseColumns.concat("vuuRowNum")
          : baseColumns;
      const sessionDataSource = this.#vuuModule?.createDataSource(
        sessionTable.table,
        sessionTable.table,
        { ...sessionConfig, columns },
      );
      if (sessionDataSource instanceof ModuleDataSource) {
        sessionDataSource.#sourceTableDataSource = this;
      }
      return sessionDataSource;
    } else {
      throw Error(
        `[ModuleDataSource] createSessionDataSource ${rpcResponse?.errorMessage}`,
      );
    }
  }

  async beginEditSession(
    editSessionMode: EditSessionMode = "all-rows",
    overrides?: SessionDataSourceOverrides,
  ): Promise<DataSourceBase<DataSourceRowWithBigint> | undefined> {
    const rpcResponse = await this?.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "beginEditSession",
      params: { editSessionMode },
    });
    if (isRpcSuccess(rpcResponse)) {
      const { table: sessionTable } = rpcResponse.data as { table: VuuTable };
      const effectiveOverrides = overrides ?? this.#session;
      assertExpectedSessionTable(sessionTable, effectiveOverrides?.table);
      const sessionDataSource = this.#vuuModule?.createDataSource(
        sessionTable.table,
        sessionTable.table,
        {
          ...sessionDataSourceConfig(this.config, effectiveOverrides?.columns),
        },
      );
      if (sessionDataSource instanceof ModuleDataSource) {
        sessionDataSource.#sourceTableDataSource = this;
      }
      return sessionDataSource;
    } else {
      throw Error(
        `[ModuleDataSource] beginEditSession ${rpcResponse?.errorMessage}`,
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
  ): Promise<RpcResult> => {
    const keyValue = rowData[this.tableSchema.key];
    const key =
      keyValue !== undefined
        ? String(keyValue)
        : "vuuRowNum" in rowData
          ? String(rowData.vuuRowNum)
          : undefined;
    const response = await this.rpcRequest?.({
      type: "RPC_REQUEST",
      rpcName: "addRow",
      params: { key, data: rowData },
    });
    return (
      response ?? {
        type: "ERROR_RESULT",
        errorMessage: "addRow failed",
      }
    );
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
        this.sendRowsToClient();
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
          `[ModuleDataSource] no service to handle RPC request ${rpcRequest.rpcName}`,
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
        `[ModuleDataSource] menuRpcCall no service for ${rpcRequest.rpcName}`,
      );
    }
  }

  get visualLink() {
    return super.visualLink;
  }

  set visualLink(visualLink: LinkDescriptorWithLabel | undefined) {
    super.visualLink = visualLink;

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
}

/** @deprecated legacy name, use ModuleDataSource */
export const TickingArrayDataSource = ModuleDataSource;
/** @deprecated legacy name, use ModuleDataSource */
export type TickingArrayDataSource = ModuleDataSource;
