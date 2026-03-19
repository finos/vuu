import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import {
  Filter,
  MultiClauseFilter,
  MultiValueFilterClause,
  SingleValueFilterClause,
} from "@vuu-ui/vuu-filter-types";
import { ColumnMap, isFilter } from "@vuu-ui/vuu-utils";
import { parseFilter } from "./FilterParser";
import { VuuDataRow } from "@vuu-ui/vuu-protocol-types";
import { DataRow } from "@vuu-ui/vuu-table-types";

const filterPredicateMap = new Map<string, FilterPredicate>();
const dataRowFilterPredicateMap = new Map<string, DataRowFilterPredicate>();
const filterReject = () => false;

export type FilterPredicate = (row: DataSourceRow | VuuDataRow) => boolean;
export type DataRowFilterPredicate = (row: DataRow) => boolean;

export function getFilterPredicate(
  columnMap: ColumnMap,
  filterQuery: string,
): FilterPredicate;
export function getFilterPredicate(filterQuery: string): DataRowFilterPredicate;
export function getFilterPredicate(
  columnMapOrFilter: ColumnMap | string,
  filterQuery?: string,
): FilterPredicate | DataRowFilterPredicate {
  if (typeof columnMapOrFilter === "string") {
    let predicate = dataRowFilterPredicateMap.get(columnMapOrFilter);
    if (predicate) {
      return predicate;
    }
    // TODO we need to clear cache if columns change. How do we identify this :
    try {
      const filter = parseFilter(columnMapOrFilter);
      predicate = filterPredicate(filter);
      dataRowFilterPredicateMap.set(columnMapOrFilter, predicate);
      return predicate;
    } catch (err) {
      console.warn(
        `filter-evaluation-utils, failed to parse filter "${filterQuery}"`,
      );
      return filterReject;
    }
  } else if (filterQuery) {
    let predicate = filterPredicateMap.get(filterQuery);
    if (predicate) {
      return predicate;
    }
    // TODO we need to clear cache if columns change. How do we identify this :
    try {
      const filter = parseFilter(filterQuery);
      predicate = filterPredicate(columnMapOrFilter, filter);
      filterPredicateMap.set(filterQuery, predicate);
      return predicate;
    } catch (err) {
      console.warn(
        `filter-evaluation-utils, failed to parse filter "${filterQuery}"`,
      );
      return filterReject;
    }
  } else {
    throw Error(`[getFilterPredicate] invalid params`);
  }
}

/**
 * Generates a filterPredicate that can be used to test a row against a filter
 * Two row formats supported:
 * -  DataRow,  used by Tables, when evaluatingn a Menu filter.
 * - DataSourceRow, used by local data source, like ArrayDataSOurce
 */

// prettier-ignore
export function filterPredicate(columnMap: ColumnMap,filter: Filter): FilterPredicate;
export function filterPredicate(filter: Filter): DataRowFilterPredicate;
export function filterPredicate(
  columnMapOrFilter: ColumnMap | Filter,
  filter?: Filter,
): FilterPredicate | DataRowFilterPredicate {
  if (isFilter(columnMapOrFilter)) {
    switch (columnMapOrFilter.op) {
      case "in":
        return testDataRowInclude(columnMapOrFilter);
      case "=":
        return testDataRowEQ(columnMapOrFilter);
      case ">":
        return testDataRowGT(columnMapOrFilter);
      case ">=":
        return testDataRowGE(columnMapOrFilter);
      case "<":
        return testDataRowLT(columnMapOrFilter);
      case "<=":
        return testDataRowLE(columnMapOrFilter);
      case "ends":
        return testDataRowEW(columnMapOrFilter);
      case "starts":
        return testDataRowSW(columnMapOrFilter);
      case "contains":
        return testDataRowContains(columnMapOrFilter);
      case "and":
        return testDataRowAND(columnMapOrFilter as MultiClauseFilter<"and">);
      case "or":
        return testDataRowOR(columnMapOrFilter as MultiClauseFilter<"or">);
      default:
        console.log(`unrecognized filter type ${columnMapOrFilter.op}`);
        return () => true;
    }
  } else if (filter) {
    //TODO convert filter to include colIdx ratherthan colName, so we don't have to pass cols
    switch (filter.op) {
      case "in":
        return testInclude(columnMapOrFilter, filter);
      case "=":
        return testEQ(columnMapOrFilter, filter);
      case ">":
        return testGT(columnMapOrFilter, filter);
      case ">=":
        return testGE(columnMapOrFilter, filter);
      case "<":
        return testLT(columnMapOrFilter, filter);
      case "<=":
        return testLE(columnMapOrFilter, filter);
      case "ends":
        return testEW(columnMapOrFilter, filter);
      case "starts":
        return testSW(columnMapOrFilter, filter);
      case "contains":
        return testContains(columnMapOrFilter, filter);
      case "and":
        return testAND(columnMapOrFilter, filter as MultiClauseFilter<"and">);
      case "or":
        return testOR(columnMapOrFilter, filter as MultiClauseFilter<"or">);
      default:
        console.log(`unrecognized filter type ${filter.op}`);
        return () => true;
    }
  } else {
    throw Error(`[filterPredicate] invalid params`);
  }
}

