import { VuuFilter } from "@finos/vuu-protocol-types";
import { Filter } from "@finos/vuu-filters";
import { KeyedColumnDescriptor } from "../grid-model";

export interface ContextMenuOptions {
  column?: KeyedColumnDescriptor;
  filter?: Filter;
  sort?: VuuFilter;
}
