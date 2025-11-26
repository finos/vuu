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
  stripVisualLink,
  vanillaConfig,
  withConfigDefaults,
} from "./datasource-utils";
import { Range } from "../range-utils";
import { filterAsQuery } from "../filters";
import { Filter } from "@vuu-ui/vuu-filter-types";

export type ConfigWithVisualLink = WithBaseFilter<WithFullConfig> & {
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
  protected _configWithVisualLink: ConfigWithVisualLink = vanillaConfig;
  protected _impendingConfigWithVisualLink: ConfigWithVisualLink | undefined =
    undefined;
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
    this._configWithVisualLink = {
      ...this._configWithVisualLink,
      aggregations: aggregations || this._configWithVisualLink.aggregations,
      baseFilterSpec:
        baseFilterSpec || this._configWithVisualLink.baseFilterSpec,
      columns: columns || this._configWithVisualLink.columns,
      filterSpec: filterSpec || this._configWithVisualLink.filterSpec,
      groupBy: groupBy || this._configWithVisualLink.groupBy,
      sort: sort || this._configWithVisualLink.sort,
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
      this._configWithVisualLink = {
        ...this._configWithVisualLink,
        aggregations: aggregations || this._configWithVisualLink.aggregations,
        baseFilterSpec:
          baseFilterSpec || this._configWithVisualLink.baseFilterSpec,
        columns: columns || this._configWithVisualLink.columns,
        filterSpec: filterSpec || this._configWithVisualLink.filterSpec,
        groupBy: groupBy || this._configWithVisualLink.groupBy,
        sort: sort || this._configWithVisualLink.sort,
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
    return this._configWithVisualLink.aggregations;
  }

  set aggregations(aggregations: VuuAggregation[]) {
    this.config = {
      ...this._configWithVisualLink,
      aggregations,
    };
    this.emit("config", this._configWithVisualLink, this.range);
  }

  get baseFilter() {
    return this._configWithVisualLink.baseFilterSpec;
  }

  set baseFilter(baseFilter: DataSourceFilter | undefined) {
    this.config = {
      ...this._configWithVisualLink,
      baseFilterSpec: baseFilter,
    };
  }

  get columns() {
    return this._configWithVisualLink.columns;
  }

  set columns(columns: string[]) {
    this.config = {
      ...this._configWithVisualLink,
      columns,
    };
  }

  get filter() {
    return this._configWithVisualLink.filterSpec;
  }

  set filter(filter: DataSourceFilter) {
    this.config = {
      ...this._configWithVisualLink,
      filterSpec: filter,
    };
  }

  setFilter(filter: Filter) {
    const dataSourceFilter: DataSourceFilter = {
      filter: filterAsQuery(filter),
      filterStruct: filter,
    };
    this.filter = dataSourceFilter;
  }

  clearFilter() {
    this.filter = { filter: "" };
  }

  get isAwaitingConfirmationOfConfigChange() {
    return this._impendingConfigWithVisualLink !== undefined;
  }

  protected confirmConfigChange() {
    if (this._impendingConfigWithVisualLink) {
      this._configWithVisualLink = this._impendingConfigWithVisualLink;
      console.log(
        "%cclear impending config and emit config change",
        "color:red",
      );
      this._impendingConfigWithVisualLink = undefined;
      this.emit("config", this._configWithVisualLink, this.range, true);
    } else {
      throw Error(
        `[BaseDataSource], unexpected call to confirmConfigChange, no changes pending`,
      );
    }
  }

  get config() {
    return stripVisualLink(
      this._impendingConfigWithVisualLink ?? this._configWithVisualLink,
    );
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
        this.emit(
          "config",
          this._configWithVisualLink,
          this.range,
          confirmed,
          configChanges,
        );
      });
    }
  }

  get impendingConfig() {
    return this._impendingConfigWithVisualLink;
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
    return this._configWithVisualLink.sort;
  }

  set sort(sort: VuuSort) {
    this.config = {
      ...this._configWithVisualLink,
      sort,
    };
    this.emit("config", this._configWithVisualLink, this.range);
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
      this._configWithVisualLink,
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
            this._impendingConfigWithVisualLink = {
              ...this._configWithVisualLink,
              ...config,
            };
          } else {
            this._impendingConfigWithVisualLink = undefined;
            this._configWithVisualLink = {
              ...this._configWithVisualLink,
              ...config,
            };
          }
        } else {
          if (this.awaitingConfirmationOfConfigChanges) {
            this._impendingConfigWithVisualLink = withConfigDefaults(newConfig);
          } else {
            this._impendingConfigWithVisualLink = undefined;
            this._configWithVisualLink = withConfigDefaults(newConfig);
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
