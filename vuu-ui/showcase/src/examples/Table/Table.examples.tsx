import { ArrayDataSource } from "@finos/vuu-data-local";
import {
  getAllSchemas,
  getSchema,
  SimulTableName,
  vuuModule,
} from "@finos/vuu-data-test";
import { DataSource } from "@finos/vuu-data-types";
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
  DefaultColumnConfiguration,
  GroupColumnDescriptor,
  HeaderCellProps,
  TableConfig,
} from "@finos/vuu-table-types";
import { Toolbar } from "@finos/vuu-ui-controls";
import {
  applyDefaultColumnConfig,
  defaultValueFormatter,
  registerComponent,
} from "@finos/vuu-utils";
import { Button } from "@salt-ds/core";
import {
  CSSProperties,
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useTestDataSource } from "../utils";
import { columnGenerator, rowGenerator } from "./SimpleTableDataGenerator";

import "./Table.examples.css";

let displaySequence = 1;

export const TestTable = ({
  height = 625,
  renderBufferSize = 5,
  rowCount = 1000,
  rowHeight = 20,
  width = 1000,
}: {
  height?: string | number;
  renderBufferSize?: number;
  rowCount?: number;
  rowHeight?: number;
  width?: string | number;
}) => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: columnGenerator(5),
      rowSeparators: true,
      zebraStripes: true,
    }),
    [],
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
      dataSource={dataSource}
      height={height}
      renderBufferSize={renderBufferSize}
      rowHeight={rowHeight}
      width={width}
    />
  );
};
TestTable.displaySequence = displaySequence++;

