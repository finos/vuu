import { Button } from "@salt-ds/core";
import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { Table } from "@vuu-ui/vuu-table";
import {
  DataSourceStats,
  DataSourceStatsProps,
} from "@vuu-ui/vuu-table-extras";
import { ColumnDescriptor, TableConfig } from "@vuu-ui/vuu-table-types";
import { VuuInput } from "@vuu-ui/vuu-ui-controls";
import { Range } from "@vuu-ui/vuu-utils";
import { FormEvent, ReactNode, useMemo } from "react";

// prettier-ignore
class TestDataSource extends ArrayDataSource {
  #testSize = 100;
  get size() {  return this.#testSize; }
  set size(val: number) { this.#testSize = val; }
}

const EmptyRange = Range(0, 0);

const DatasourceStatsTemplate = ({
  actions,
  dataSource,
}: Pick<DataSourceStatsProps, "dataSource"> & {
  actions?: ReactNode;
}) => {
  const range = EmptyRange;

  const handleCommitFrom = (_: FormEvent, value: VuuRowDataItemType) => {
    console.log(`commit from ${value}`);
  };
  const handleCommitTo = (_: FormEvent, value: VuuRowDataItemType) => {
    console.log(`commit to ${value}`);
  };

  return (
    <div>
      <div style={{ display: "flex" }}>
        <VuuInput defaultValue={range.from} onCommit={handleCommitFrom} />
        <VuuInput defaultValue={range.to} onCommit={handleCommitTo} />
      </div>
      <div>
        <DataSourceStats dataSource={dataSource}>{actions}</DataSourceStats>
      </div>
    </div>
  );
};

export const DefaultDatasourceStats = () => {
  const dataSource = useMemo(() => {
    return new TestDataSource({
      columnDescriptors: [{ name: "key" }],
      data: [],
    });
  }, []);
  return <DatasourceStatsTemplate dataSource={dataSource} />;
};

const WithStyle = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <style>{`
      .container {
      --vuuTableHeaderCell-height: 32px;
      --vuu-table-row-height: 32px;
        display: flex;
        flex-direction: column;
        height: 391px;
        width: 800px;
        .table-container {
          border: solid 1px lightgray;
          flex: 1 1 0;
        }
        .table-footer {
          flex: 0 0 37px;
          padding: var(--salt-spacing-100);
          transition: flex-basis .2s linear;
          .vuuDatasourceStats {
            background: rgb(21,39,59);
            border-radius: 4px;
            font-size: 14px;
            height: 100%;
          }
        }
        .table-footer:has(.vuuDatasourceStats-withSelection) {
          flex: 0 0 60px;
        }
      }
    `}</style>
      {children}
    </>
  );
};

const TableWithStatsTemplate = ({
  actions = null,
  dataSource,
  config,
}: {
  actions?: ReactNode;
  config: TableConfig;
  dataSource: DataSource;
}) => {
  return (
    <div className="container">
      <div className="table-container">
        <Table config={config} dataSource={dataSource} />
      </div>
      <div className="table-footer">
        <DataSourceStats dataSource={dataSource}>{actions}</DataSourceStats>
      </div>
    </div>
  );
};

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

export const EmptyTable = () => {
  const [config, dataSource] = useMemo<[TableConfig, DataSource]>(() => {
    return [
      {
        columns: testColumns,
      },
      new ArrayDataSource({
        columnDescriptors: testColumns,
        data: [],
      }),
    ];
  }, []);

  return (
    <WithStyle>
      <TableWithStatsTemplate config={config} dataSource={dataSource} />
    </WithStyle>
  );
};

export const ShortTable = () => {
  const [config, dataSource] = useMemo<[TableConfig, DataSource]>(() => {
    return [
      {
        columns: testColumns,
      },
      new ArrayDataSource({
        columnDescriptors: testColumns,
        data: testData.slice(0, 3),
      }),
    ];
  }, []);

  return (
    <WithStyle>
      <TableWithStatsTemplate config={config} dataSource={dataSource} />
    </WithStyle>
  );
};

export const ExactFitTable = () => {
  const [config, dataSource] = useMemo<[TableConfig, DataSource]>(() => {
    return [
      {
        columns: testColumns,
      },
      new ArrayDataSource({
        columnDescriptors: testColumns,
        data: testData.slice(0, 10),
      }),
    ];
  }, []);

  return (
    <WithStyle>
      <TableWithStatsTemplate config={config} dataSource={dataSource} />
    </WithStyle>
  );
};

export const ScrollingTable = () => {
  const [config, dataSource] = useMemo<[TableConfig, DataSource]>(() => {
    return [
      {
        columns: testColumns,
      },
      new ArrayDataSource({
        columnDescriptors: testColumns,
        data: testData.slice(0),
      }),
    ];
  }, []);

  return (
    <WithStyle>
      <TableWithStatsTemplate config={config} dataSource={dataSource} />
    </WithStyle>
  );
};

export const ScrollingTableWithActionAndStyle = () => {
  const [config, dataSource] = useMemo<[TableConfig, DataSource]>(() => {
    return [
      {
        columns: testColumns,
      },
      new ArrayDataSource({
        columnDescriptors: testColumns,
        data: testData.slice(0),
      }),
    ];
  }, []);

  const actions = useMemo<ReactNode>(() => <Button>Cancel</Button>, []);

  return (
    <WithStyle>
      <TableWithStatsTemplate
        actions={actions}
        config={config}
        dataSource={dataSource}
      ></TableWithStatsTemplate>
    </WithStyle>
  );
};
