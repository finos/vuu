import { Button, Input, InputProps } from "@salt-ds/core";
import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import {
  getSchema,
  LocalDataSourceProvider,
  SimulTableName,
} from "@vuu-ui/vuu-data-test";
import { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import {
  Flexbox,
  FlexboxLayout,
  LayoutProvider,
  ResizeStrategy,
  View,
} from "@vuu-ui/vuu-layout";
import { ContextPanel } from "@vuu-ui/vuu-shell";
import { GroupHeaderCell, Table, TableProps } from "@vuu-ui/vuu-table";
import { ColumnSettingsPanel } from "@vuu-ui/vuu-table-extras";
import {
  ColumnDescriptor,
  ColumnLayout,
  GroupColumnDescriptor,
  HeaderCellProps,
  RuntimeColumnDescriptor,
  SelectionChangeHandler,
  TableConfig,
  TableRowSelectHandler,
} from "@vuu-ui/vuu-table-types";
import {
  ContextPanelProvider,
  ShowContextPanel,
  Toolbar,
} from "@vuu-ui/vuu-ui-controls";
import {
  applyDefaultColumnConfig,
  defaultValueFormatter,
  LayoutJSON,
  registerComponent,
  toColumnName,
  useData,
  VuuShellLocation,
} from "@vuu-ui/vuu-utils";
import {
  CSSProperties,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useAutoLoginToVuuServer } from "../utils";
import { columnGenerator, rowGenerator } from "./SimpleTableDataGenerator";

import "./Misc.examples.css";

export const TestTable = ({
  colHeaderRowHeight = 24,
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
      colHeaderRowHeight={colHeaderRowHeight}
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
  const { VuuDataSource } = useData();
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
    <LocalDataSourceProvider>
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

export const TabInAndOutFixture = () => {
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
  const { VuuDataSource } = useData();
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

export const FlexLayoutTables = ({
  resizeStrategy,
}: {
  resizeStrategy?: ResizeStrategy;
}) => {
  const schema = getSchema("instruments");
  const { VuuDataSource } = useData();
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: schema.columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [schema]);

  const [ds1, ds2, ds3, ds4] = useMemo(() => {
    return [
      new VuuDataSource({ table: schema.table }),
      new VuuDataSource({ table: schema.table }),
      new VuuDataSource({ table: schema.table }),
      new VuuDataSource({ table: schema.table }),
    ];
  }, [VuuDataSource, schema]);

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ flexDirection: "column", width: "100%", height: "100%" }}
      >
        <FlexboxLayout resizeable style={{ flexDirection: "row", flex: 1 }}>
          <View resizeable style={{ flex: 1 }}>
            <Table
              config={tableConfig}
              dataSource={ds1}
              resizeStrategy={resizeStrategy}
            />
          </View>

          <View resizeable style={{ flex: 1 }}>
            <Table
              config={tableConfig}
              dataSource={ds2}
              resizeStrategy={resizeStrategy}
            />
          </View>
        </FlexboxLayout>
        <FlexboxLayout resizeable style={{ flexDirection: "row", flex: 1 }}>
          <View resizeable style={{ flex: 1 }}>
            <Table
              config={tableConfig}
              dataSource={ds3}
              resizeStrategy={resizeStrategy}
            />
          </View>

          <View resizeable style={{ flex: 1 }}>
            <Table
              config={tableConfig}
              dataSource={ds4}
              resizeStrategy={resizeStrategy}
            />
          </View>
        </FlexboxLayout>
      </FlexboxLayout>
    </LayoutProvider>
  );
};

export const FlexLayoutTablesResizeDefer = () => (
  <FlexLayoutTables resizeStrategy="defer" />
);

export const TableInLayoutWithContextPanel = () => {
  const schema = getSchema("instruments");
  const { VuuDataSource } = useData();

  useMemo(() => {
    registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
  }, []);
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: schema.columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [schema]);
  const dataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource, schema.table],
  );

  return (
    <LayoutProvider>
      <FlexboxLayout style={{ height: 645, width: "100%" }}>
        <Table
          config={tableConfig}
          dataSource={dataSource}
          renderBufferSize={30}
          width="100%"
        />
        <ContextPanel id={VuuShellLocation.ContextPanel} overlay></ContextPanel>
      </FlexboxLayout>
    </LayoutProvider>
  );
};

