import { DataSourceRow, SchemaColumn } from "@vuu-ui/vuu-data-types";
import {
  StringNumericType,
  VuuColumnDataType,
  VuuDataRow,
  VuuRowDataItemType,
} from "@vuu-ui/vuu-protocol-types";
import {
  DataRow,
  DataRowIntrinsicAttribute,
  DataRowOperation,
  DataRowOperations,
} from "@vuu-ui/vuu-table-types";

type ColumnMapEntry = {
  index: number;
  type: VuuColumnDataType;
};

const dataRowSymbol = Symbol("DataRow");

/**
 * We allow undefined to allow us to null out rather than delete entries, for
 * performance reasons.
 */
type DataRowColumnMap = Record<string, ColumnMapEntry | undefined>;

const dataRowIntrinsicAttributes: Record<DataRowIntrinsicAttribute, true> = {
  childCount: true,
  depth: true,
  index: true,
  isExpanded: true,
  isSelected: true,
  isLeaf: true,
  key: true,
  renderIndex: true,
};

const dataRowOperations: Record<DataRowOperation, true> = {
  hasColumn: true,
};

const isDataRowIntrinsicAttribute = (
  attrName: string,
): attrName is DataRowIntrinsicAttribute =>
  dataRowIntrinsicAttributes[attrName as DataRowIntrinsicAttribute] === true;

const isDataRowOperation = (attrName: string): attrName is DataRowOperation =>
  dataRowOperations[attrName as DataRowOperation] === true;

const stringNumericTypes: Record<StringNumericType, true> = {
  long: true,
  scaleddecimal2: true,
  scaleddecimal4: true,
  scaleddecimal6: true,
  scaleddecimal8: true,
};

const isStringNumericType = (
  type: VuuColumnDataType,
): type is StringNumericType =>
  stringNumericTypes[type as StringNumericType] === true;

const MAX_DECIMALS = "0000000";

const injectDecimalPoint = (value: string, decimal: 2 | 4 | 6 | 8) => {
  if (value === "0" || value === "-0") {
    return value;
  } else {
    if (value[0] === "-") {
      const digits = value.slice(1);
      if (digits.length < decimal) {
        return `-0.${(MAX_DECIMALS + digits).slice(-decimal)}`;
      } else if (digits.length === decimal) {
        return `-0.${value}`;
      } else {
        return `-${digits.slice(0, -decimal)}.${digits.slice(-decimal)}`;
      }
    } else {
      if (value.length < decimal) {
        return `0.${(MAX_DECIMALS + value).slice(-decimal)}`;
      } else if (value.length === decimal) {
        return `0.${value}`;
      } else {
        return `${value.slice(0, -decimal)}.${value.slice(-decimal)}`;
      }
    }
  }
};

const formatStringNumeric = (value: string, type: StringNumericType) => {
  switch (type) {
    case "long":
      return value;
    case "scaleddecimal2":
      return injectDecimalPoint(value, 2);
    case "scaleddecimal4":
      return injectDecimalPoint(value, 4);
    case "scaleddecimal6":
      return injectDecimalPoint(value, 6);
    case "scaleddecimal8":
      return injectDecimalPoint(value, 8);
  }
};
/**
 * DataRow wraps a vuu DataSourceRow and a columnMap to provide a more convenient
 * API for manipulating rows from server. It is now used internally by Table. This
 * removes the need to always provide a columnMap to any componnet that must work with
 * data rows. It also removes a category of timing bugs which cause the columnMap
 * to get out of sync with data.
 * Because properties are provided via a proxy, and the DataRow has the Schema, there is
 * flexibility to enhance handling for specific properties. This is used now to insert
 * decimal point in scaleddecimal values.
 * @param data
 * @param columnMap
 * @returns
 */
function DataRowImpl(data: VuuDataRow, columnMap: DataRowColumnMap): DataRow {
  const target: Record<string, VuuRowDataItemType> = {};

  const getPropertyNames = () => {
    return Object.keys(columnMap);
  };

  const jsonSerializer = () => {
    return Object.entries(columnMap).reduce<Record<string, VuuRowDataItemType>>(
      (json, [name, mapEntry]) => {
        if (mapEntry) {
          json[name] = data[mapEntry.index];
        }
        return json;
      },
      {},
    );
  };

  const DataRowOperations: DataRowOperations = {
    hasColumn: (name: string) => columnMap[name] !== undefined,
  };

  return new Proxy(target, {
    get(_obj, prop: string | symbol) {
      if (typeof prop === "symbol") {
        if (prop === dataRowSymbol) return true;
        // TODO what does React use this for
        return undefined;
      } else if (prop === "toJSON") {
        return jsonSerializer;
      } else if (prop === "toString") {
        return "DataRow";
      } else if (prop === "$$typeof") {
        // some react internal weirdness
        return undefined;
      } else if (isDataRowOperation(prop)) {
        return DataRowOperations[prop];
      } else if (prop === "getPropertyNames") {
        return getPropertyNames;
      }
      const columnMapEntry = columnMap[prop];

      if (columnMapEntry === undefined) {
        if (prop !== "") {
          // System columns like the selection checkbox column
          console.warn(`[DataRow:Proxy] unknown column ${prop}`);
        }
        return undefined;
      }

      if (isDataRowIntrinsicAttribute(prop)) {
        return data[columnMapEntry.index];
      }

      if (isStringNumericType(columnMapEntry.type)) {
        return formatStringNumeric(
          data[columnMapEntry.index] as string,
          columnMapEntry.type,
        );
      }

      return data[columnMapEntry.index];

      // throw new Error(`Unknown column: ${prop}`);
    },
    set() {
      throw new TypeError("DataRow is readonly");
    },
  }) as DataRow;
}

