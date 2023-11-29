import { Filter } from "@finos/vuu-filter-types";
import { VuuFilter } from "@finos/vuu-protocol-types";
import { RuntimeColumnDescriptor } from "@finos/vuu-datagrid-types";

export interface ContextMenuOptions {
  column?: RuntimeColumnDescriptor;
  filter?: Filter;
  sort?: VuuFilter;
}
