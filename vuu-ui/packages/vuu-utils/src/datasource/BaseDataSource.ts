import type {
  DataSource,
  DataSourceConfig,
  DataSourceConstructorProps,
  DataSourceEvents,
  DataSourceFilter,
  SubscribeCallback,
  SubscribeProps,
  WithBaseFilter,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";
import {
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuRange,
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

export type RuntimeConfig = WithBaseFilter<WithFullConfig> & {
  visualLink?: LinkDescriptorWithLabel;
};

export abstract class BaseDataSource
  extends EventEmitter<DataSourceEvents>
  implements Pick<DataSource, "config">
{
  // This should simply be id
  public viewport: string;

  protected _clientCallback: SubscribeCallback | undefined;
  protected _config: RuntimeConfig = vanillaConfig;
  protected _impendingConfig: RuntimeConfig | undefined = undefined;
  protected _range: VuuRange = { from: 0, to: 0 };
  protected _size = 0;
  protected _title: string | undefined;

  #pageCount = 0;

  private awaitingConfirmationOfConfigChanges = false;

  constructor({
    aggregations,
    baseFilterSpec,
    columns,
    filterSpec,
    groupBy,
    sort,
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
    }: SubscribeProps,
    callback: SubscribeCallback,
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
    return this._config.columns;
  }

  set columns(columns: string[]) {
    this.config = {
      ...this._config,
      columns,
    };
    this.emit("config", this._config, this.range);
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
      this.emit("config", this.config, this.range, confirmed, configChanges);
    }
  }

  set impendingConfig(config: WithBaseFilter<WithFullConfig>) {
    this.awaitingConfirmationOfConfigChanges = true;
    const configChanges = this.applyConfig(config);
    if (configChanges) {
      this.emit("config", this.config, this.range, false, configChanges);
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

  set range(range: VuuRange) {
    if (range.from !== this._range.from || range.to !== this._range.to) {
      this._range = range;
      this.pageCount = Math.ceil(this._size / (range.to - range.from));

      this.rangeRequest(range);
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

  // Public while we use this from useSessionDataSource
  public applyConfig(
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

  abstract rangeRequest(range: VuuRange): void;
}
