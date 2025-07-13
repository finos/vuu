import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { TableCell } from "@vuu-ui/vuu-table";
import { BackgroundCell } from "@vuu-ui/vuu-table-extras";
import {
  ColumnDescriptor,
  ColumnTypeFormatting,
  ColumnTypeRendering,
  RuntimeColumnDescriptor,
} from "@vuu-ui/vuu-table-types";
import { VuuInput } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler, getValueFormatter } from "@vuu-ui/vuu-utils";
import { FormEventHandler, useCallback, useMemo, useState } from "react";

const columnMap = {
  price: 8,
};

const timestamp = 0;
const isNew = false;

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
  const [row, setRow] = useState<DataSourceRow>([0, 0, true, false, 1, 0, "key", 0,  timestamp, isNew, 100.00]);

  const handleChange = useCallback<FormEventHandler<HTMLInputElement>>(
    (evt) => setValue((evt.target as HTMLInputElement).value),
    [],
  );
  const handlePriceChange = useCallback<CommitHandler>((evt, value) => {
    if (typeof value === "string") {
      const numericValue = parseFloat(value);
      if (!isNaN(numericValue)) {
        // prettier-ignore
        setRow([0, 0, true, false, 1, 0, "key", 0,  timestamp, isNew, numericValue]);
      }
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

const formatting0Decimals = { decimals: 0 };
const formatting4Decimals = { decimals: 4 };
const backgroundArrow = { ...defaultRenderer, flashStyle: "arrow-bg" as const };
const arrowOnly = { ...defaultRenderer, flashStyle: "arrow" as const };

export const BackgroundCell4Decimals = () => (
  <DefaultBackgroundCell formatting={formatting4Decimals} />
);

export const BackgroundCellNoDecimals = () => (
  <DefaultBackgroundCell formatting={formatting0Decimals} />
);

export const BackgroundArrowCell = () => (
  <DefaultBackgroundCell renderer={backgroundArrow} />
);

export const ArrowOnlyCell = () => (
  <DefaultBackgroundCell renderer={arrowOnly} />
);
