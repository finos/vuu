import { DataSourceRow } from "@finos/vuu-data";
import {
  ColumnDescriptor,
  ColumnTypeDescriptor,
} from "@finos/vuu-datagrid-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { metadataKeys } from "./column-utils";

const { COUNT } = metadataKeys;

export type JsonData =
  | {
      [key: string]: unknown;
    }
  | JsonData[];

type Index = { value: number };

type CellValue = {
  attribute: string;
  attributeValue: JsonData | VuuRowDataItemType | null;
  type: "json" | "number" | "string" | "boolean";
};

const isJsonData = (value: unknown): value is JsonData =>
  typeof value === "object" && value !== null;

const vuuRowDataItemTypes = ["boolean", "number", "string"];
const isVuuRowDataItem = (value: unknown): value is VuuRowDataItemType =>
  vuuRowDataItemTypes.includes(typeof value);
const typeofVuuDataItem = (value: VuuRowDataItemType) =>
  typeof value === "boolean"
    ? "boolean"
    : typeof value === "number"
    ? "number"
    : "string";

const getCellValue = (
  attribute: string,
  attributeValue: unknown
): CellValue => {
  if (isJsonData(attributeValue)) {
    return { attribute: `${attribute}+`, attributeValue: "", type: "json" };
  } else if (isVuuRowDataItem(attributeValue)) {
    return {
      attribute,
      attributeValue,
      type: typeofVuuDataItem(attributeValue),
    };
  } else {
    throw Error(`unsupported type ${typeof attributeValue} in JSON`);
  }
};

const jsonColumnType: ColumnTypeDescriptor = {
  name: "json",
  renderer: {
    name: "json",
  },
};

export const jsonToDataSourceRows = (
  json: JsonData
): [ColumnDescriptor[], DataSourceRow[]] => {
  const cols: ColumnDescriptor[] = [];

  cols.push(
    {
      name: "col 1",
      type: jsonColumnType,
    },
    {
      name: "col 2",
      type: jsonColumnType,
    }
  );

  const rows: DataSourceRow[] = [];

  addChildValues(rows, json, cols);

  return [cols, rows];
};

const addChildValues = (
  rows: DataSourceRow[],
  json: JsonData,
  cols: ColumnDescriptor[],
  index: Index = { value: 0 },
  keyBase = "$root",
  depth = 0,
  count = 0
): number => {
  index.value += 1;
  if (depth === cols.length - 1) {
    cols.push({
      name: `col ${cols.length + 1}`,
      hidden: true,
      type: jsonColumnType,
    });
  }
  const columnEntries = Object.entries(json);
  for (let i = 0; i < columnEntries.length; i++, index.value += 1) {
    const [key, value] = columnEntries[i];
    const { attribute, attributeValue, type } = getCellValue(key, value);
    const isLeaf = type !== "json";
    const blanks = Array(depth).fill("");
    const fullKey = `${keyBase}|${key}`;
    // prettier-ignore
    const row = [index.value, index.value, isLeaf,false,depth,0,fullKey,0, ...blanks, attribute, attributeValue ] as DataSourceRow
    rows.push(row);

    if (isJsonData(value)) {
      const childCount = addChildValues(
        rows,
        value,
        cols,
        index,
        fullKey,
        depth + 1,
        0
      );
      row[COUNT] = childCount;
      count += childCount;
    } else {
      count += 1;
    }
  }
  index.value -= 1;

  return count;
};
