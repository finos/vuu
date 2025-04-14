import { VuuSort, VuuSortCol } from "@finos/vuu-protocol-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { buildColumnMap, ReverseColumnMap } from "@finos/vuu-utils";
import { ColumnDef, type SortingState } from "@tanstack/react-table";

export const tanstackSortToVuuSort = (
  sortingState: SortingState,
  reverseColumnMap: ReverseColumnMap,
): VuuSort => ({
  sortDefs: sortingState.map<VuuSortCol>((columnSort) => {
    return {
      column: reverseColumnMap[parseInt(columnSort.id)],
      sortType: columnSort.desc ? "D" : "A",
    };
  }),
});

export const vuuColumnsToTanstackColumns = (columns: ColumnDescriptor[]) => {
  const columnMap = buildColumnMap(columns.map((col) => col.name));

  return columns.map<ColumnDef<unknown>>(({ label, name }) => ({
    accessorKey: `${columnMap[name]}`,
    header: label,
  }));
};
