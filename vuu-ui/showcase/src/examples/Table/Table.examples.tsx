import { ArrayDataSource } from "@finos/vuu-data-local";
import {
  getSchema,
  LocalDataSourceProvider,
  SimulTableName,
  vuuModule,
} from "@finos/vuu-data-test";
import { DataSource, TableSchema } from "@finos/vuu-data-types";
import {
  Flexbox,
  FlexboxLayout,
  LayoutProvider,
  View,
} from "@finos/vuu-layout";
import { ContextPanel } from "@finos/vuu-shell";
import { GroupHeaderCell, Table, TableProps } from "@finos/vuu-table";
import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";
import {
  ColumnDescriptor,
  ColumnLayout,
  GroupColumnDescriptor,
  HeaderCellProps,
  TableConfig,
} from "@finos/vuu-table-types";
import { Toolbar } from "@finos/vuu-ui-controls";
import {
  applyDefaultColumnConfig,
  defaultValueFormatter,
  registerComponent,
  toColumnName,
  useDataSource,
} from "@finos/vuu-utils";
import { Button, Input, InputProps } from "@salt-ds/core";
import {
  CSSProperties,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useAutoLoginToVuuServer } from "../utils";
import { columnGenerator, rowGenerator } from "./SimpleTableDataGenerator";

import { VuuDataSourceProvider } from "@finos/vuu-data-react";
import "./Table.examples.css";

export const TestTable = ({
  columnLayout,
  config: configProp,
  height = 625,
  renderBufferSize = 5,
  rowCount = 1000,
  rowHeight = 20,
  width = 1000,
}: Partial<TableProps> & {
  columnLayout?: ColumnLayout;
  rowCount?: number;
}) => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: columnGenerator(5),
      rowSeparators: true,
      zebraStripes: true,
      columnLayout,
      ...configProp,
    }),
    [columnLayout, configProp],
  );

  const dataSource = useMemo<DataSource>(() => {
    const generateRow = rowGenerator(config.columns.map((col) => col.name));
    const data = new Array(rowCount)
      .fill(0)
      .map((_, index) => generateRow(index));
    return new ArrayDataSource({
      columnDescriptors: config.columns,
      data,
    });
  }, [config.columns, rowCount]);

  return (
    <Table
      config={config}
      data-testid="test-table"
      dataSource={dataSource}
      height={height}
      renderBufferSize={renderBufferSize}
      rowHeight={rowHeight}
      width={width}
    />
  );
};

const TableTemplate = ({
  config,
  height = 645,
  highlightedIndex,
  navigationStyle,
  schema,
  width = 723,
  ...props
}: {
  columns?: ColumnDescriptor[];
  schema: TableSchema;
} & Partial<TableProps>) => {
  const { VuuDataSource } = useDataSource();

  const tableConfig = useMemo<TableConfig>(() => {
    return (
      config ?? {
        columns: schema.columns,
        rowSeparators: true,
        zebraStripes: true,
      }
    );
  }, [config, schema]);

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: tableConfig.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource, tableConfig.columns, schema]);

  return (
    <Table
      {...props}
      config={tableConfig}
      data-testid="table"
      dataSource={dataSource}
      height={height}
      highlightedIndex={highlightedIndex}
      navigationStyle={navigationStyle}
      renderBufferSize={5}
      width={width}
    />
  );
};

export const ControlledNavigation = () => {
  const schema = getSchema("instruments");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const handlePrevClick = useCallback(() => {
    setHighlightedIndex((idx) => Math.max(0, idx - 1));
  }, []);

  const handleNextClick = useCallback(() => {
    setHighlightedIndex((idx) => idx + 1);
  }, []);

  const handleHighlight = useCallback((idx: number) => {
    setHighlightedIndex(idx);
  }, []);

  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <Toolbar>
        <Button variant="secondary" onClick={handlePrevClick}>
          Previous
        </Button>
        <Button variant="secondary" onClick={handleNextClick}>
          Next
        </Button>
      </Toolbar>
      <TableTemplate
        highlightedIndex={highlightedIndex}
        navigationStyle="row"
        onHighlight={handleHighlight}
        schema={schema}
      />
    </LocalDataSourceProvider>
  );
};

