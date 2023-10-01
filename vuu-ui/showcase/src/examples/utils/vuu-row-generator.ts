import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuRowDataItemType, VuuTable } from "@finos/vuu-protocol-types";
import { RowAtIndexFunc } from "./ArrayProxy";
import {
  InstrumentRowGenerator,
  InstrumentColumnGenerator,
} from "./instrument-generator";
import {
  createInstrumentPriceUpdateGenerator,
  InstrumentPricesRowGenerator,
  InstrumentPricesColumnGenerator,
} from "./instrument-prices-generator";
import {
  BasketDesignRowGenerator,
  BasketDesignColumnGenerator,
} from "./basket-design-generator";
import { OrderRowGenerator, OrderColumnGenerator } from "./order-generator";
import {
  ChildOrderRowGenerator,
  ChildOrderColumnGenerator,
} from "./child-order-generator";
import {
  ParentOrderRowGenerator,
  ParentOrderColumnGenerator,
} from "./parent-order-generator";
import {
  PricesRowGenerator,
  PricesColumnGenerator,
  createPriceUpdateGenerator,
} from "./prices-generator";
import { UpdateGenerator } from "./rowUpdates";

export const VuuColumnGenerator = (columnCount: number): string[] =>
  ["Row No"].concat(
    Array(columnCount)
      .fill("")
      .map((_, i) => `Column ${i + 1}`)
  );

export type RowGenerator<T = VuuRowDataItemType> = (
  columns: string[]
) => RowAtIndexFunc<T[]>;

export type ColumnGenerator = (
  columns?: number | string[],
  columnConfig?: { [key: string]: Partial<ColumnDescriptor> }
) => ColumnDescriptor[];

export const DefaultRowGenerator: RowGenerator<string> =
  (columns: string[]) => (index) => {
    return [`row ${index + 1}`].concat(
      Array(columns.length)
        .fill(true)
        .map((v, j) => `value ${j + 1} @ ${index + 1}`)
    );
  };

export const DefaultColumnGenerator: ColumnGenerator = (
  columns,
  columnConfig = {}
) => {
  if (typeof columns === "number") {
    return [{ name: "row number", width: 150 }].concat(
      Array(columns)
        .fill(true)
        .map((_, i) => {
          const name = `column ${i + 1}`;
          return { name, width: 100, ...columnConfig[name] };
        })
    );
  } else {
    throw Error("DefaultColumnGenerator must be passed columns (number)");
  }
};

export const getRowGenerator = (table?: VuuTable): RowGenerator => {
  if (table?.table === "instruments") {
    return InstrumentRowGenerator;
  }
  return DefaultRowGenerator;
};

export const getColumnAndRowGenerator = (
  table?: VuuTable
):
  | [ColumnGenerator, RowGenerator]
  | [ColumnGenerator, RowGenerator, () => UpdateGenerator] => {
  switch (table?.table) {
    case "instruments":
      return [InstrumentColumnGenerator, InstrumentRowGenerator];
    case "instrumentPrices":
      return [
        InstrumentPricesColumnGenerator,
        InstrumentPricesRowGenerator,
        createInstrumentPriceUpdateGenerator,
      ];
    case "basketDesign":
      return [BasketDesignColumnGenerator, BasketDesignRowGenerator];
    case "orders":
      return [OrderColumnGenerator, OrderRowGenerator];
    case "childOrders":
      return [ChildOrderColumnGenerator, ChildOrderRowGenerator];
    case "parentOrders":
      return [ParentOrderColumnGenerator, ParentOrderRowGenerator];
    case "prices":
      return [
        PricesColumnGenerator,
        PricesRowGenerator,
        createPriceUpdateGenerator,
      ];
    default:
      return [DefaultColumnGenerator, DefaultRowGenerator];
  }
};

export const populateArray = (
  count: number,
  colGen: ColumnGenerator,
  rowGen: RowGenerator,
  columns?: number | string[]
) => {
  const columnDescriptors = colGen(columns);
  const generateRow = rowGen(columnDescriptors.map((col) => col.name));
  const data: Array<VuuRowDataItemType[]> = [];
  for (let i = 0; i < count; i++) {
    data[i] = generateRow(i) as VuuRowDataItemType[];
  }
  return data;
};
