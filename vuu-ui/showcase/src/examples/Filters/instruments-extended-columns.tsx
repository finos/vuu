import { FormField, FormFieldLabel } from "@salt-ds/core";
import {
  type ColumnFilterProps,
  FilterContainerColumnFilter,
} from "@vuu-ui/vuu-filters";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

/**
 * Column descriptors for the SIMUL instrumentsExtended table, one for each
 * Vuu column data type, used by both Table and ColumnFilter examples.
 * Scaled decimal columns display fewer decimal places than they hold (except
 * notional), so a filter value entered as displayed must match every
 * underlying value that displays that way.
 */
const decimals = (decimals: number): ColumnDescriptor["type"] => ({
  name: "number",
  formatting: { decimals, zeroPad: true },
});

export const bbgColumn: ColumnDescriptor = {
  label: "BBG",
  name: "bbg",
  serverDataType: "string",
};

export const sideColumn: ColumnDescriptor = {
  label: "Side",
  name: "side",
  serverDataType: "char",
};

export const lotSizeColumn: ColumnDescriptor = {
  label: "Lot size",
  name: "lotSize",
  serverDataType: "int",
};

export const priceColumn: ColumnDescriptor = {
  label: "Price",
  name: "price",
  serverDataType: "double",
  type: decimals(2),
};

export const supportedColumn: ColumnDescriptor = {
  label: "Supported",
  name: "supported",
  serverDataType: "boolean",
};

/** scaleddecimal2, displayed with 2 decimals, i.e every decimal */
export const notionalColumn: ColumnDescriptor = {
  label: "Notional",
  name: "notional",
  serverDataType: "scaleddecimal2",
  type: decimals(2),
};

/** scaleddecimal4, displayed with 2 decimals */
export const closePriceColumn: ColumnDescriptor = {
  label: "Close price",
  name: "closePrice",
  serverDataType: "scaleddecimal4",
  type: decimals(2),
};

/** scaleddecimal6, displayed with 2 decimals */
export const fxRateColumn: ColumnDescriptor = {
  label: "FX rate",
  name: "fxRate",
  serverDataType: "scaleddecimal6",
  type: decimals(2),
};

/** scaleddecimal8, displayed with 4 decimals */
export const weightColumn: ColumnDescriptor = {
  label: "Weight",
  name: "weight",
  serverDataType: "scaleddecimal8",
  type: decimals(4),
};

export const tradeDateColumn: ColumnDescriptor = {
  label: "Trade date",
  name: "tradeDate",
  serverDataType: "epochtimestamp",
  type: "date",
};

export const scaledDecimalColumns = [
  notionalColumn,
  closePriceColumn,
  fxRateColumn,
  weightColumn,
];

/** One column of each type, the columns offered for filtering */
export const filterColumns: ColumnDescriptor[] = [
  bbgColumn,
  sideColumn,
  lotSizeColumn,
  priceColumn,
  supportedColumn,
  ...scaledDecimalColumns,
  tradeDateColumn,
];

/** The columns displayed by Table examples */
export const instrumentsExtendedColumns: ColumnDescriptor[] = [
  { label: "RIC", name: "ric", serverDataType: "string" },
  bbgColumn,
  { label: "Currency", name: "currency", serverDataType: "string" },
  sideColumn,
  lotSizeColumn,
  priceColumn,
  supportedColumn,
  ...scaledDecimalColumns,
  tradeDateColumn,
];

const typeaheadProps: ColumnFilterProps["TypeaheadProps"] = {
  minCharacterCountToTriggerSuggestions: 1,
  selectOnTab: false,
};

const comparisonOperators: ColumnFilterProps["operators"] = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "between",
  "between-inclusive",
];

const table = { module: "SIMUL", table: "instrumentsExtended" } as const;

const InstrumentsExtendedColumnFilter = ({
  column,
  showOperatorPicker,
}: {
  column: ColumnDescriptor;
  showOperatorPicker?: boolean;
}) => {
  switch (column.serverDataType) {
    case "string":
      return (
        <FilterContainerColumnFilter
          TypeaheadProps={typeaheadProps}
          column={column}
          table={table}
        />
      );
    case "char":
      return (
        <FilterContainerColumnFilter
          column={column}
          labels={["Buy", "Sell"]}
          values={["B", "S"]}
          variant="toggle"
        />
      );
    case "boolean":
      return (
        <FilterContainerColumnFilter
          column={column}
          labels={["Yes", "No"]}
          values={[true, false]}
          variant="toggle"
        />
      );
    case "epochtimestamp":
      return <FilterContainerColumnFilter column={column} />;
    default:
      return (
        <FilterContainerColumnFilter
          column={column}
          operators={comparisonOperators}
          showOperatorPicker={showOperatorPicker}
        />
      );
  }
};

/**
 * A FilterContainerColumnFilter, with label, for each column, the control
 * appropriate to the column type. Must be rendered within a FilterContainer.
 */
export const InstrumentsExtendedColumnFilters = ({
  columns = filterColumns,
  showOperatorPicker = false,
}: {
  columns?: ColumnDescriptor[];
  showOperatorPicker?: boolean;
}) =>
  columns.map((column) => (
    <FormField key={column.name}>
      <FormFieldLabel>{`${column.label} (${column.serverDataType})`}</FormFieldLabel>
      <InstrumentsExtendedColumnFilter
        column={column}
        showOperatorPicker={showOperatorPicker}
      />
    </FormField>
  ));
