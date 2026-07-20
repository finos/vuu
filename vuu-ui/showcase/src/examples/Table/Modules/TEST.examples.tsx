import {
  getSchema,
  LocalDataSourceProvider,
  TestTableName,
} from "@vuu-ui/vuu-data-test";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { DemoTableContainer } from "../DemoTableContainer";

const TestTableTemplate = ({ tableName }: { tableName: TestTableName }) => {
  const schema = getSchema(tableName);
  const { VuuDataSource } = useData();

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columns: schema.columns,
        columnDefaultWidth: 200,
        rowSeparators: true,
        zebraStripes: true,
      },

      dataSource: new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    }),
    [VuuDataSource, schema.columns, schema.table],
  );

  return <Table {...tableProps} renderBufferSize={50} />;
};

export const BasketConstituent = () => (
  <LocalDataSourceProvider>
    <DemoTableContainer>
      <TestTableTemplate tableName="TestDates" />
    </DemoTableContainer>
  </LocalDataSourceProvider>
);
