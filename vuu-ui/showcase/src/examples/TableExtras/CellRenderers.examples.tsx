import { DataSourceRow } from "@finos/vuu-data-types";
import { TableCell } from "@finos/vuu-table";
import { BackgroundCell } from "@finos/vuu-table-extras";
import {
  ColumnDescriptor,
  ColumnTypeFormatting,
  ColumnTypeRendering,
  RuntimeColumnDescriptor,
} from "@finos/vuu-table-types";
import { VuuInput } from "@finos/vuu-ui-controls";
import { getValueFormatter } from "@finos/vuu-utils";
import { FormEventHandler, useCallback, useMemo, useState } from "react";

let displaySequence = 1;

const columnMap = {
  price: 8,
};

const defaultFormatting = { decimals: 2 };
const defaultRenderer = {
  name: "vuu.price-move-background",
};

export const DefaultBackgroundCell = ({
  formatting = defaultFormatting,
  renderer = defaultRenderer,
}: {
  formatting?: ColumnTypeFormatting;
  renderer?: ColumnTypeRendering;
}) => {
  const priceColumn = useMemo<Partial<RuntimeColumnDescriptor>>(() => {
    const column: Partial<RuntimeColumnDescriptor> = {
      CellRenderer: BackgroundCell,
      name: "price",
      serverDataType: "double",
      type: {
        name: "number",
        formatting,
        renderer,
      },
      width: 100,
    };
    column.valueFormatter = getValueFormatter(column as ColumnDescriptor);
    return column;
  }, [formatting, renderer]);

  const [value, setValue] = useState<string>("100.00");
  // prettier-ignore
  const [row, setRow] = useState<DataSourceRow>([0, 0, true, false, 1, 0, "key", 0, 100.00]);

  const handleChange = useCallback<FormEventHandler<HTMLInputElement>>(
    (evt) => setValue((evt.target as HTMLInputElement).value),
    [],
  );
  const handlePriceChange = useCallback((evt, value) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      console.log(`change price ${typeof value}`);
      setRow([0, 0, true, false, 1, 0, "key", 0, numericValue]);
    }
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        lineHeight: "19px",
        width: 250,
      }}
      data-showcase-center
    >
      <header>Feel free to change value then press ENTER</header>
      <VuuInput
        value={value}
        onChange={handleChange}
        onCommit={handlePriceChange}
      />
      <TableCell
        column={priceColumn as RuntimeColumnDescriptor}
        columnMap={columnMap}
        row={row}
      />
    </div>
  );
};

DefaultBackgroundCell.displaySequence = displaySequence++;

const formatting0Decimals = { decimals: 0 };
const formatting4Decimals = { decimals: 4 };
const backgroundArrow = { ...defaultRenderer, flashStyle: "arrow-bg" as const };
const arrowOnly = { ...defaultRenderer, flashStyle: "arrow" as const };

export const BackgroundCell4Decimals = () => (
  <DefaultBackgroundCell formatting={formatting4Decimals} />
);
BackgroundCell4Decimals.displaySequence = displaySequence++;

export const BackgroundCellNoDecimals = () => (
  <DefaultBackgroundCell formatting={formatting0Decimals} />
);
BackgroundCellNoDecimals.displaySequence = displaySequence++;

export const BackgroundArrowCell = () => (
  <DefaultBackgroundCell renderer={backgroundArrow} />
);
BackgroundArrowCell.displaySequence = displaySequence++;

export const ArrowOnlyCell = () => (
  <DefaultBackgroundCell renderer={arrowOnly} />
);
ArrowOnlyCell.displaySequence = displaySequence++;