export type DataRowFunc = (data: DataSourceRow) => DataRow;

const ColumnMapIntrinsicColumns: DataRowColumnMap = {
  index: { index: 0, type: "int" },
  renderIndex: { index: 1, type: "int" },
  isLeaf: { index: 2, type: "boolean" },
  isExpanded: { index: 3, type: "boolean" },
  depth: { index: 4, type: "int" },
  childCount: { index: 5, type: "int" },
  key: { index: 6, type: "string" },
  isSelected: { index: 7, type: "boolean" },
};

function createColumnMap(
  columns: string[],
  schemaColumns: readonly SchemaColumn[],
) {
  const columnMap: DataRowColumnMap = {
    ...ColumnMapIntrinsicColumns,
  };

  columns.forEach((name, i) => {
    const schemaColumn = schemaColumns.find((col) => col.name === name);
    if (schemaColumn) {
      columnMap[name] = { index: i + 10, type: schemaColumn.serverDataType };
    } else {
      throw Error(`[DataRow] dataRowFactory column not in schema ${name}`);
    }
  });
  return columnMap;
}

/**
 *
 * @param columns the names of columns included in subscription
 * @param schemaColumns full schema definitions for all available columns,
 * the serverDataTypes are used.
 * @returns a tuple containing:
 * - factory function that will create a DataRow instance from a DataSourceRow
 * array.
 * - a function that can be used to reset the columns, which will be used for all
 * subsequently created DataRows. Used by Table when user adds or removes columns
 * at runtime.
 */
export const dataRowFactory = (
  columns: string[],
  schemaColumns: readonly SchemaColumn[],
): [DataRowFunc, (columns: string[]) => void] => {
  let columnMap = createColumnMap(columns, schemaColumns);

  columns.forEach((name, i) => {
    const schemaColumn = schemaColumns.find((col) => col.name === name);
    if (schemaColumn) {
      columnMap[name] = { index: i + 10, type: schemaColumn.serverDataType };
    } else {
      throw Error(`[DataRow] dataRowFactory column not in schema ${name}`);
    }
  });

  const setColumns = (columns: string[]) => {
    // new columnMap will be used for all subsequently created DataRows
    columnMap = createColumnMap(columns, schemaColumns);
  };

  const DataRow = function (data: DataSourceRow) {
    return DataRowImpl(data, columnMap);
  };

  return [DataRow, setColumns];
};

if (process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-ignore
  window.devtoolsFormatters = [
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      header: function (obj: any) {
        if (obj[dataRowSymbol]) {
          return [
            "div",
            {
              style: "display: flex; gap: 4px; justify-content: space-between",
            },
            ["span", {}, "Vuu DataRow"],
            ["span", { style: "font-weight: bold;" }, `[${obj.index}]`],
            [
              "span",
              { style: "font-weight: bold; color: blue;" },
              `#${obj.key}`,
            ],
          ];
        }
        return null;
      },
      hasBody: function () {
        return true;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: function (obj: any) {
        return [
          "div",
          {},
          [
            "div",
            {
              style: "display: flex; gap: 4px;",
            },
            ["span", {}, "index"],
            ["span", {}, obj.index],
          ],
          [
            "div",
            {
              style: "display: flex; gap: 4px;",
            },
            ["span", {}, "key"],
            ["span", {}, obj.key],
          ],
          [
            "div",
            {
              style: "display: flex; gap: 4px;",
            },
            ["span", {}, "renderIndex"],
            ["span", {}, obj.renderIndex],
          ],
          [
            "div",
            {
              style: "display: flex; gap: 4px;",
            },
            ["span", {}, "isSelected"],
            ["span", {}, obj.isSelected],
          ],
          ...obj.getPropertyNames().map((name: string) => {
            return [
              "div",
              {
                style: "display: flex; gap: 4px;",
              },
              ["span", {}, name],
              ["span", {}, obj[name]],
            ];
          }),
        ];
      },
    },
  ];
}