export const TabInAndOut = () => {
  return (
    <div style={{ width: 950 }}>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          height: 32,
          padding: "0 12px",
        }}
      >
        <Input
          placeholder="start here"
          inputProps={
            { "data-testid": "input-start" } as InputProps["inputProps"]
          }
        />
      </div>
      <div style={{ height: 600 }}>
        <TestTable height="100%" width="100%" />
      </div>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          height: 32,
          padding: "0 12px",
        }}
      >
        <Input
          placeholder="end here"
          inputProps={
            { "data-testid": "input-end" } as InputProps["inputProps"]
          }
        />
      </div>
    </div>
  );
};

const VuuTableTemplate = ({ schema }: { schema: TableSchema }) => {
  const { VuuDataSource } = useDataSource();
  const dataSource = useMemo(() => {
    const { table } = schema;
    const dataSource = new VuuDataSource({
      columns: schema.columns.map((c) => c.name),
      table,
    });
    return dataSource;
  }, [VuuDataSource, schema]);

  const config = useMemo<TableConfig>(
    () => ({
      columns: schema.columns,
    }),
    [schema.columns],
  );

  console.log({ columns: schema.columns });

  return (
    <Table
      config={config}
      dataSource={dataSource}
      height={625}
      renderBufferSize={5}
      width={715}
    />
  );
};

export const VuuInstruments = () => {
  const schema = getSchema("instruments");
  return (
    <VuuDataSourceProvider>
      <VuuTableTemplate schema={schema} />
    </VuuDataSourceProvider>
  );
};

export const FlexLayoutTables = () => {
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: getSchema("instruments").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);

  const [ds1, ds2, ds3, ds4] = useMemo(() => {
    return [
      vuuModule("SIMUL").createDataSource("instruments"),
      vuuModule("SIMUL").createDataSource("instruments"),
      vuuModule("SIMUL").createDataSource("instruments"),
      vuuModule("SIMUL").createDataSource("instruments"),
    ];
  }, []);

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ flexDirection: "column", width: "100%", height: "100%" }}
      >
        <FlexboxLayout resizeable style={{ flexDirection: "row", flex: 1 }}>
          <View resizeable style={{ flex: 1 }}>
            <Table config={tableConfig} dataSource={ds1} />
          </View>

          <View resizeable style={{ flex: 1 }}>
            <Table config={tableConfig} dataSource={ds2} />
          </View>
        </FlexboxLayout>
        <FlexboxLayout resizeable style={{ flexDirection: "row", flex: 1 }}>
          <View resizeable style={{ flex: 1 }}>
            <Table config={tableConfig} dataSource={ds3} />
          </View>

          <View resizeable style={{ flex: 1 }}>
            <Table config={tableConfig} dataSource={ds4} />
          </View>
        </FlexboxLayout>
      </FlexboxLayout>
    </LayoutProvider>
  );
};

export const TableInLayoutWithContextPanel = () => {
  useMemo(() => {
    registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
    registerComponent("TableSettings", TableSettingsPanel, "view");
  }, []);
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: getSchema("instruments").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);
  const dataSource = useMemo(() => {
    return vuuModule("SIMUL").createDataSource("instruments");
  }, []);

  return (
    <LayoutProvider>
      <FlexboxLayout style={{ height: 645, width: "100%" }}>
        <Table
          config={tableConfig}
          dataSource={dataSource}
          renderBufferSize={30}
          width="100%"
        />
        <ContextPanel overlay></ContextPanel>
      </FlexboxLayout>
    </LayoutProvider>
  );
};

export const AutoTable = () => {
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: getSchema("instruments").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);
  const dataSource = useMemo(() => {
    return vuuModule("SIMUL").createDataSource("instruments");
  }, []);

  return (
    <Table config={tableConfig} dataSource={dataSource} renderBufferSize={0} />
  );
};

