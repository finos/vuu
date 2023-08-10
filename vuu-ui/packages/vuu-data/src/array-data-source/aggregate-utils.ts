import {
  VuuAggregation,
  VuuGroupBy,
  VuuRange,
  VuuRowDataItemType,
  VuuSort,
} from "@finos/vuu-protocol-types";
import {
  collapseGroup,
  expandGroup,
  GroupMap,
  groupRows,
  KeyList,
} from "./group-utils";

import { DataSourceRow } from "@finos/vuu-data-types";
import { ColumnMap } from "@finos/vuu-utils";
import { group } from "console";

export const count = (arr: any[]) => arr.length;

export const aggregateData = (
  aggregations: VuuAggregation[],
  targetData: readonly DataSourceRow[],
  groupBy: VuuGroupBy,
  leafData: readonly DataSourceRow[],
  columnMap: ColumnMap,
  groupMap: GroupMap
) => {
  const aggColumn = getAggColumn(columnMap, aggregations);
  const aggType = aggregations[aggregations.length - 1].aggType;
  const groupIndices = groupBy.map<number>((column) => columnMap[column]);

  console.log("!!!! groupIndices", groupIndices);
  console.log("!!!! aggColumn", aggColumn);
  console.log("!!!! aggType", aggType);
  console.log("!!!! targetData", targetData);
  console.log("!!!! columnMap", columnMap);
  console.log("!!!! groupmap", groupMap);

  switch (aggType) {
    case 1:
      return aggregateSum(
        groupMap,
        leafData,
        columnMap,
        aggregations,
        targetData,
        groupIndices
      );
    case 2:
      return aggregateAverage(
        groupMap,
        leafData,
        columnMap,
        aggregations,
        targetData,
        groupIndices
      );
    case 3:
      return aggregateCount(groupMap, columnMap, aggregations, targetData, groupIndices);
    case 4:
      return aggregateHigh(
        groupMap,
        leafData,
        columnMap,
        aggregations,
        targetData,
        groupIndices
      );
    case 5:
      return aggregateLow(
        groupMap,
        leafData,
        columnMap,
        aggregations,
        targetData,
        groupIndices
      );
    case 6:
      return aggregateDistinct(
        groupMap,
        leafData,
        columnMap,
        aggregations,
        targetData,
        groupIndices
      );
  }

  // console.log("!!!! inside aggregateData");
  // console.log("!!!! groupmap", groupMap);
  // console.log("!!!! targetData", targetData);
  // console.log("!!!! leaf rows", leafData);
  // console.log("!!!! columnMap", columnMap);
  // console.log("!!!! aggregations", aggregations);

  // let count = aggregateCount(groupMap);
  // console.log("!!!! count", count);
  // let sum = aggregateSum(groupMap, leafData, columnMap, aggregations);
  // console.log("!!!! sum", sum);
  // let average = aggregateAverage(groupMap, leafData, columnMap, aggregations);
  // console.log("!!!! average", average);
  // let distinct = aggregateDistinct(groupMap, leafData, columnMap, aggregations);
  // console.log("!!!! distinct", distinct);
  // let high = aggregateHigh(groupMap, leafData, columnMap, aggregations);
  // console.log("!!!! high", high);
  // let low = aggregateLow(groupMap, leafData, columnMap, aggregations);
  // console.log("!!!! low", low);
};

function aggregateCount(
  groupMap: GroupMap,
  columnMap: ColumnMap,
  aggregations: VuuAggregation[],
  targetData: readonly DataSourceRow[],
  groupIndices : number[],
): { [key: string]: number } {
  const counts: { [key: string]: number } = {};
  const aggColumn = getAggColumn(columnMap, aggregations);

  function countRecursive(map: GroupMap | KeyList) {
    if (Array.isArray(map)) {
      return map.length;
    } else {
      let count = 0;
      for (const key in map) {
        count += 1 + countRecursive(map[key]);
      }
      return count;
    }
  }

  for (const key in groupMap) {
    const count = countRecursive(groupMap[key]);
    counts[key] = count;
  }

  for (let index = 0; index < targetData.length; index++) {
    for (const key in counts) {
      if (targetData[index][groupIndices[0]] === key) {
        targetData[index][aggColumn] = counts[key];
      }
    }
  }

  console.log("!!!! targetData", targetData);
  console.log("!!!! counts", counts);
  return counts;
}

function getAggColumn(columnMap: ColumnMap, aggregations: VuuAggregation[]) {
  console.log("!!!! aggregation length", aggregations.length);
  const columnName = aggregations[aggregations.length - 1].column;
  const columnNumber = columnMap[columnName];
  return columnNumber;
}

