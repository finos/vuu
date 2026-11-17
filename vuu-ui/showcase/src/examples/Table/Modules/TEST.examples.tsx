import { Button } from "@salt-ds/core";
import {
  getSchema,
  LocalDataSourceProvider,
  TestTableName,
} from "@vuu-ui/vuu-data-test";
import { Table, TableProps } from "@vuu-ui/vuu-table";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";
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

export const TestDates = () => (
  <LocalDataSourceProvider>
    <DemoTableContainer>
      <TestTableTemplate tableName="TestDates" />
    </DemoTableContainer>
  </LocalDataSourceProvider>
);

export const MaxScrollEndTable = () => (
  <LocalDataSourceProvider>
    <DemoTableContainer>
      <TestTableTemplate tableName="MaxScrollEndTable" />
    </DemoTableContainer>
  </LocalDataSourceProvider>
);

const RemountableTestTable = ({ tableName }: { tableName: TestTableName }) => {
  const schema = getSchema(tableName);
  const { VuuDataSource } = useData();
  const [tableMounted, setTableMounted] = useState(true);

  // The dataSource outlives the Table, so a remounted Table resumes it
  // rather than subscribing afresh.
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

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Button
        data-testid="toggle-table"
        onClick={() => setTableMounted((mounted) => !mounted)}
      >
        {tableMounted ? "Unmount table" : "Mount table"}
      </Button>
      {tableMounted ? (
        <Table {...tableProps} height={600} renderBufferSize={50} />
      ) : null}
    </div>
  );
};

export const MaxScrollEndTableRemount = () => (
  <LocalDataSourceProvider>
    <DemoTableContainer>
      <RemountableTestTable tableName="MaxScrollEndTable" />
    </DemoTableContainer>
  </LocalDataSourceProvider>
);
