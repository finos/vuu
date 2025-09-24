import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import {
  LocalDataSourceProvider,
  SimulTableName,
  getSchema,
} from "@vuu-ui/vuu-data-test";
import { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { DockLayout, Drawer } from "@vuu-ui/vuu-layout";
import { Table, TableProps, useHeaderProps } from "@vuu-ui/vuu-table";
import {
  BaseRowProps,
  SelectionChangeHandler,
  TableConfig,
} from "@vuu-ui/vuu-table-types";
import { ListBox, Option } from "@salt-ds/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { columnGenerator, rowGenerator } from "./SimpleTableDataGenerator";
import { VuuRpcMenuRequest } from "@vuu-ui/vuu-protocol-types";
import { useData } from "@vuu-ui/vuu-utils";

type DataTableProps = Partial<
  Omit<TableProps, "config"> & { config?: Partial<TableConfig> }
> & {
  schema?: TableSchema;
};

const DataTableTemplate = ({
  dataSource: dataSourceProp,
  maxViewportRowLimit,
  navigationStyle = "cell",
  rowHeight,
  schema = getSchema("instruments"),
  viewportRowLimit,
  width = 600,
  ...props
}: DataTableProps) => {
  const { VuuDataSource } = useData();
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      ...props.config,
      columns: schema.columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [props.config, schema]);

  const dataSource = useMemo(() => {
    return dataSourceProp ?? new VuuDataSource({ table: schema.table });
  }, [VuuDataSource, dataSourceProp, schema.table]);

  return (
    <Table
      {...props}
      config={tableConfig}
      data-testid="table"
      dataSource={dataSource}
      height={500}
      maxViewportRowLimit={maxViewportRowLimit}
      navigationStyle={navigationStyle}
      renderBufferSize={20}
      rowHeight={rowHeight}
      viewportRowLimit={viewportRowLimit}
      width={width}
    />
  );
};

export const ViewportRowLimitDefaultRowHeight = () => {
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate viewportRowLimit={10} />
    </LocalDataSourceProvider>
  );
};

export const ViewportRowLimitExplicitRowHeight = () => {
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate rowHeight={30} viewportRowLimit={10} />
    </LocalDataSourceProvider>
  );
};

export const MaxViewportRowLimitRowsExceedLimit = () => {
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate maxViewportRowLimit={10} />
    </LocalDataSourceProvider>
  );
};

export const MaxViewportRowLimitFewRows = ({
  width,
}: Pick<TableProps, "width">) => {
  const schema = getSchema("basket");
  console.log({ schema });
  return (
    <LocalDataSourceProvider>
      <DataTableTemplate
        maxViewportRowLimit={10}
        schema={schema}
        width={width}
      />
    </LocalDataSourceProvider>
  );
};

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
  const { VuuDataSource } = useData();
  const schema = getSchema("instruments");

  const list = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const dataSource = useMemo(
    () => new VuuDataSource({ table: schema.table }),
    [VuuDataSource, schema],
  );

  const handleSelectionChange = useCallback<SelectionChangeHandler>(
    (selectionChange) => {
      if (
        selectionChange.type === "SELECT_ROW" ||
        selectionChange.type === "SELECT_ROW_RANGE"
      ) {
        setOpen(true);
        dataSource
          .menuRpcCall({
            rpcName: "VP_BULK_EDIT_BEGIN_RPC",
            type: "VIEW_PORT_MENUS_SELECT_RPC",
            namedParams: {},
          } as Omit<VuuRpcMenuRequest, "vpId">)
          .then((response) => {
            console.log(`response`, {
              response,
            });
          });
      } else {
        setOpen(false);
      }
    },
    [dataSource],
  );

  return (
    <LocalDataSourceProvider>
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
            <ListBox>
              <Option value="Item 1" />
              <Option value="Item 2" />
              <Option value="Item 3" />
              <Option value="Item 4" />
              <Option value="Item 5" />
              <Option value="Item 6" />
            </ListBox>
          </div>
        </Drawer>
        <DataTableTemplate
          config={{ columnLayout: "fit" }}
          dataSource={dataSource}
          navigationStyle="row"
          onSelectionChange={handleSelectionChange}
          width="100%"
        />
      </DockLayout>
    </LocalDataSourceProvider>
  );
};

export const RightInlineDrawerPeek = () => (
  <InlineDrawer position="right" inline />
);

export const SingleHeadingRow = () => {
  const tableName: SimulTableName = "instruments";
  const schema = getSchema(tableName);
  const { VuuDataSource } = useData();
  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(() => {
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
      dataSource: new VuuDataSource({ table: schema.table }),
    };
  }, []);

  return (
    <Table {...tableProps} height={645} renderBufferSize={10} width={800} />
  );
};

const SimpleCustomHeader = ({ ariaRole, ariaRowIndex }: BaseRowProps) => {
  return (
    <div
      aria-rowindex={ariaRowIndex}
      className="SimpleCustomHeader"
      role={ariaRole}
      style={{ height: 15, backgroundColor: "black", color: "white" }}
    >
      This is the simplest possible custom header
    </div>
  );
};

export const CustomHeaderComponent = () => {
  const { VuuDataSource } = useData();
  const tableName: SimulTableName = "instruments";
  const schema = getSchema(tableName);

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(() => {
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
      dataSource: new VuuDataSource({ table: schema.table }),
    };
  }, [VuuDataSource, schema]);

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

const CustomColumnHeader = ({
  ariaRole,
  ariaRowIndex,
}: Partial<BaseRowProps>) => {
  const { columns, virtualColSpan } = useHeaderProps();
  return (
    <div
      aria-rowindex={ariaRowIndex}
      className="SimpleCustomHeader"
      role={ariaRole}
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
    [],
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

export const MultipleCustomHeaders = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: columnGenerator(10),
      rowSeparators: true,
      zebraStripes: true,
    }),
    [],
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
    [],
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