export const AutoTableAsFlexChild = () => {
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: getSchema("instruments").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);
  const dataSource = useMemo(() => {
    return vuuModule("SIMUL").createDataSource("instruments");
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 100px)",
        marginLeft: 50,
        marginTop: 50,
        width: "calc(100vw - 100px)",
      }}
    >
      <div style={{ flex: "1 1 auto" }}>
        <Table
          config={tableConfig}
          dataSource={dataSource}
          renderBufferSize={0}
        />
      </div>
    </div>
  );
};

export const VuuTableCalculatedColumns = () => {
  const calculatedColumns: ColumnDescriptor[] = useMemo(
    () => [
      {
        name: "notional:double:=price*quantity",
        serverDataType: "double",
        type: {
          name: "number",
          formatting: {
            decimals: 2,
          },
        },
      },
      {
        name: "pctFilled:double:=if(volLimit = 0, 0, volLimit/quantity)",
        serverDataType: "double",
      },
      {
        name: 'openEur:boolean:=and(ccy="EUR",openQty>2000)',
        serverDataType: "boolean",
      },
      {
        name: 'isBuy:char:=if(side="Sell","N","Y")',
        serverDataType: "char",
      },
      {
        name: 'CcySort:char:=if(ccy="Gbp",1,if(ccy="USD",2,3))',
        serverDataType: "char",
        width: 60,
      },
      {
        name: "CcyLower:string:=lower(ccy)",
        serverDataType: "string",
        width: 60,
      },
      {
        name: "AccountUpper:string:=upper(account)",
        label: "ACCOUNT",
        serverDataType: "string",
      },
      {
        name: 'ExchangeCcy:string:=concatenate("---", exchange,"...",ccy, "---")',
        serverDataType: "string",
      },
      {
        name: 'ExchangeIsNY:boolean:=starts(exchange,"N")',
        serverDataType: "boolean",
      },
      // {
      //   name: "Text",
      //   expression: "=text(quantity)",
      //   serverDataType: "string",
      // },
    ],
    [],
  );

  useAutoLoginToVuuServer({ authenticate: false, secure: false });

  const schema = getSchema("parentOrders");
  return (
    <VuuDataSourceProvider>
      <TableTemplate
        columns={
          [...schema.columns, ...calculatedColumns] as ColumnDescriptor[]
        }
        renderBufferSize={50}
        schema={schema}
        width="100%"
      />
    </VuuDataSourceProvider>
  );
};

export const GroupHeaderCellOneColumn = () => {
  const column = useMemo<GroupColumnDescriptor>(() => {
    const valueFormatter = defaultValueFormatter;
    return {
      ariaColIndex: 1,
      groupConfirmed: true,
      label: "group-column",
      name: "group-column",
      isGroup: true,
      columns: [
        {
          ariaColIndex: -1,
          key: 1,
          name: "currency",
          label: "currency",
          valueFormatter,
          width: 100,
        },
      ],
      valueFormatter,
      width: 150,
    };
  }, []);
  const handleRemoveColumn = useCallback((column) => {
    console.log(`remove column ${column.name}`);
  }, []);

  return (
    <div
      style={
        {
          "--header-height": "24px",
        } as CSSProperties
      }
    >
      <GroupHeaderCell column={column} onRemoveColumn={handleRemoveColumn} />
    </div>
  );
};

export const GroupHeaderCellTwoColumn = () => {
  const column = useMemo<GroupColumnDescriptor>(() => {
    const valueFormatter = defaultValueFormatter;
    return {
      ariaColIndex: 1,
      groupConfirmed: true,
      key: 0,
      label: "group-column",
      name: "group-column",
      isGroup: true,
      columns: [
        {
          ariaColIndex: -1,
          name: "currency",
          label: "currency",
          valueFormatter,
          width: 100,
        },
        {
          ariaColIndex: -1,
          name: "exchange",
          label: "exchange",
          valueFormatter,
          width: 100,
        },
      ],
      valueFormatter,
      width: 200,
    };
  }, []);
  const handleRemoveColumn = useCallback((column) => {
    console.log(`remove column ${column.name}`);
  }, []);

  return (
    <div
      style={
        {
          "--header-height": "24px",
        } as CSSProperties
      }
    >
      <GroupHeaderCell column={column} onRemoveColumn={handleRemoveColumn} />
    </div>
  );
};

