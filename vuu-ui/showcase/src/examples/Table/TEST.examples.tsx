import { Table, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
import { TestTableName, getSchema, vuuModule } from "@finos/vuu-data-test";
import { useVuuMenuActions } from "@finos/vuu-data-react";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { SchemaColumn } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { DemoTableContainer } from "./DemoTableContainer";

let displaySequence = 1;

const extendColumnConfig = (
  columns: SchemaColumn[],
  config: Partial<ColumnDescriptor>
) => columns.map<ColumnDescriptor>((col) => ({ ...col, ...config }));

const TestTable = ({
  tableName,
  ...props
}: Partial<TableProps> & { tableName: TestTableName }) => {
  const schema = getSchema(tableName);

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      ...props,
      config: {
        columns: extendColumnConfig(schema.columns, {
          width: 150,
        }),
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource: vuuModule<TestTableName>("TEST").createDataSource(tableName),
    }),
    [props, schema.columns, tableName]
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
        <Table {...tableProps} renderBufferSize={50} />
      </DemoTableContainer>
    </ContextMenuProvider>
  );
};

export const TwoHundredColumns = (props: Partial<TableProps>) => (
  <TestTable tableName="TwoHundredColumns" {...props} width={914} />
);
TwoHundredColumns.displaySequence = displaySequence++;
