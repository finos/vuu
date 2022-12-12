import { VuuFilter } from "@vuu-ui/vuu-protocol-types";
import { Filter } from "@vuu-ui/vuu-filters";
import { KeyedColumnDescriptor } from "../grid-model";

export interface ContextMenuOptions {
  column?: KeyedColumnDescriptor;
  filter?: Filter;
  sort?: VuuFilter;
}
