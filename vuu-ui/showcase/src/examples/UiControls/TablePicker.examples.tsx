import { getSchema } from "@vuu-ui/vuu-data-test";
import { TablePicker, TablePickerProps } from "@vuu-ui/vuu-ui-controls";

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

/** tags=data-consumer */
export const DefaultInstrumentPicker = () => (
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
);
