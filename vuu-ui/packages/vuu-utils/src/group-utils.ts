import { RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { VuuGroupBy } from "@vuu-ui/vuu-protocol-types";

export function addGroupColumn(
  groupBy: VuuGroupBy,
  column: RuntimeColumnDescriptor,
) {
  if (groupBy) {
    return groupBy.concat(column.name);
  } else {
    return [column.name];
  }
}
