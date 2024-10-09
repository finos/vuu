import type {
  DataSource,
  DataSourceConstructorProps,
  DataSourceEvents,
  SubscribeCallback,
  WithFullConfig,
} from "@finos/vuu-data-types";
import { EventEmitter } from "../event-emitter";
import { LinkDescriptorWithLabel, VuuRange } from "@finos/vuu-protocol-types";
import { vanillaConfig } from "./datasource-utils";

export abstract class BaseDataSource
  extends EventEmitter<DataSourceEvents>
  implements Pick<DataSource, "config">
{
  // This should simply be id
  public viewport: string | undefined;

  protected _clientCallback: SubscribeCallback | undefined;
  protected _config: WithFullConfig & { visualLink?: LinkDescriptorWithLabel } =
    vanillaConfig;
  protected _range: VuuRange = { from: 0, to: 0 };
  protected _size = 0;
  protected _title: string | undefined;

  constructor({
    aggregations,
    columns,
    filterSpec,
    groupBy,
    sort,
    title,
    viewport,
  }: DataSourceConstructorProps) {
    super();
    this._config = {
      ...this._config,
      aggregations: aggregations || this._config.aggregations,
      columns: columns || this._config.columns,
      filterSpec: filterSpec || this._config.filterSpec,
      groupBy: groupBy || this._config.groupBy,
      sort: sort || this._config.sort,
    };

    this._title = title;
    this.viewport = viewport ?? "";
  }
}
