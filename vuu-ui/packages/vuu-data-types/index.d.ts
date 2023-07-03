import { VuuFilter } from "@finos/vuu-protocol-types";
import { Filter } from "@finos/vuu-filter-types";

export interface DataSourceFilter extends VuuFilter {
  filterStruct?: Filter;
}

export interface NamedDataSourceFilter extends DataSourceFilter {
  id?: string;
  name?: string;
}
