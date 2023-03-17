import { ArrayDataSource } from "@finos/vuu-data";
import {
  ColumnDescriptor,
  Selection,
  SelectionChangeHandler,
} from "@finos/vuu-datagrid-types";
import { Table, TableProps } from "@finos/vuu-table";
import { Chest, Drawer } from "@finos/vuu-layout";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { useCallback, useMemo, useRef, useState } from "react";
import { List, ListItem } from "@heswell/salt-lab";

let displaySequence = 1;

const NO_CONFIG = {} as const;
const EMPTY_ARRAY: number[] = [];
const useTableConfig = ({
  columnConfig = NO_CONFIG,
  leftPinnedColumns = EMPTY_ARRAY,
  rightPinnedColumns = EMPTY_ARRAY,
  renderBufferSize = 0,
}: {
  columnConfig?: { [key: string]: Partial<ColumnDescriptor> };
  leftPinnedColumns?: number[];
  rightPinnedColumns?: number[];
  renderBufferSize?: number;
} = {}) => {
  return useMemo(() => {
    const count = 1000;
    const data: VuuRowDataItemType[][] = [];
    for (let i = 0; i < count; i++) {
      // prettier-ignore
      data.push([
    `row ${i + 1}`, `#${i+1}  value 1`, "value 2", "value 3", "value 4", "value 5", "value 6", "value 7",  "value 8", "value 9", "value 10" 
  ] );
    }
    const columns: ColumnDescriptor[] = [
      { name: "row number", width: 150 },
      { name: "column 1", width: 120 },
      { name: "column 2", width: 120 },
      { name: "column 3", width: 120 },
      { name: "column 4", width: 120 },
      { name: "column 5", width: 120 },
      { name: "column 6", width: 120 },
      { name: "column 7", width: 120 },
      { name: "column 8", width: 120 },
      { name: "column 9", width: 120 },
      { name: "column 10", width: 120 },
    ].map((col) => ({
      ...col,
      ...columnConfig[col.name],
    }));

    leftPinnedColumns.forEach((index) => (columns[index].pin = "left"));
    rightPinnedColumns.forEach((index) => (columns[index].pin = "right"));

    const dataSource = new ArrayDataSource({
      columnDescriptors: columns,
      data,
    });

    return { config: { columns }, dataSource, renderBufferSize };
  }, [columnConfig, leftPinnedColumns, renderBufferSize, rightPinnedColumns]);
};

export const Table = (props: Partial<TableProps>) => {
  const config = useTableConfig();
  return (
    <>
      <Table
        {...props}
        {...config}
        renderBufferSize={20}
        style={{ height: "100%", width: "100%" }}
      />
    </>
  );
};

Table.displaySequence = displaySequence++;

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
    <Chest style={{ width: "100%", height: "100%" }}>
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
      <Table onSelectionChange={handleSelectionChange} />
    </Chest>
  );
};

export const RightInlineDrawerPeek = () => (
  <InlineDrawer position="right" inline peekaboo />
);
