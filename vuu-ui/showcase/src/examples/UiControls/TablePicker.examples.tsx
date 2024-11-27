import { VuuDataSourceProvider } from "@finos/vuu-data-react";
import { getSchema, LocalDataSourceProvider } from "@finos/vuu-data-test";
import { TablePicker, TablePickerProps } from "@finos/vuu-ui-controls";
import { useAutoLoginToVuuServer } from "../utils";

const TablePickerTemplate = ({
  TableProps,
  rowToString,
  schema = getSchema("instruments"),
}: Partial<TablePickerProps>) => {
  return (
    <div
      style={{
        padding: 4,
        width: 500,
        display: "flex",
        justifyContent: "space-around",
      }}
    >
      <TablePicker
        TableProps={TableProps}
        rowToString={rowToString}
        schema={schema}
        style={{ width: 300 }}
      />
    </div>
  );
};

const instrumentToString: TablePickerProps["rowToString"] = (row) =>
  `[${row.key}] ${row.data.description}`;

export const DefaultInstrumentPicker = () => (
  <LocalDataSourceProvider modules={["SIMUL"]}>
    <TablePickerTemplate
      rowToString={instrumentToString}
      TableProps={{
        config: {
          columns: [
            { name: "bbg" },
            { name: "currency", width: 80 },
            { name: "description", minWidth: 130 },
          ],
        },
      }}
    />
  </LocalDataSourceProvider>
);

export const VuuInstrumentPicker = () => {
  useAutoLoginToVuuServer();
  return (
    <VuuDataSourceProvider>
      <TablePickerTemplate
        rowToString={instrumentToString}
        TableProps={{
          config: {
            columns: [
              { name: "bbg" },
              { name: "currency", width: 80 },
              { name: "description", minWidth: 130 },
            ],
          },
        }}
      />
    </VuuDataSourceProvider>
  );
};
