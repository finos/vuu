import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import { DataSource } from "@vuu-ui/vuu-data-types";
import {
  ColumnModel,
  ColumnPickerAction,
  DataSourceStats,
  TableFooter,
  TableFooterTray,
} from "@vuu-ui/vuu-table-extras";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { Range } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";

const testColumns: ColumnDescriptor[] = [
  { name: "key", serverDataType: "string" },
  { name: "name", serverDataType: "string", width: 150 },
  { name: "value", serverDataType: "int" },
  { name: "created", serverDataType: "long" },
];

const testData = [
  ["0001", "Andrew Arkwright", 234, 0],
  ["0002", "Brenda Burton", 100, 0],
  ["0003", "Charli Choplin", 234, 0],
  ["0004", "Daniel Daytona", 2200, 0],
  ["0005", "Eric Enderby", 234, 0],
  ["0006", "Francesca Ferdinand", 10001, 0],
  ["0007", "Gary Garibaldi", 98, 0],
  ["0008", "Daniel Daytona", 234, 0],
  ["0009", "Daniel Daytona", 234, 0],
  ["0010", "Daniel Daytona", 234, 0],
  ["0011", "Daniel Daytona", 234, 0],
  ["0012", "Daniel Daytona", 234, 0],
  ["0013", "Daniel Daytona", 234, 0],
  ["0014", "Daniel Daytona", 234, 0],
  ["0015", "Daniel Daytona", 234, 0],
  ["0016", "Daniel Daytona", 234, 0],
  ["0017", "Daniel Daytona", 234, 0],
  ["0018", "Daniel Daytona", 234, 0],
  ["0019", "Daniel Daytona", 234, 0],
  ["0020", "Daniel Daytona", 234, 0],
  ["0021", "Daniel Daytona", 234, 0],
  ["0022", "Daniel Daytona", 234, 0],
  ["0023", "Daniel Daytona", 234, 0],
  ["0024", "Daniel Daytona", 234, 0],
  ["0025", "Daniel Daytona", 234, 0],
  ["0026", "Daniel Daytona", 234, 0],
];

export const DefaultTableFooter = () => {
  return <TableFooter />;
};

export const FlexTableFooter = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: "1 1 0px" }} />
      <TableFooter />
    </div>
  );
};

export const WithDataSourceStats = () => {
  const dataSource = useMemo<DataSource>(() => {
    const ds = new ArrayDataSource({
      columnDescriptors: testColumns,
      data: testData,
    });
    ds.range = Range(0, 10);
    return ds;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: "1 1 0px" }} />
      <TableFooter>
        <DataSourceStats dataSource={dataSource} />
      </TableFooter>
    </div>
  );
};

export const WithDataSourceStatsAndTooltrayAction = () => {
  const dataSource = useMemo<DataSource>(() => {
    const ds = new ArrayDataSource({
      columnDescriptors: testColumns,
      data: testData,
    });
    ds.range = Range(0, 10);
    return ds;
  }, []);

  const columnModel = useMemo<ColumnModel>(
    () => new ColumnModel(testColumns, testColumns),
    [],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: "1 1 0px" }} />
      <TableFooter>
        <DataSourceStats dataSource={dataSource} />
        <TableFooterTray>
          <ColumnPickerAction columnModel={columnModel} />
        </TableFooterTray>
      </TableFooter>
    </div>
  );
};
