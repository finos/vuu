import {
  useVuuMenuActions,
  VuuDataSourceProvider,
} from "@vuu-ui/vuu-data-react";
import { getSchema, VuuTableName } from "@vuu-ui/vuu-data-test";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { ContextMenuProvider, DialogProvider } from "@vuu-ui/vuu-popups";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import {
  applyDefaultColumnConfig,
  toColumnName,
  useDataSource,
} from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";
import { getDefaultColumnConfig } from "./columnMetaData";
import { DemoTableContainer } from "./DemoTableContainer";
import { useAutoLoginToVuuServer } from "../utils";
import { DataSource } from "@vuu-ui/vuu-data-types";

const BulkEditTableTemplate = ({
  table = "instruments",
}: {
  table?: VuuTableName;
}) => {
  const [dataSource, setDataSource] = useState<DataSource | undefined>(
    undefined,
  );
  const schema = getSchema(table);
  const { VuuDataSource } = useDataSource();

  useMemo(async () => {
    const ds = new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
    setDataSource(ds);
  }, [VuuDataSource, schema]);

  const tableProps = useMemo<Pick<TableProps, "config">>(
    () => ({
      config: {
        columns: applyDefaultColumnConfig(schema, getDefaultColumnConfig),
        rowSeparators: true,
      },
    }),
    [schema],
  );

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource,
  });

  return dataSource ? (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}
    >
      <DemoTableContainer>
        <Table {...tableProps} dataSource={dataSource} />
      </DemoTableContainer>
    </ContextMenuProvider>
  ) : null;
};

export const BulkEditTable = () => {
  return (
    <LocalDataSourceProvider>
      <DialogProvider>
        <BulkEditTableTemplate />
      </DialogProvider>
    </LocalDataSourceProvider>
  );
};

export const BulkEditTableVuu = () => {
  useAutoLoginToVuuServer({ authenticate: false, secure: false });
  return (
    <VuuDataSourceProvider>
      <DialogProvider>
        <BulkEditTableTemplate />
      </DialogProvider>
    </VuuDataSourceProvider>
  );
};
