import { Filter } from "@finos/vuu-filter-types";
import { VuuFilter } from "@finos/vuu-protocol-types";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";

export interface ContextMenuOptions {
  column?: KeyedColumnDescriptor;
  filter?: Filter;
  sort?: VuuFilter;
}
