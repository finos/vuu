import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuGroupBy } from "@finos/vuu-protocol-types";

export function addGroupColumn(
  groupBy: VuuGroupBy,
  column: KeyedColumnDescriptor
) {
  if (groupBy) {
    return groupBy.concat(column.name);
  } else {
    return [column.name];
  }
}
