import { TableCell } from "@vuu-ui/vuu-table";
import {
  ColumnDescriptor,
  DataValueTypeDescriptor,
  RuntimeColumnDescriptor,
} from "@vuu-ui/vuu-table-types";
import { dataRowFactory } from "@vuu-ui/vuu-table/src/data-row/DataRow";
import { VuuInput } from "@vuu-ui/vuu-ui-controls";
import { CommitHandler, getValueFormatter } from "@vuu-ui/vuu-utils";
import { FormEventHandler, useCallback, useMemo, useState } from "react";

const priceColumn: ColumnDescriptor = {
  name: "price",
  serverDataType: "double",
};

const defaultType: DataValueTypeDescriptor = {
  name: "number",
};

export const TableCellTemplate = ({
  column: columnProp = priceColumn,
  type = defaultType,
  value: valueProp = "100.00",
}: {
  column?: ColumnDescriptor;
  type?: DataValueTypeDescriptor;
  value?: string;
}) => {
  const [DataRow] = useMemo(
    () =>
      dataRowFactory(["price"], [{ name: "price", serverDataType: "double" }]),
    [],
  );

  const priceColumn = useMemo<Partial<RuntimeColumnDescriptor>>(() => {
    const column: Partial<RuntimeColumnDescriptor> = {
      width: 100,
      ...columnProp,
      type,
    };
    column.valueFormatter = getValueFormatter(column as ColumnDescriptor);
    return column;
  }, [columnProp, type]);

  const [value, setValue] = useState<string>(valueProp);
  // prettier-ignore
  const [dataRow, setDataRow] = useState(DataRow([0, 0, true, false, 1, 0, "key", 0,  0, false, value]));

  const handleChange = useCallback<FormEventHandler<HTMLInputElement>>(
    (evt) => setValue((evt.target as HTMLInputElement).value),
    [],
  );
  const handlePriceChange = useCallback<CommitHandler>(
    (evt, value) => {
      setDataRow(DataRow([0, 0, true, false, 1, 0, "key", 0, 0, false, value]));
    },
    [DataRow],
  );

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
        dataRow={dataRow}
      />
    </div>
  );
};