function aggregateSum(
  groupMap: GroupMap,
  leafData: readonly DataSourceRow[],
  columnMap: ColumnMap,
  aggregations: VuuAggregation[],
  targetData: readonly DataSourceRow[],
  groupIndices : number[],
): { [key: string]: number } {
  const sums: { [key: string]: number } = {};
  const aggColumn = getAggColumn(columnMap, aggregations);

  function sumRecursive(
    map: GroupMap | KeyList,
    leafData: readonly DataSourceRow[],
    aggColumn: number
  ) {
    if (Array.isArray(map)) {
      let sum = 0;
      for (const key of map) {
        sum += Number(leafData[key][aggColumn]);
      }
      return sum;
    } else {
      let sum = 0;
      for (const key in map) {
        sum += sumRecursive(map[key], leafData, aggColumn);
      }
      return sum;
    }
  }

  for (const key in groupMap) {
    console.log(key);
    const sum = Number(sumRecursive(groupMap[key], leafData, aggColumn));
    sums[key] = sum;
  }

  for (let index = 0; index < targetData.length; index++) {
    for (const key in sums) {
      if (targetData[index][groupIndices[0]] === key) {
        targetData[index][aggColumn] = sums[key];
      }
    }
  }

  console.log("!!!! targetData", targetData);
  console.log("!!!! sums", sums);
  return sums;
}

function aggregateAverage(
  groupMap: GroupMap,
  leafData: readonly DataSourceRow[],
  columnMap: ColumnMap,
  aggregations: VuuAggregation[],
  targetData: readonly DataSourceRow[],
  groupIndices : number[],
): { [key: string]: number } {
  const averages: { [key: string]: number } = {};
  const aggColumn = getAggColumn(columnMap, aggregations);

  let count = aggregateCount(groupMap, columnMap, aggregations, targetData, groupIndices);
  let sum = aggregateSum(
    groupMap,
    leafData,
    columnMap,
    aggregations,
    targetData,
    groupIndices
  );

  for (const key in count) {
    let average = 0;
    average = sum[key] / count[key];
    averages[key] = average;
  }

  for (let index = 0; index < targetData.length; index++) {
    for (const key in averages) {
      if (targetData[index][groupIndices[0]] === key) {
        targetData[index][aggColumn] = averages[key];
      }
    }
  }

  console.log("!!!! targetData", targetData);
  console.log("!!!! averages", averages);
  return averages;
}

function getLeafColumnData(
  map: GroupMap | KeyList,
  leafData: readonly DataSourceRow[],
  aggColumn: number,
) {
  let data = [];

  if (Array.isArray(map)) {
    for (const key of map) {
      data.push(leafData[key][aggColumn]);
    }
  } else {
    for (const key in map) {
      data.push(getLeafColumnData(map[key], leafData, aggColumn));
    }
  }

  return data;
}

function aggregateDistinct(
  groupMap: GroupMap,
  leafData: readonly DataSourceRow[],
  columnMap: ColumnMap,
  aggregations: VuuAggregation[],
  targetData: readonly DataSourceRow[],
  groupIndices : number[],
): { [key: string]: number } {
  const distincts: { [key: string]: number } = {};
  const aggColumn = getAggColumn(columnMap, aggregations);

  for (const key in groupMap) {
    const leafColumnData = getLeafColumnData(
      groupMap[key],
      leafData,
      aggColumn
    );
    const distinct: any = [...new Set(leafColumnData)];

    distincts[key] = distinct;
  }

  for (let index = 0; index < targetData.length; index++) {
    for (const key in distincts) {
      if (targetData[index][groupIndices[0]] === key) {
        targetData[index][aggColumn] = distincts[key];
      }
    }
  }

  console.log("!!!! targetData", targetData);
  console.log("!!!! distincts", distincts);
  return distincts;
}

function aggregateHigh(
  groupMap: GroupMap,
  leafData: readonly DataSourceRow[],
  columnMap: ColumnMap,
  aggregations: VuuAggregation[],
  targetData: readonly DataSourceRow[],
  groupIndices : number[],
): { [key: string]: number } {
  const highs: { [key: string]: number } = {};
  const aggColumn = getAggColumn(columnMap, aggregations);
  console.log("!!!! aggColumn", aggColumn);

  for (const key in groupMap) {
    const leafColumnData = getLeafColumnData(
      groupMap[key],
      leafData,
      aggColumn
    );
    const maxNumber = Math.max(...leafColumnData);

    highs[key] = maxNumber;
  }
  for (let index = 0; index < targetData.length; index++) {
    for (const key in highs) {
      if (targetData[index][groupIndices[0]] === key) {
        targetData[index][aggColumn] = highs[key];
      }
    }
  }

  console.log("!!!! highs", highs);
  console.log("!!!! targetData aggregate High", targetData);
  return highs;
}

function aggregateLow(
  groupMap: GroupMap,
  leafData: readonly DataSourceRow[],
  columnMap: ColumnMap,
  aggregations: VuuAggregation[],
  targetData: readonly DataSourceRow[],
  groupIndices : number[],
): { [key: string]: number } {
  const mins: { [key: string]: number } = {};
  const aggColumn = getAggColumn(columnMap, aggregations);

  for (const key in groupMap) {
    const leafColumnData = getLeafColumnData(
      groupMap[key],
      leafData,
      aggColumn
    );
    const minNumber = Math.min(...leafColumnData);
    mins[key] = minNumber;
  }

  for (let index = 0; index < targetData.length; index++) {
    for (const key in mins) {
      if (targetData[index][groupIndices[0]] === key) {
        targetData[index][aggColumn] = mins[key];
      }
    }
  }

  console.log("!!!! targetData aggregate Low", targetData);
  console.log("!!!! mins", mins);
  return mins;
}
