import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import {
  ColumnDescriptor,
  DataValueTypeDescriptor,
} from "@vuu-ui/vuu-table-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
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
  isLeaf: boolean;
};

const isJsonData = (value: unknown): value is JsonData =>
  typeof value === "object" && value !== null;

const vuuRowDataItemTypes = ["boolean", "number", "string"];
const isVuuRowDataItem = (value: unknown): value is VuuRowDataItemType =>
  vuuRowDataItemTypes.includes(typeof value);

const getCellValue = (
  attribute: string,
  attributeValue: unknown,
): CellValue => {
  if (Array.isArray(attributeValue)) {
    return {
      attribute: `${attribute}[`,
      attributeValue: "",
      isLeaf: false,
    };
  } else if (isJsonData(attributeValue)) {
    return {
      attribute: `${attribute}{`,
      attributeValue: "",
      isLeaf: false,
    };
  } else if (attributeValue === undefined) {
    return {
      attribute,
      attributeValue: "undefined",
      isLeaf: true,
    };
  } else if (isVuuRowDataItem(attributeValue)) {
    return {
      attribute,
      attributeValue,
      isLeaf: true,
    };
  } else {
    throw Error(`unsupported type ${typeof attributeValue} in JSON`);
  }
};

const jsonColumnType: DataValueTypeDescriptor = {
  name: "json",
  renderer: {
    name: "json",
  },
};

export const jsonToDataSourceRows = (
  json: JsonData,
): [ColumnDescriptor[], DataSourceRow[]] => {
  const cols: ColumnDescriptor[] = [];

  cols.push(
    {
      className: "vuuJsonCell",
      name: "Level 1",
      type: jsonColumnType,
    },
    {
      className: "vuuJsonCell",
      name: "Level 2",
      type: jsonColumnType,
    },
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
): [number, number] => {
  let leafCount = 0;
  let rowCount = 0;
  if (depth === cols.length - 1) {
    cols.push({
      className: "vuuJsonCell",
      name: `Level ${cols.length + 1}`,
      hidden: true,
      type: jsonColumnType,
    });
  }
  const columnEntries = Object.entries(json);
  for (let i = 0; i < columnEntries.length; i++, index.value += 1) {
    const [key, value] = columnEntries[i];
    const { attribute, attributeValue, isLeaf } = getCellValue(key, value);
    const blanks = Array(depth).fill("");
    const fullKey = `${keyBase}|${key}`;
    // prettier-ignore
    const row = [index.value, index.value, isLeaf,false,depth,0,fullKey,0, ...blanks, attribute, attributeValue ] as DataSourceRow
    rows.push(row);
    rowCount += 1;

    if (isJsonData(value)) {
      const [nestedLeafCount, nestedRowCount] = addChildValues(
        rows,
        value,
        cols,
        { value: index.value + 1 },
        fullKey,
        depth + 1,
      );
      row[COUNT] = nestedLeafCount;
      leafCount += nestedLeafCount;
      rowCount += nestedRowCount;
      index.value += nestedRowCount;
    } else {
      leafCount += 1;
    }
  }

  return [leafCount, rowCount];
};
