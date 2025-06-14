import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { VuuGroupBy } from "@vuu-ui/vuu-protocol-types";

export function addGroupColumn(groupBy: VuuGroupBy, column: ColumnDescriptor) {
  if (groupBy) {
    return groupBy.concat(column.name);
  } else {
    return [column.name];
  }
}

export type ColumnGroupStatus =
  | "no-groupby"
  | "single-groupby-other-column"
  | "single-groupby"
  | "multi-groupby-other-columns"
  | "multi-groupby-includes-column";

/**
 * Given a VuuGroupby definition and a column, determine whether the given column
 * is included in the grouping and if so, in what position/direction.
 */
export const getGroupStatus = (
  columnName: string,
  groupBy?: VuuGroupBy,
): ColumnGroupStatus => {
  if (groupBy === undefined || groupBy.length === 0) {
    return "no-groupby";
  } else {
    const indexPos = groupBy.indexOf(columnName);
    if (indexPos === -1) {
      return groupBy.length === 1
        ? "single-groupby-other-column"
        : "multi-groupby-other-columns";
    } else {
      return groupBy.length === 1
        ? "single-groupby"
        : "single-groupby-other-column";
    }
  }
};
