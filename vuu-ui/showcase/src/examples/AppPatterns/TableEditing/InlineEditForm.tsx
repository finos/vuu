import { getSchema } from "@finos/vuu-data-test";
import { DockLayout, Drawer } from "@finos/vuu-layout";
import { useMemo } from "react";
import { Table } from "@finos/vuu-table";
import { TableConfig } from "@finos/vuu-table-types";
import { EditForm } from "./EditForm";
import { useTableEditManager } from "./useTableEditManager";
import { LocalDataSourceProvider } from "@finos/vuu-data-test/src/local-datasource-provider/LocalDatasourceProvider";

let displaySequence = 0;

const instrumentsTable = { module: "SIMUL", table: "instruments" };

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

  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columnLayout: "fit",
      columns: getSchema("instruments").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);

  return (
    <DockLayout style={{ height: 500 }}>
      <Drawer inline={true} open={open} position="right" defaultOpen={false}>
        <EditForm
          editEntity={entity}
          onChangeFormField={onChangeFormField}
          onCommitFieldValue={onCommitFieldValue}
          onSubmit={onSubmit}
        />
      </Drawer>
      <Table
        config={tableConfig}
        dataSource={dataSource}
        height={500}
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
