import { ColumnMenu } from "@vuu-ui/vuu-table-extras";
import { RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { MenuActionHandler } from "@vuu-ui/vuu-context-menu";

const tableSchema = getSchema("instruments");

/** tags=data-consumer */
export const DefaultColumnMenu = () => {
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: tableSchema.columns.map(toColumnName),
      table: tableSchema.table,
    });
  }, [VuuDataSource]);

  const column: RuntimeColumnDescriptor = useMemo(
    () => ({
      ariaColIndex: 1,
      label: "Currency",
      name: "ccy",
      valueFormatter: String,
      width: 120,
    }),
    [],
  );

  const menuActionHandler = useCallback<MenuActionHandler>((menuItemId) => {
    console.log(`menuActionHandler ${menuItemId}`);
    return true;
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <DataSourceProvider dataSource={dataSource}>
        <ColumnMenu column={column} menuActionHandler={menuActionHandler} />
      </DataSourceProvider>
    </div>
  );
};