export const NavigationStyle = () => {
  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(() => {
    const tableName: SimulTableName = "instruments";
    return {
      config: {
        columns: getSchema(tableName).columns,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
    };
  }, []);

  const onSelect = useCallback((row) => {
    console.log("onSelect", { row });
  }, []);
  const onSelectionChange = useCallback((selected) => {
    console.log("onSelectionChange", { selected });
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
NavigationStyle.displaySequence = displaySequence++;

export const ControlledNavigation = () => {
  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(() => {
    const tableName: SimulTableName = "instruments";
    return {
      config: {
        columns: getSchema(tableName).columns,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
    };
  }, []);
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
    <>
      <Toolbar>
        <Button variant="secondary" onClick={handlePrevClick}>
          Previous
        </Button>
        <Button variant="secondary" onClick={handleNextClick}>
          Next
        </Button>
      </Toolbar>
      <Table
        {...tableProps}
        height={645}
        highlightedIndex={highlightedIndex}
        navigationStyle="row"
        onHighlight={handleHighlight}
        renderBufferSize={5}
        width={723}
      />
    </>
  );
};
ControlledNavigation.displaySequence = displaySequence++;

export const EditableTableArrayData = () => {
  const getDefaultColumnConfig = useMemo<DefaultColumnConfiguration>(
    () => (_, columnName) => {
      switch (columnName) {
        case "bbg":
          return {
            editable: true,
            type: {
              name: "string",
              renderer: {
                name: "input-cell",
              },
              rules: [
                { name: "vuu-case", value: "upper" },
                {
                  name: "vuu-pattern",
                  value: "^.{5,8}$",
                  message: "Value must contain between 5 and 8 characters",
                },
              ],
            },
          };
        case "currency":
          return {
            editable: true,
            type: {
              name: "string",
              renderer: {
                name: "dropdown-cell",
                values: ["CAD", "EUR", "GBP", "GBX", "USD"],
              },
            },
          };
        case "lotSize":
          return {
            editable: true,
            type: {
              name: "number",
              renderer: {
                name: "input-cell",
              },
            },
          };
        case "exchange":
          return {
            editable: true,
            type: {
              name: "string",
              renderer: {
                name: "input-cell",
              },
            },
          };
        case "ric":
          return {
            editable: true,
            type: {
              name: "string",
              renderer: {
                name: "input-cell",
              },
            },
          };
        case "wishlist":
          return {
            editable: true,
          };
      }
    },
    [],
  );

  const tableProps = useMemo<
    Pick<TableProps, "config" | "dataSource" | "selectionModel">
  >(() => {
    const tableName: SimulTableName = "instrumentsExtended";
    return {
      config: {
        columns: applyDefaultColumnConfig(
          getSchema(tableName),
          getDefaultColumnConfig,
        ),
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
      selectionModel: "checkbox",
    };
  }, [getDefaultColumnConfig]);

  return (
    <Table {...tableProps} height={645} renderBufferSize={10} width={9200} />
  );
};
EditableTableArrayData.displaySequence = displaySequence++;

export const VuuInstruments = () => {
  const schemas = getAllSchemas();
  const { config, dataSource, error } = useTestDataSource({
    // bufferSize: 1000,
    schemas,
  });

  const [tableConfig] = useState<TableConfig>(config);

  if (error) {
    return error;
  }

  return (
    <Table
      config={tableConfig}
      dataSource={dataSource}
      height={625}
      renderBufferSize={5}
      width={715}
    />
  );
};
VuuInstruments.displaySequence = displaySequence++;

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
FlexLayoutTables.displaySequence = displaySequence++;

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
TableInLayoutWithContextPanel.displaySequence = displaySequence++;

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
AutoTable.displaySequence = displaySequence++;

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
AutoTableAsFlexChild.displaySequence = displaySequence++;

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

  const schemas = getAllSchemas();
  const { config, dataSource, error } = useTestDataSource({
    // bufferSize: 1000,
    schemas,
    calculatedColumns,
    tablename: "parentOrders",
  });

  console.log({ config, dataSource });

  const [tableConfig] = useState<TableConfig>(config);

  if (error) {
    return error;
  }

  return (
    <Table
      config={tableConfig}
      dataSource={dataSource}
      height={645}
      renderBufferSize={50}
      width="100%"
    />
  );
};
VuuTableCalculatedColumns.displaySequence = displaySequence++;

export const GroupHeaderCellOneColumn = () => {
  const column: GroupColumnDescriptor = useMemo(() => {
    const valueFormatter = defaultValueFormatter;
    return {
      groupConfirmed: true,
      label: "group-column",
      name: "group-column",
      isGroup: true,
      columns: [
        {
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
GroupHeaderCellOneColumn.displaySequence = displaySequence++;

export const GroupHeaderCellTwoColumn = () => {
  const column: GroupColumnDescriptor = useMemo(() => {
    const valueFormatter = defaultValueFormatter;
    return {
      groupConfirmed: true,
      key: 0,
      label: "group-column",
      name: "group-column",
      isGroup: true,
      columns: [
        {
          name: "currency",
          label: "currency",
          valueFormatter,
          width: 100,
        },
        {
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
GroupHeaderCellTwoColumn.displaySequence = displaySequence++;

export const GroupHeaderCellThreeColumn = () => {
  const valueFormatter = defaultValueFormatter;

  const [column] = useState<GroupColumnDescriptor>({
    groupConfirmed: true,
    label: "group-column",
    name: "group-column",
    isGroup: true,
    columns: [
      {
        name: "currency",
        label: "currency",
        valueFormatter,
        width: 100,
      },
      {
        name: "exchange",
        label: "exchange",
        valueFormatter,
        width: 100,
      },
      {
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
GroupHeaderCellThreeColumn.displaySequence = displaySequence++;

export const GroupHeaderCellThreeColumnFixedWidth = () => {
  const valueFormatter = defaultValueFormatter;

  const [column] = useState<GroupColumnDescriptor>({
    groupConfirmed: true,
    label: "group-column",
    name: "group-column",
    isGroup: true,
    columns: [
      {
        name: "currency",
        label: "currency",
        valueFormatter,
        width: 100,
      },
      {
        name: "exchange",
        label: "exchange",
        valueFormatter,
        width: 100,
      },
      {
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
GroupHeaderCellThreeColumnFixedWidth.displaySequence = displaySequence++;

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
CustomColumnRenderer.displaySequence = displaySequence++;
