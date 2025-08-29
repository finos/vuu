import { useVuuMenuActions } from "@vuu-ui/vuu-data-react";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { DialogProvider } from "@vuu-ui/vuu-popups";
import { BulkEditPanel, Table, TableProps } from "@vuu-ui/vuu-table";
import {
  applyDefaultColumnConfig,
  DataSourceProvider,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { ReactElement, useMemo, useState } from "react";
import { getDefaultColumnConfig } from "./columnMetaData";
import { DemoTableContainer } from "./DemoTableContainer";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";

const schema = getSchema("instruments");

export const DefaultBulkEditPanel = () => {
  const { VuuDataSource } = useData();
  const [bulkEditPanel, setBulkEditPanel] = useState<ReactElement | null>(null);
  const parentDs = useMemo<DataSource>(
    () =>
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource],
  );

  const handleValidationStatusChange = (isValid: boolean) => {
    console.log(`isValid ${isValid}`);
  };

  useMemo(async () => {
    parentDs.select([0, 1, 2, 3]);
    const response = await parentDs?.menuRpcCall?.({
      type: "VIEW_PORT_MENUS_SELECT_RPC",
      rpcName: "VP_BULK_EDIT_BEGIN_RPC",
    });

    const { table } = response.action;
    const sessionDs = new VuuDataSource({
      columns: ["ric", "lotSize"],
      table,
      viewport: table.table,
    });

    console.log({ response });

    setBulkEditPanel(
      <BulkEditPanel
        onValidationStatusChange={handleValidationStatusChange}
        parentDs={parentDs}
        sessionDs={sessionDs}
      />,
    );
  }, [VuuDataSource, parentDs]);

  return (
    <DataSourceProvider dataSource={parentDs}>
      {bulkEditPanel}
    </DataSourceProvider>
  );
};

const BulkEditTableTemplate = () => {
  const [dataSource, setDataSource] = useState<DataSource | undefined>(
    undefined,
  );
  const { VuuDataSource } = useData();

  useMemo(async () => {
    const ds = new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
    setDataSource(ds);
  }, [VuuDataSource]);

  const tableProps = useMemo<Pick<TableProps, "config">>(
    () => ({
      config: {
        columns: applyDefaultColumnConfig(schema, getDefaultColumnConfig),
        rowSeparators: true,
      },
    }),
    [],
  );

  const { menuBuilder, menuActionHandler } = useVuuMenuActions({
    dataSource,
  });

  return dataSource ? (
    <ContextMenuProvider
      menuActionHandler={menuActionHandler}
      menuBuilder={menuBuilder}
    >
      <DemoTableContainer>
        <Table {...tableProps} dataSource={dataSource} />
      </DemoTableContainer>
    </ContextMenuProvider>
  ) : null;
};

/** tags=data-consumer */
export const BulkEditTable = () => {
  return (
    <DialogProvider>
      <BulkEditTableTemplate />
    </DialogProvider>
  );
};
