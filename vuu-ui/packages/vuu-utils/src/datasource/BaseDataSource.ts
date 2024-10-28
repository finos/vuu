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
} from "@finos/vuu-data-types";
import { parseFilter } from "@finos/vuu-filter-parser";
import {
  LinkDescriptorWithLabel,
  VuuAggregation,
  VuuRange,
  VuuSort,
} from "@finos/vuu-protocol-types";
import { EventEmitter } from "../event-emitter";
import { uuid } from "../nanoid";
import {
  DataSourceConfigChanges,
  isConfigChanged,
  vanillaConfig,
  withConfigDefaults,
} from "./datasource-utils";

export abstract class BaseDataSource
  extends EventEmitter<DataSourceEvents>
  implements Pick<DataSource, "config">
{
  // This should simply be id
  public viewport: string;

  protected _clientCallback: SubscribeCallback | undefined;
  protected _config: WithBaseFilter<WithFullConfig> & {
    visualLink?: LinkDescriptorWithLabel;
  } = vanillaConfig;
  protected _range: VuuRange = { from: 0, to: 0 };
  protected _size = 0;
  protected _title: string | undefined;

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
    this.emit("config", this._config);
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
    this.emit("config", this._config);
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

  get config() {
    return this._config;
  }

  set config(config: WithBaseFilter<WithFullConfig>) {
    const configChanges = this.applyConfig(config);
    if (configChanges) {
      this.emit("config", this._config, undefined, configChanges);
    }
  }

  get range() {
    return this._range;
  }

  set range(range: VuuRange) {
    if (range.from !== this._range.from || range.to !== this._range.to) {
      this._range = range;
      this.rangeRequest(range);
    }
  }

  get size() {
    return this._size;
  }

  get sort() {
    return this._config.sort;
  }

  set sort(sort: VuuSort) {
    this.config = {
      ...this._config,
      sort,
    };
    this.emit("config", this._config);
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
          this._config = {
            ...this._config,
            ...config,
          };
        } else {
          this._config = withConfigDefaults(newConfig);
        }
        return otherChanges;
      }
    }
  }

  abstract rangeRequest(range: VuuRange): void;
}
