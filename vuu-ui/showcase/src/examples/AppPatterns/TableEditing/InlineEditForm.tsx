import { getSchema } from "@vuu-ui/vuu-data-test";
import { DockLayout, Drawer } from "@vuu-ui/vuu-layout";
import { RefCallback, useCallback, useMemo } from "react";
import { Table } from "@vuu-ui/vuu-table";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { EditForm } from "@vuu-ui/vuu-data-react";
import { useTableEditManager } from "./useTableEditManager";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import { DialogProvider } from "@vuu-ui/vuu-popups";

const instrumentsTable = { module: "SIMUL", table: "instruments" };

const formFieldDescriptors: DataValueDescriptor[] = [
  { label: "BBG", name: "bbg", serverDataType: "string", editable: false },
  { label: "Currency", name: "currency", serverDataType: "string" },
  { label: "Description", name: "description", serverDataType: "string" },
  { label: "Exchange", name: "exchange", serverDataType: "string" },
  { label: "ISIN", name: "isin", serverDataType: "string", editable: false },
  {
    label: "Lot Size",
    name: "lotSize",
    serverDataType: "int",
    type: {
      name: "number",
      rules: [
        {
          name: "char-numeric",
          phase: "change",
          message: "LotSize must be numeric",
        },
        {
          name: "value-integer",
          phase: "commit",
          message: "LotSize must be an integer",
        },
      ],
    },
  },
  { label: "RIC", name: "ric", serverDataType: "string", editable: false },
  { label: "Price", name: "price", serverDataType: "double" },
  { label: "Date", name: "date", serverDataType: "long", type: "date/time" },
];

const TableWithInlineEditForm = () => {
  const { dataSource, open, onSelectionChange, sessionDataSource } =
    useTableEditManager(instrumentsTable);

  const refCallback = useCallback<RefCallback<HTMLDivElement>>((el) => {
    console.log(`el =>`, {
      el,
    });
  }, []);

  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columnLayout: "fit",
      columns: getSchema("instruments").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);

  return (
    <DialogProvider>
      <DockLayout style={{ height: 700 }}>
        <Drawer inline={true} open={open} position="right" defaultOpen={false}>
          <EditForm
            dataSource={sessionDataSource}
            formFieldDescriptors={formFieldDescriptors}
          />
        </Drawer>
        <Table
          config={tableConfig}
          dataSource={dataSource}
          height={500}
          ref={refCallback}
          renderBufferSize={20}
          navigationStyle="row"
          onSelectionChange={onSelectionChange}
          width="100%"
        />
      </DockLayout>
    </DialogProvider>
  );
};

export const RightInlineEditForm = () => (
  <LocalDataSourceProvider>
    <TableWithInlineEditForm />
  </LocalDataSourceProvider>
);
