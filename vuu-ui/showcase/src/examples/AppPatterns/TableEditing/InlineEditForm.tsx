import { getSchema } from "@finos/vuu-data-test";
import { DockLayout, Drawer } from "@finos/vuu-layout";
import { RefCallback, useCallback, useMemo } from "react";
import { Table } from "@finos/vuu-table";
import { TableConfig } from "@finos/vuu-table-types";
import { EditForm } from "@finos/vuu-data-react";
import { useTableEditManager } from "./useTableEditManager";
import { LocalDataSourceProvider } from "@finos/vuu-data-test";
import { DataValueDescriptor } from "@finos/vuu-data-types";
import { Instrument } from "./instrument-editing";

let displaySequence = 0;

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
          apply: "change",
          message: "LotSize must be numeric",
        },
        {
          name: "value-integer",
          apply: "commit",
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
  const {
    dataSource,
    entity,
    open,
    onChangeFormField,
    onCommitFieldValue,
    onSelectionChange,
    onSubmit,
  } = useTableEditManager(instrumentsTable);

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
    <DockLayout style={{ height: 700 }}>
      <Drawer inline={true} open={open} position="right" defaultOpen={false}>
        <EditForm<Instrument>
          editEntity={entity}
          formFieldDescriptors={formFieldDescriptors}
          onChangeFormField={onChangeFormField}
          onCommitFieldValue={onCommitFieldValue}
          onSubmit={onSubmit}
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
  );
};

export const RightInlineEditForm = () => (
  <LocalDataSourceProvider modules={["SIMUL"]}>
    <TableWithInlineEditForm />
  </LocalDataSourceProvider>
);
RightInlineEditForm.displaySequence = displaySequence++;
