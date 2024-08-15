import { ArrayDataSource } from "@finos/vuu-data-local";
import { SimulTableName, getSchema, vuuModule } from "@finos/vuu-data-test";
import {
  DataSource,
  Selection,
  SelectionChangeHandler,
} from "@finos/vuu-data-types";
import { DockLayout, Drawer } from "@finos/vuu-layout";
import { Table, TableProps, useHeaderProps } from "@finos/vuu-table";
import { TableConfig } from "@finos/vuu-table-types";
import { List, ListItem } from "@finos/vuu-ui-controls";
import { useCallback, useMemo, useRef, useState } from "react";
import { columnGenerator, rowGenerator } from "./SimpleTableDataGenerator";

let displaySequence = 1;

type DataTableProps = Partial<
  Omit<TableProps, "config"> & { config?: Partial<TableConfig> }
>;

export const DataTable = ({
  dataSource: dataSourceProp,
  navigationStyle = "cell",
  width = 600,
  ...props
}: DataTableProps) => {
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      ...props.config,
      columns: getSchema("instruments").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [props.config]);

  const dataSource = useMemo(() => {
    return dataSourceProp ?? vuuModule("SIMUL").createDataSource("instruments");
  }, [dataSourceProp]);

  return (
    <>
      <Table
        {...props}
        config={tableConfig}
        dataSource={dataSource}
        height={500}
        renderBufferSize={20}
        navigationStyle={navigationStyle}
        width={width}
      />
    </>
  );
};

DataTable.displaySequence = displaySequence++;

type InlineDrawerProps = {
  inline?: boolean;
  position: "left" | "right" | "top" | "bottom";
  peekaboo?: boolean;
};

const InlineDrawer = ({
  inline = false,
  position,
  peekaboo = false,
}: InlineDrawerProps) => {
  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const dataSource = useMemo(() => {
    const ds = vuuModule("SIMUL").createDataSource("instruments");
    return ds;
  }, []);

  const handleSelectionChange: SelectionChangeHandler = useCallback(
    (selection: Selection) => {
      if (selection.length > 0) {
        setOpen(true);
        dataSource
          .rpcCall({
            rpcName: "openEditSession",
            type: "VIEW_PORT_RPC_CALL",
            namedParams: {
              table: dataSource.table,
            },
            params: [],
          })
          .then((response) => {
            console.log(`response`, {
              response,
            });
          });
      } else {
        setOpen(false);
      }
    },
    [dataSource]
  );

  return (
    <DockLayout style={{ height: 500 }}>
      <Drawer
        inline={inline}
        open={open}
        peekaboo={peekaboo}
        position={position}
        title="Rebecca"
        defaultOpen={false}
      >
        <div
          ref={list}
          style={{ width: "100%", height: "100%", background: "yellow" }}
        >
          <List>
            <ListItem>Item 1</ListItem>
            <ListItem>Item 2</ListItem>
            <ListItem>Item 3</ListItem>
            <ListItem>Item 4</ListItem>
            <ListItem>Item 5</ListItem>
            <ListItem>Item 6</ListItem>
          </List>
        </div>
      </Drawer>
      <DataTable
        config={{ columnLayout: "fit" }}
        dataSource={dataSource}
        navigationStyle="row"
        onSelectionChange={handleSelectionChange}
        width="100%"
      />
    </DockLayout>
  );
};

export const RightInlineDrawerPeek = () => (
  <InlineDrawer position="right" inline />
);
RightInlineDrawerPeek.displaySequence = displaySequence++;