const testInclude = (
  columnMap: ColumnMap,
  filter: MultiValueFilterClause,
): FilterPredicate => {
  return (row) =>
    (filter.values as unknown[]).indexOf(row[columnMap[filter.column]]) !== -1;
};

const testDataRowInclude = (
  filter: MultiValueFilterClause,
): DataRowFilterPredicate => {
  return (row) =>
    (filter.values as unknown[]).indexOf(row[filter.column]) !== -1;
};

const testEQ = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  return (row) => row[columnMap[filter.column]] === filter.value;
};

const testDataRowEQ = (
  filter: SingleValueFilterClause,
): DataRowFilterPredicate => {
  return (row) => row[filter.column] === filter.value;
};

const testGT = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  return (row) => row[columnMap[filter.column]] > filter.value;
};

const testDataRowGT = (
  filter: SingleValueFilterClause,
): DataRowFilterPredicate => {
  return (row) => row[filter.column] > filter.value;
};

const testGE = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  return (row) => row[columnMap[filter.column]] >= filter.value;
};

const testDataRowGE = (
  filter: SingleValueFilterClause,
): DataRowFilterPredicate => {
  return (row) => row[filter.column] >= filter.value;
};

const testLT = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  return (row) => row[columnMap[filter.column]] < filter.value;
};

const testDataRowLT = (
  filter: SingleValueFilterClause,
): DataRowFilterPredicate => {
  return (row) => row[filter.column] < filter.value;
};

const testLE = (
  columnMap: ColumnMap,
  filter: SingleValueFilterClause,
): FilterPredicate => {
  return (row) => row[columnMap[filter.column]] <= filter.value;
};

const testDataRowLE = (
  filter: SingleValueFilterClause,
): DataRowFilterPredicate => {
  return (row) => row[filter.column] <= filter.value;
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

const testDataRowEW = (
  filter: SingleValueFilterClause,
): DataRowFilterPredicate => {
  const filterValue = filter.value as string;
  if (typeof filterValue !== "string") {
    throw Error("string filter applied to value of wrong type");
  }
  return (row) => {
    const rowValue = row[filter.column];
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

const testDataRowSW = (
  filter: SingleValueFilterClause,
): DataRowFilterPredicate => {
  const filterValue = filter.value as string;
  if (typeof filterValue !== "string") {
    throw Error("string filter applied to value of wrong type");
  }
  return (row) => {
    const rowValue = row[filter.column];
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

const testDataRowContains = (
  filter: SingleValueFilterClause,
): DataRowFilterPredicate => {
  const filterValue = filter.value as string;
  if (typeof filterValue !== "string") {
    throw Error("string filter applied to value of wrong type");
  }
  return (row) => {
    const rowValue = row[filter.column];
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

const testDataRowAND = (
  filter: MultiClauseFilter<"and">,
): DataRowFilterPredicate => {
  const filters = filter.filters.map((f1) => filterPredicate(f1));
  return (row) => filters.every((fn) => fn(row));
};

function testOR(
  columnMap: ColumnMap,
  filter: MultiClauseFilter<"or">,
): FilterPredicate {
  const filters = filter.filters.map((f1) => filterPredicate(columnMap, f1));
  return (row) => filters.some((fn) => fn(row));
}

function testDataRowOR(
  filter: MultiClauseFilter<"or">,
): DataRowFilterPredicate {
  const filters = filter.filters.map((f1) => filterPredicate(f1));
  return (row) => filters.some((fn) => fn(row));
}
