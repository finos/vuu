import {
  LinkDescriptorWithLabel,
  VuuGroupBy,
  VuuMenu,
  VuuRange,
  VuuRpcEditError,
  VuuRpcRequest,
  VuuRpcResponse,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import { NullServer } from "./IServerProxy";
import {
  DataSource,
  DataSourceConstructorProps,
  DataSourceDeleteHandler,
  DataSourceEditHandler,
  DataSourceInsertHandler,
  DataSourceRow,
  DataSourceStatus,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  ServerAPI,
  TableSchema,
  WithBaseFilter,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import { BaseDataSource, combineFilters } from "@vuu-ui/vuu-utils";

class MockDataSourceImpl extends BaseDataSource implements DataSource {
  #server: ServerAPI = NullServer;

  public table: VuuTable;

  constructor(
    {
      server,
      ...props
    }: { server: Promise<ServerAPI> } & DataSourceConstructorProps,
    onReady: (dataSource: DataSource) => void,
  ) {
    super(props);

    this.table = props.table;
    server.then((serverProxy) => {
      this.#server = serverProxy;
      onReady(this);
    });
  }
  suspend?: (() => void) | undefined;
  resume?: ((callback?: DataSourceSubscribeCallback) => void) | undefined;
  deleteRow?: DataSourceDeleteHandler | undefined;
  createSessionDataSource?: ((table: VuuTable) => DataSource) | undefined;
  enable?: ((callback?: DataSourceSubscribeCallback) => void) | undefined;
  disable?: (() => void) | undefined;
  getChildRows?: ((rowKey: string) => DataSourceRow[]) | undefined;
  getRowAtIndex?: ((rowIndex: number) => DataSourceRow | undefined) | undefined;
  getRowsAtDepth?:
    | ((depth: number, visibleOnly?: boolean) => DataSourceRow[])
    | undefined;
  groupBy?: VuuGroupBy | undefined;
  insertRow?: DataSourceInsertHandler | undefined;
  links?: LinkDescriptorWithLabel[] | undefined;
  menu?: VuuMenu | undefined;
  tableSchema?: TableSchema | undefined;
  visualLink?: LinkDescriptorWithLabel | undefined;
  getTypeaheadSuggestions?:
    | ((columnName: string, pattern?: string) => Promise<string[]>)
    | undefined;

  rangeRequest(range: VuuRange) {
    // console.log(`[MockDataSourceImpl] rangeRequest ${JSON.stringify(range)}`);
    this.#server.send({ type: "setViewRange", range, viewport: "" });
  }

  async subscribe(
    subscribeProps: DataSourceSubscribeProps,
    callback: DataSourceSubscribeCallback,
  ) {
    super.subscribe(subscribeProps, callback);
    this.#server.subscribe(
      { ...this.config, range: this.range, table: this.table, viewport: "" },
      callback,
    );
  }

  // If one part of a getter/setter is overridden, both must be
  get config() {
    return super.config;
  }

  set config(config: WithBaseFilter<WithFullConfig>) {
    if (config !== this.config) {
      super.config = config;
      this.#server?.send({
        viewport: this.viewport,
        type: "config",
        config: combineFilters(this._configWithVisualLink),
      });
    }
  }

  applyEdit: DataSourceEditHandler = async () => true;
  closeTreeNode(keyOrIndex: string | number, cascade?: boolean) {
    console.log(`[MockDataSource] closeTree ${keyOrIndex} ${cascade}`);
  }
  async editRpcCall(rpcRequest: Omit<VuuRpcRequest, "vpId">) {
    console.log(`editRpcCall ${JSON.stringify(rpcRequest)}`);
    return {
      error: "Either viewport or server is undefined",
      type: "VP_EDIT_RPC_REJECT",
    } as VuuRpcEditError;
  }
  async menuRpcCall(rpcRequest: Omit<VuuRpcRequest, "vpId">) {
    console.log(`menuRpcCall ${JSON.stringify(rpcRequest)}`);
  }
  status: DataSourceStatus = "initialising";
  openTreeNode(keyOrIndex: string | number) {
    console.log(`[MockDataSource] openTree ${keyOrIndex}`);
  }
  remoteProcedureCall = async <T extends VuuRpcResponse = VuuRpcResponse>(
    message: VuuRpcRequest,
  ) => {
    console.log(`remoteProcedureCall ${JSON.stringify(message)}`);
    return {} as T;
  };
  select = () => {
    console.log("select");
  };

  selectedRowsCount = 0;
  rpcRequest?:
    | (<T extends VuuRpcResponse = VuuRpcResponse>(
        rpcRequest: Omit<VuuRpcRequest, "vpId">,
      ) => Promise<T>)
    | undefined;
  unsubscribe() {
    console.log("[MockDataSource] unsubscribe");
  }
}

export function MockDataSource(
  props: { server: Promise<ServerAPI> } & DataSourceConstructorProps,
): Promise<DataSource> {
  return new Promise((resolve) => {
    new MockDataSourceImpl(props, (dataSource) => {
      resolve(dataSource);
    });
  });
}
