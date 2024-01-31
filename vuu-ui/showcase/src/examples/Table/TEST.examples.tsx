import { Table, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
import { TestTableName, getSchema, vuuModule } from "@finos/vuu-data-test";
import { useVuuMenuActions } from "@finos/vuu-data-react";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { SchemaColumn } from "packages/vuu-data-types";
import { ColumnDescriptor } from "packages/vuu-table-types";

let displaySequence = 1;

const extendColumnConfig = (
  columns: SchemaColumn[],
  config: Partial<ColumnDescriptor>
) => columns.map<ColumnDescriptor>((col) => ({ ...col, ...config }));

const TestTable = ({ tableName }: { tableName: TestTableName }) => {
  const schema = getSchema(tableName);

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columns: extendColumnConfig(schema.columns, { width: 150 }),
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource: vuuModule<TestTableName>("TEST").createDataSource(tableName),
    }),
    [schema.columns, tableName]
  );

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
  });

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}
    >
      <Table {...tableProps} renderBufferSize={50} />
    </ContextMenuProvider>
  );
};

export const TwoHundredColumns = () => (
  <TestTable tableName="TwoHundredColumns" />
);
TwoHundredColumns.displaySequence = displaySequence++;