export const SingleHeadingRow = () => {
  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(() => {
    const tableName: SimulTableName = "instruments";
    return {
      // prettier-ignore
      config: {
        columns: [
          { name: "bbg", heading: ["Instrument"], serverDataType: "string" },
          { name: "isin", heading: ["Instrument"], serverDataType: "string" },
          { name: "ric", heading: ["Instrument"], serverDataType: "string" },
          { name: "description", heading: ["Instrument"], serverDataType: "string" },
          { name: "currency", heading: ["Exchange Details"], serverDataType: "string" },
          { name: "exchange", heading: ["Exchange Details"], serverDataType: "string" },
          { name: "lotSize", heading: ["Exchange Details"], serverDataType: "int" },
        ],
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
    };
  }, []);

  return (
    <Table {...tableProps} height={645} renderBufferSize={10} width={800} />
  );
};
SingleHeadingRow.displaySequence = displaySequence++;

const SimpleCustomHeader = () => {
  return (
    <div
      className="SimpleCustomHeader"
      style={{ height: 15, backgroundColor: "black", color: "white" }}
    >
      This is the simplest possible custom header
    </div>
  );
};

export const CustomHeaderComponent = () => {
  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(() => {
    const tableName: SimulTableName = "instruments";
    return {
      // prettier-ignore
      config: {
        columns: [
          { name: "bbg", heading: ["Instrument"], serverDataType: "string" },
          { name: "isin", heading: ["Instrument"], serverDataType: "string" },
          { name: "ric", heading: ["Instrument"], serverDataType: "string" },
          { name: "description", heading: ["Instrument"], serverDataType: "string" },
          { name: "currency", heading: ["Exchange Details"], serverDataType: "string" },
          { name: "exchange", heading: ["Exchange Details"], serverDataType: "string" },
          { name: "lotSize", heading: ["Exchange Details"], serverDataType: "int" },
        ],
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
    };
  }, []);

  return (
    <Table
      {...tableProps}
      customHeader={SimpleCustomHeader}
      height={645}
      renderBufferSize={10}
      width={800}
    />
  );
};
CustomHeaderComponent.displaySequence = displaySequence++;

const CustomColumnHeader = () => {
  const { columns, virtualColSpan } = useHeaderProps();
  return (
    <div
      className="SimpleCustomHeader"
      style={{ height: 25, backgroundColor: "black", color: "white" }}
    >
      <div style={{ display: "inline-block", width: virtualColSpan }} />
      {columns.map((col, i) => (
        <div
          key={i}
          style={{
            display: "inline-block",
            width: col.width,
            height: "100%",
            padding: 1,
          }}
        >
          <div style={{ height: "100%", backgroundColor: "white" }} />
        </div>
      ))}
    </div>
  );
};

export const CustomHeaderElementVirtualizedColumns = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: columnGenerator(10),
      rowSeparators: true,
      zebraStripes: true,
    }),
    []
  );

  const dataSource = useMemo<DataSource>(() => {
    const generateRow = rowGenerator(config.columns.map((col) => col.name));
    const data = new Array(200).fill(0).map((_, index) => generateRow(index));
    return new ArrayDataSource({
      columnDescriptors: config.columns,
      data,
    });
  }, [config.columns]);

  const customHeader = useMemo(() => <CustomColumnHeader />, []);

  return (
    <Table
      config={config}
      customHeader={customHeader}
      dataSource={dataSource}
      height={645}
      renderBufferSize={10}
      width={800}
    />
  );
};
CustomHeaderElementVirtualizedColumns.displaySequence = displaySequence++;

export const MultipleCustomHeaders = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: columnGenerator(10),
      rowSeparators: true,
      zebraStripes: true,
    }),
    []
  );

  const dataSource = useMemo<DataSource>(() => {
    const generateRow = rowGenerator(config.columns.map((col) => col.name));
    const data = new Array(200).fill(0).map((_, index) => generateRow(index));
    return new ArrayDataSource({
      columnDescriptors: config.columns,
      data,
    });
  }, [config.columns]);

  const customHeader = useMemo(
    () => <CustomColumnHeader key="custom-header" />,
    []
  );

  return (
    <Table
      config={config}
      customHeader={[SimpleCustomHeader, customHeader]}
      dataSource={dataSource}
      height={645}
      renderBufferSize={10}
      width={800}
    />
  );
};
MultipleCustomHeaders.displaySequence = displaySequence++;