export const GroupHeaderCellThreeColumn = () => {
  const valueFormatter = defaultValueFormatter;

  const [column] = useState<GroupColumnDescriptor>({
    ariaColIndex: 1,
    groupConfirmed: true,
    label: "group-column",
    name: "group-column",
    isGroup: true,
    columns: [
      {
        ariaColIndex: -1,
        name: "currency",
        label: "currency",
        valueFormatter,
        width: 100,
      },
      {
        ariaColIndex: -1,
        name: "exchange",
        label: "exchange",
        valueFormatter,
        width: 100,
      },
      {
        ariaColIndex: -1,
        name: "price",
        label: "proce",
        valueFormatter,
        width: 100,
      },
    ],
    valueFormatter,
    width: 250,
  });
  const handleRemoveColumn = useCallback((column) => {
    console.log(`remove column ${column.name}`);
  }, []);

  return (
    <Flexbox
      style={
        {
          flexDirection: "row",
          width: 400,
          height: 50,
          "--header-height": "24px",
        } as CSSProperties
      }
    >
      <div data-resizeable style={{ flex: "1 1 auto", overflow: "hidden" }}>
        <GroupHeaderCell
          className="vuuFullWidthExample"
          column={column}
          onRemoveColumn={handleRemoveColumn}
        />
      </div>
      <div data-resizeable style={{ background: "yellow", flex: 1 }} />
    </Flexbox>
  );
};

export const GroupHeaderCellThreeColumnFixedWidth = () => {
  const valueFormatter = defaultValueFormatter;

  const [column] = useState<GroupColumnDescriptor>({
    ariaColIndex: 1,
    groupConfirmed: true,
    label: "group-column",
    name: "group-column",
    isGroup: true,
    columns: [
      {
        ariaColIndex: -1,
        name: "currency",
        label: "currency",
        valueFormatter,
        width: 100,
      },
      {
        ariaColIndex: -1,
        name: "exchange",
        label: "exchange",
        valueFormatter,
        width: 100,
      },
      {
        ariaColIndex: -1,
        name: "price",
        label: "price",
        valueFormatter,
        width: 100,
      },
    ],
    valueFormatter,
    width: 250,
  });
  const handleRemoveColumn = useCallback((column) => {
    console.log(`remove column ${column.name}`);
  }, []);

  return (
    <div data-resizeable style={{ width: 300, overflow: "hidden" }}>
      <GroupHeaderCell
        className="vuuFullWidthExample"
        column={column}
        onRemoveColumn={handleRemoveColumn}
      />
    </div>
  );
};

const SymbolHeader = (_: HeaderCellProps) => {
  const handleClick = useCallback<MouseEventHandler>((e) => {
    e.stopPropagation();
    console.log("click");
  }, []);

  return (
    <span
      style={{
        cursor: "pointer",
        flex: 1,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <Button variant="primary" data-icon="add" onClick={handleClick} />
    </span>
  );
};

registerComponent("symbol-header", SymbolHeader, "cell-renderer", {});

export const CustomColumnRenderer = () => {
  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(() => {
    const tableName: SimulTableName = "instruments";
    return {
      config: {
        columns: applyDefaultColumnConfig(
          getSchema(tableName),
          (tableName, column) => {
            if (column === "bbg") {
              return {
                colHeaderContentRenderer: "symbol-header",
              };
            }
          },
        ),
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
    };
  }, []);

  const onSelect = useCallback((row) => {
    console.log({ row });
  }, []);
  const onSelectionChange = useCallback((selected) => {
    console.log({ selected });
  }, []);

  return (
    <Table
      {...tableProps}
      height={645}
      navigationStyle="row"
      renderBufferSize={5}
      onSelect={onSelect}
      onSelectionChange={onSelectionChange}
      width={723}
    />
  );
};