export const CheckboxTableInLayoutWithContextPanel = () => {
  useMemo(() => {
    registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
  }, []);
  const { VuuDataSource } = useData();
  const schema = getSchema("instruments");
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: schema.columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [schema]);
  const dataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource, schema.table],
  );

  return (
    <LayoutProvider>
      <FlexboxLayout style={{ height: 645, width: "100%" }}>
        <Table
          config={tableConfig}
          dataSource={dataSource}
          renderBufferSize={30}
          selectionModel="checkbox"
          width="100%"
        />
        <ContextPanel id={VuuShellLocation.ContextPanel} overlay></ContextPanel>
      </FlexboxLayout>
    </LayoutProvider>
  );
};

const NullContext = {
  component: undefined,
  expanded: false,
  title: "",
};
export const TableInLayoutWithCustomContextPanel = () => {
  useMemo(() => {
    registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
  }, []);
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: getSchema("instruments").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);
  const { VuuDataSource } = useData();
  const schema = getSchema("instruments");
  const dataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource, schema.table],
  );

  const [{ component, expanded, title }, setContextState] = useState<{
    component?: LayoutJSON;
    expanded: boolean;
    title: string;
  }>(NullContext);

  const showContextPanel = useCallback<ShowContextPanel>(
    (componentType, title, props) => {
      const component = { type: componentType, props } as LayoutJSON;
      console.log(component);
      setContextState({ component, expanded: true, title });
    },
    [],
  );

  const hideContextPanel = useCallback(() => {
    setContextState(NullContext);
  }, []);

  const handleClose = useCallback(() => {
    // setContextState(NullContext);
  }, []);

  return (
    <ContextPanelProvider
      hideContextPanel={hideContextPanel}
      showContextPanel={showContextPanel}
    >
      <FlexboxLayout style={{ height: 645, width: "100%" }}>
        <Table
          config={tableConfig}
          dataSource={dataSource}
          renderBufferSize={30}
          width="100%"
        />
        <ContextPanel
          content={component}
          expanded={expanded}
          id={VuuShellLocation.ContextPanel}
          onClose={handleClose}
          overlay
          title={title}
        />
      </FlexboxLayout>
    </ContextPanelProvider>
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
  const { VuuDataSource } = useData();
  const schema = getSchema("instruments");
  const dataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource, schema.table],
  );

  return (
    <Table config={tableConfig} dataSource={dataSource} renderBufferSize={0} />
  );
};

export const AutoTableAsFlexChild = () => {
  const schema = getSchema("instruments");
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: schema.columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [schema]);
  const { VuuDataSource } = useData();
  const dataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource, schema.table],
  );

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
  const handleRemoveColumn = useCallback((column: RuntimeColumnDescriptor) => {
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
  const handleRemoveColumn = useCallback((column: RuntimeColumnDescriptor) => {
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
  const handleRemoveColumn = useCallback((column: RuntimeColumnDescriptor) => {
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
  const handleRemoveColumn = useCallback((column: RuntimeColumnDescriptor) => {
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

  console.log("SymbolHeader");

  return (
    <span
      style={{
        cursor: "pointer",
        flex: 1,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <Button
        appearance="solid"
        data-icon="add"
        onClick={handleClick}
        sentiment="neutral"
      />
    </span>
  );
};

registerComponent(
  "symbol-header",
  SymbolHeader,
  "column-header-content-renderer",
  {},
);

export const CustomColumnRenderer = () => {
  const { VuuDataSource } = useData();
  const schema = getSchema("instruments");
  const dataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource, schema.table],
  );
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
      dataSource,
    };
  }, [dataSource]);

  console.log({ tableProps });

  const onSelect = useCallback<TableRowSelectHandler>((row) => {
    console.log({ row });
  }, []);
  const onSelectionChange = useCallback<SelectionChangeHandler>(
    (selectionChange) => {
      console.log({ selectionChange });
    },
    [],
  );

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
