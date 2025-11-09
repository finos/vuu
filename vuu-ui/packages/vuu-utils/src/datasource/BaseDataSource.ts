import type {
  DataSource,
  DataSourceConfig,
  DataSourceConstructorProps,
  DataSourceEvents,
  DataSourceFilter,
  DataSourceSubscribeCallback,
  DataSourceSubscribeProps,
  DataSourceSuspenseProps,
  WithBaseFilter,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";
import {
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuRange,
  VuuRpcEditRequest,
  VuuRpcEditResponse,
  VuuSort,
} from "@vuu-ui/vuu-protocol-types";
import { EventEmitter } from "../event-emitter";
import { uuid } from "../nanoid";
import {
  DataSourceConfigChanges,
  isConfigChanged,
  vanillaConfig,
  withConfigDefaults,
} from "./datasource-utils";
import { Range } from "../range-utils";

export type RuntimeConfig = WithBaseFilter<WithFullConfig> & {
  visualLink?: LinkDescriptorWithLabel;
};

export const defaultSuspenseProps: DataSourceSuspenseProps = {
  escalateToDisable: true,
};

export abstract class BaseDataSource
  extends EventEmitter<DataSourceEvents>
  implements Pick<DataSource, "config">
{
  // This should simply be id
  public viewport: string;

  protected _clientCallback: DataSourceSubscribeCallback | undefined;
  protected _config: RuntimeConfig = vanillaConfig;
  protected _impendingConfig: RuntimeConfig | undefined = undefined;
  protected _range = Range(0, 0);
  protected _size = 0;
  protected _title: string | undefined;
  protected _defaultSuspenseProps: DataSourceSuspenseProps;

  #freezeTimestamp: number | undefined = undefined;
  #pageCount = 0;

  private awaitingConfirmationOfConfigChanges = false;

  constructor({
    aggregations,
    baseFilterSpec,
    columns,
    filterSpec,
    groupBy,
    sort,
    suspenseProps = defaultSuspenseProps,
    title,
    viewport,
  }: Omit<DataSourceConstructorProps, "table">) {
    super();
    this._config = {
      ...this._config,
      aggregations: aggregations || this._config.aggregations,
      baseFilterSpec: baseFilterSpec || this._config.baseFilterSpec,
      columns: columns || this._config.columns,
      filterSpec: filterSpec || this._config.filterSpec,
      groupBy: groupBy || this._config.groupBy,
      sort: sort || this._config.sort,
    };
    this._defaultSuspenseProps = suspenseProps;
    this._title = title;
    this.viewport = viewport ?? "";
  }

  subscribe(
    {
      baseFilterSpec,
      columns,
      aggregations,
      range,
      sort,
      groupBy,
      filterSpec,
      viewport = this.viewport || (this.viewport = uuid()),
    }: DataSourceSubscribeProps,
    callback: DataSourceSubscribeCallback,
  ) {
    this._clientCallback = callback;
    this.viewport = viewport;

    if (
      aggregations ||
      baseFilterSpec ||
      columns ||
      filterSpec ||
      groupBy ||
      sort
    ) {
      this._config = {
        ...this._config,
        aggregations: aggregations || this._config.aggregations,
        baseFilterSpec: baseFilterSpec || this._config.baseFilterSpec,
        columns: columns || this._config.columns,
        filterSpec: filterSpec || this._config.filterSpec,
        groupBy: groupBy || this._config.groupBy,
        sort: sort || this._config.sort,
      };
    }

    // store the range before we await the server. It's is possible the
    // range will be updated from the client before we have been able to
    // subscribe. This ensures we will subscribe with latest value.
    if (range) {
      this._range = range;
      this.emit("range", range);
    }
  }

  get aggregations() {
    return this._config.aggregations;
  }

  set aggregations(aggregations: VuuAggregation[]) {
    this.config = {
      ...this._config,
      aggregations,
    };
    this.emit("config", this._config, this.range);
  }

  get baseFilter() {
    return this._config.baseFilterSpec;
  }

  set baseFilter(baseFilter: DataSourceFilter | undefined) {
    this.config = {
      ...this._config,
      baseFilterSpec: baseFilter,
    };
  }

  get columns() {
    console.log(
      `[BaseDataSource] get columns ${this._config.columns.join(", ")}`,
    );
    return this._config.columns;
  }

  set columns(columns: string[]) {
    console.log(`[BaseDataSource] set columns ${columns.join(", ")}`);
    this.config = {
      ...this._config,
      columns,
    };
    console.log(
      `[BaseDataSource] get columns ${this._config.columns.join(", ")}`,
    );
  }

  get filter() {
    return this._config.filterSpec;
  }

  set filter(filter: DataSourceFilter) {
    this.config = {
      ...this._config,
      filterSpec: filter,
    };
  }

  get isAwaitingConfirmationOfConfigChange() {
    return this._impendingConfig !== undefined;
  }

  protected confirmConfigChange() {
    if (this._impendingConfig) {
      this._config = this._impendingConfig;
      console.log(
        "%cclear impending config and emit config change",
        "color:red",
      );
      this._impendingConfig = undefined;
      this.emit("config", this._config, this.range, true);
    } else {
      throw Error(
        `[BaseDataSource], unexpected call to confirmConfigChange, no changes pending`,
      );
    }
  }

  get config() {
    return this._impendingConfig ?? this._config;
  }

  set config(config: WithBaseFilter<WithFullConfig>) {
    const confirmed = this.awaitingConfirmationOfConfigChanges
      ? true
      : undefined;
    // TODO what happens if config is set and we still have an unconfirmed change ?
    this.awaitingConfirmationOfConfigChanges = false;
    const configChanges = this.applyConfig(config);
    if (configChanges) {
      requestAnimationFrame(() => {
        this.emit("config", this.config, this.range, confirmed, configChanges);
      });
    }
  }

  get impendingConfig() {
    return this._impendingConfig;
  }
  /**
   * This can be set by subclass in cases where we want to await ACK of async request
   * before we go ahead and apply change to config.
   * It is set in place of 'config' itself and it is then the responsibility of the client
   * to call 'confirmConfigChange' once confirmation of the change is received.
   * Client can check 'isAwaitingConfirmationOfConfigChange' to see if a change is pending
   * confirmation.
   */
  set impendingConfig(config: undefined | WithBaseFilter<WithFullConfig>) {
    if (config) {
      this.awaitingConfirmationOfConfigChanges = true;
      const configChanges = this.applyConfig(config);
      if (configChanges) {
        this.emit("config", this.config, this.range, false, configChanges);
      }
    } else {
      throw Error(
        `[BaseDataSource] ''unsetting impendingConfig is not currently supported`,
      );
    }
  }

  get pageCount() {
    return this.#pageCount;
  }

  set pageCount(pageCount: number) {
    if (pageCount !== this.#pageCount) {
      this.#pageCount = pageCount;
      this.emit("page-count", pageCount);
    }
  }

  get range() {
    return this._range;
  }

  set range(range: Range) {
    if (range.from !== this._range.from || range.to !== this._range.to) {
      this._range = range;
      this.pageCount = Math.ceil(this._size / (range.to - range.from));
      this.rangeRequest(range);
      requestAnimationFrame(() => {
        this.emit("range", range);
      });
    }
  }

  get size() {
    return this._size;
  }

  set size(size: number) {
    this._size = size;
    if (this.range.to !== 0) {
      const pageCount = Math.ceil(size / (this.range.to - this.range.from));
      this.pageCount = pageCount;
    }
  }

  get sort() {
    return this._config.sort;
  }

  set sort(sort: VuuSort) {
    this.config = {
      ...this._config,
      sort,
    };
    this.emit("config", this._config, this.range);
  }

  get title() {
    return this._title ?? "";
  }

  set title(title: string) {
    this._title = title;
    this.emit("title-changed", this.viewport ?? "", title);
  }

  private applyConfig(
    config: WithBaseFilter<DataSourceConfig>,
    preserveExistingConfigAttributes = false,
  ): DataSourceConfigChanges | undefined {
    const { noChanges, ...otherChanges } = isConfigChanged(
      this._config,
      config,
    );
    if (noChanges !== true) {
      if (config) {
        const newConfig: DataSourceConfig =
          config?.filterSpec?.filter &&
          config?.filterSpec.filterStruct === undefined
            ? {
                ...config,
                filterSpec: {
                  filter: config.filterSpec.filter,
                  filterStruct: parseFilter(config.filterSpec.filter),
                },
              }
            : config;
        if (preserveExistingConfigAttributes) {
          if (this.awaitingConfirmationOfConfigChanges) {
            this._impendingConfig = {
              ...this._config,
              ...config,
            };
          } else {
            this._impendingConfig = undefined;
            this._config = {
              ...this._config,
              ...config,
            };
          }
        } else {
          if (this.awaitingConfirmationOfConfigChanges) {
            this._impendingConfig = withConfigDefaults(newConfig);
          } else {
            this._impendingConfig = undefined;
            this._config = withConfigDefaults(newConfig);
          }
        }
        return otherChanges;
      }
    }
  }

  freeze() {
    if (!this.isFrozen) {
      this.#freezeTimestamp = new Date().getTime();
      this.emit("freeze", true, this.#freezeTimestamp);
    } else {
      throw Error(
        "[BaseDataSource] cannot freeze, dataSource is already frozen",
      );
    }
  }
  unfreeze() {
    if (this.isFrozen) {
      const freezeTimestamp = this.#freezeTimestamp as number;
      this.#freezeTimestamp = undefined;
      this.emit("freeze", false, freezeTimestamp);
    } else {
      throw Error(
        "[BaseDataSource] cannot freeze, dataSource is already frozen",
      );
    }
  }
  get freezeTimestamp() {
    return this.#freezeTimestamp;
  }

  get isFrozen() {
    return typeof this.#freezeTimestamp === "number";
  }

  abstract rangeRequest(range: VuuRange): void;

  async editRpcCall(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rpcRequest: Omit<VuuRpcEditRequest, "vpId">,
  ): Promise<VuuRpcEditResponse> {
    throw Error(
      `[BaseDataSource] editRpcCall not supported in BaseDataSource, it must be implemented in child class`,
    );
  }
}
