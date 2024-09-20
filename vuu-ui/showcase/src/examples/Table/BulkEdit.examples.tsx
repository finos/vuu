import { useVuuMenuActions } from "@finos/vuu-data-react";
import { getSchema, vuuModule, VuuTableName } from "@finos/vuu-data-test";
import { LocalDataSourceProvider } from "@finos/vuu-data-test";
import { ContextMenuProvider, DialogProvider } from "@finos/vuu-popups";
import { Table, TableProps } from "@finos/vuu-table";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { useMemo } from "react";
import { getDefaultColumnConfig } from "./columnMetaData";
import { DemoTableContainer } from "./DemoTableContainer";

let displaySequence = 1;

const BulkEditTableTemplate = ({
  table = "instruments",
}: {
  table?: VuuTableName;
}) => {
  const schema = getSchema(table);

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columns: applyDefaultColumnConfig(schema, getDefaultColumnConfig),
        rowSeparators: true,
      },
      dataSource: vuuModule("SIMUL").createDataSource(table),
    }),
    [schema, table],
  );

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
  });

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}
    >
      <DemoTableContainer>
        <Table {...tableProps} />
      </DemoTableContainer>
    </ContextMenuProvider>
  );
};

export const BulkEditTable = () => {
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <DialogProvider>
        <BulkEditTableTemplate />
      </DialogProvider>
    </LocalDataSourceProvider>
  );
};
BulkEditTable.displaySequence = displaySequence++;
