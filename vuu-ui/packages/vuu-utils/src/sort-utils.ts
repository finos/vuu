import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
} from "@finos/vuu-datagrid-types";
import { VuuSort, VuuSortCol, VuuSortType } from "@finos/vuu-protocol-types";

const toggle = (sortType: VuuSortType) => (sortType === "A" ? "D" : "A");

// Given an existing sort spec and a column we wish to sort by,
// construct and return a new sort spec.
export const applySort = (
  { sortDefs }: VuuSort,
  { name: column }: ColumnDescriptor,
  extendSort = false,
  sortType?: VuuSortType
): VuuSort => {
  if (extendSort) {
    return {
      sortDefs: sortDefs.concat({
        column,
        sortType: sortType ?? "A",
      }),
    };
  }

  const newSortType =
    typeof sortType === "string"
      ? sortType
      : sortDefs.length === 1 && sortDefs[0].column === column
      ? toggle(sortDefs[0].sortType)
      : "A";
  return {
    sortDefs: [{ column, sortType: newSortType }],
  };
};

export const setSortColumn = (
  { sortDefs }: VuuSort,
  column: RuntimeColumnDescriptor,
  sortType?: "A" | "D"
): VuuSort => {
  if (sortType === undefined) {
    const columnSort = sortDefs.find((item) => item.column === column.name);
    if (columnSort) {
      return {
        sortDefs: [
          {
            column: column.name,
            sortType: columnSort.sortType === "A" ? "D" : "A",
          },
        ],
      };
    }
  }
  return { sortDefs: [{ column: column.name, sortType: sortType ?? "A" }] };
};

export const addSortColumn = (
  { sortDefs }: VuuSort,
  column: RuntimeColumnDescriptor,
  sortType: "A" | "D" = "A"
): VuuSort => {
  const sortEntry: VuuSortCol = { column: column.name, sortType };
  if (sortDefs.length > 0) {
    return {
      sortDefs: sortDefs.concat(sortEntry),
    };
  } else {
    return { sortDefs: [sortEntry] };
  }
};
