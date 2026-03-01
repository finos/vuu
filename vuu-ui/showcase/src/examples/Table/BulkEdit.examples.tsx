import { useVuuMenuActions } from "@vuu-ui/vuu-data-react";
import { getSchema } from "@vuu-ui/vuu-data-test";
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
import { ModalProvider } from "@vuu-ui/vuu-ui-controls";
import { SelectRowRangeRequest } from "@vuu-ui/vuu-protocol-types";

const schema = getSchema("instruments");

export const DefaultBulkEditPanel = ({ width }: { width?: number }) => {
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
    parentDs.select?.({
      preserveExistingSelection: false,
      type: "SELECT_ROW_RANGE",
      fromRowKey: "AAOO.L",
      toRowKey: "AAOY.L",
    } as SelectRowRangeRequest);
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

    setBulkEditPanel(
      <BulkEditPanel
        onValidationStatusChange={handleValidationStatusChange}
        parentDs={parentDs}
        sessionDs={sessionDs}
        width={width}
      />,
    );
  }, [VuuDataSource, parentDs, width]);

  return (
    <DataSourceProvider dataSource={parentDs}>
      {bulkEditPanel}
    </DataSourceProvider>
  );
};

export const BulkEditPanelFixture = () => {
  return <DefaultBulkEditPanel width={900} />;
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
    <ModalProvider>
      <BulkEditTableTemplate />
    </ModalProvider>
  );
};
