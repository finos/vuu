import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import {
  Filter,
  MultiClauseFilter,
  MultiValueFilterClause,
  SingleValueFilterClause,
} from "@vuu-ui/vuu-filter-types";
import { ColumnMap } from "@vuu-ui/vuu-utils";
import { parseFilter } from "./FilterParser";
import { VuuDataRow } from "@vuu-ui/vuu-protocol-types";

const filterPredicateMap = new Map<string, FilterPredicate>();
const filterReject = () => false;

export const getFilterPredicate = (
  columnMap: ColumnMap,
  filterQuery: string,
): FilterPredicate => {
  let predicate = filterPredicateMap.get(filterQuery);
  if (predicate) {
    return predicate;
  }
  // TODO we need to clear cache if columns change. How do we identify this :
  try {
    const filter = parseFilter(filterQuery);
    predicate = filterPredicate(columnMap, filter);
    filterPredicateMap.set(filterQuery, predicate);
    return predicate;
  } catch (err) {
    console.warn(
      `filter-evaluation-utils, failed to parse filter "${filterQuery}"`,
    );
    return filterReject;
  }
};

export function filterPredicate(
  columnMap: ColumnMap,
  filter: Filter,
): FilterPredicate {
  //TODO convert filter to include colIdx ratherthan colName, so we don't have to pass cols
  switch (filter.op) {
    case "in":
      return testInclude(columnMap, filter);
    case "=":
      return testEQ(columnMap, filter);
    case ">":
      return testGT(columnMap, filter);
    case ">=":
      return testGE(columnMap, filter);
    case "<":
      return testLT(columnMap, filter);
    case "<=":
      return testLE(columnMap, filter);
    case "ends":
      return testEW(columnMap, filter);
    case "starts":
      return testSW(columnMap, filter);
    case "contains":
      return testContains(columnMap, filter);
    case "and":
      return testAND(columnMap, filter as MultiClauseFilter<"and">);
    case "or":
      return testOR(columnMap, filter as MultiClauseFilter<"or">);
    default:
      console.log(`unrecognized filter type ${filter.op}`);
      return () => true;
  }
}

export type FilterPredicate = (row: DataSourceRow | VuuDataRow) => boolean;

const testInclude = (
  columnMap: ColumnMap,
  filter: MultiValueFilterClause,
): FilterPredicate => {
  return (row) =>
    (filter.values as unknown[]).indexOf(row[columnMap[filter.column]]) !== -1;
};

const testEQ = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  return (row) => row[columnMap[filter.column]] === filter.value;
};

const testGT = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  return (row) => row[columnMap[filter.column]] > filter.value;
};
const testGE = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  return (row) => row[columnMap[filter.column]] >= filter.value;
};

const testLT = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  return (row) => row[columnMap[filter.column]] < filter.value;
};
const testLE = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  return (row) => row[columnMap[filter.column]] <= filter.value;
};

const testEW = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  const filterValue = filter.value as string;
  if (typeof filterValue !== "string") {
    throw Error("string filter applied to value of wrong type");
  }
  return (row) => {
    const rowValue = row[columnMap[filter.column]];
    if (typeof rowValue !== "string") {
      throw Error("string filter applied to value of wrong type");
    }
    return rowValue.toLowerCase().endsWith(filterValue.toLowerCase());
  };
};

const testSW = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  const filterValue = filter.value as string;
  if (typeof filterValue !== "string") {
    throw Error("string filter applied to value of wrong type");
  }
  return (row) => {
    const rowValue = row[columnMap[filter.column]];
    if (typeof rowValue !== "string") {
      throw Error("string filter applied to value of wrong type");
    }
    return rowValue.toLowerCase().startsWith(filterValue.toLowerCase());
  };
};

const testContains = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  const filterValue = filter.value as string;
  if (typeof filterValue !== "string") {
    throw Error("string filter applied to value of wrong type");
  }
  return (row) => {
    const rowValue = row[columnMap[filter.column]];
    if (typeof rowValue !== "string") {
      throw Error("string filter applied to value of wrong type");
    }
    return rowValue.toLowerCase().includes(filterValue.toLowerCase());
  };
};

const testAND = (
  columnMap: ColumnMap,
  filter: MultiClauseFilter<"and">,
): FilterPredicate => {
  const filters = filter.filters.map((f1) => filterPredicate(columnMap, f1));
  return (row) => filters.every((fn) => fn(row));
};

function testOR(
  columnMap: ColumnMap,
  filter: MultiClauseFilter<"or">,
): FilterPredicate {
  const filters = filter.filters.map((f1) => filterPredicate(columnMap, f1));
  return (row) => filters.some((fn) => fn(row));
}
