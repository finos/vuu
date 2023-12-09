import {
  Selection,
  SelectionChangeHandler,
  TableConfig,
} from "@finos/vuu-datagrid-types";
import { Table, TableProps } from "@finos/vuu-table";
import { DockLayout, Drawer } from "@finos/vuu-layout";
import { useCallback, useMemo, useRef, useState } from "react";
import { List, ListItem } from "@salt-ds/lab";
import { getSchema, SimulTableName, vuuModule } from "@finos/vuu-data-test";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { DefaultColumnConfiguration } from "@finos/vuu-shell";

let displaySequence = 1;

export const DataTable = (props: Partial<TableProps>) => {
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
    <>
      <Table
        {...props}
        config={tableConfig}
        dataSource={dataSource}
        height={500}
        renderBufferSize={20}
        width={600}
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

  const handleSelectionChange: SelectionChangeHandler = useCallback(
    (selection: Selection) => {
      if (selection.length > 0) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    },
    []
  );

  return (
    <DockLayout style={{ width: 500, height: 500 }}>
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
      <DataTable onSelectionChange={handleSelectionChange} />
    </DockLayout>
  );
};

export const RightInlineDrawerPeek = () => (
  <InlineDrawer position="right" inline peekaboo />
);
RightInlineDrawerPeek.displaySequence = displaySequence++;

export const SingleHeadingRow = () => {
  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(() => {
    const tableName: SimulTableName = "instruments";
    return {
      // prettier-ignore
      config: {
        columns: [
          // { name: "bbg",  serverDataType: "string" }, 
          // { name: "isin",  serverDataType: "string" }, 
          // { name: "ric",  serverDataType: "string" }, 
          // { name: "description",  serverDataType: "string" }, 
          // { name: "currency",   serverDataType: "string" }, 
          // { name: "exchange",   serverDataType: "string" }, 
          // { name: "lotSize",   serverDataType: "int" }, 
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
    <Table {...tableProps} height={645} renderBufferSize={10} width={720} />
  );
};
SingleHeadingRow.displaySequence = displaySequence++;
