import { ArrayDataSource } from "@finos/vuu-data-local";
import { ArrayProxy, RowAtIndexFunc } from "@finos/vuu-data-test";
import { DataSource } from "@finos/vuu-data-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { noScrolling, ScrollingAPI, Table } from "@finos/vuu-table";
import { ColumnDescriptor, TableConfig } from "@finos/vuu-table-types";
import { Toolbar } from "@finos/vuu-ui-controls";
import { Button, Input } from "@salt-ds/core";
import {
  ChangeEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

let displaySequence = 1;

type RowGenerator<T = VuuRowDataItemType> = (
  columns: string[]
) => RowAtIndexFunc<T[]>;

export type ColumnGenerator = (count: number) => ColumnDescriptor[];

const columnGenerator: ColumnGenerator = (count) => {
  return [{ name: "row number", width: 150 }].concat(
    Array(count)
      .fill(true)
      .map((_, i) => {
        const name = `column ${i + 1}`;
        return { name, width: 150 };
      })
  );
};

const rowGenerator: RowGenerator<string> = (columns: string[]) => (index) => {
  return [`row ${index + 1}`].concat(
    Array(columns.length)
      .fill(true)
      .map((v, j) => `value ${j + 1} @ ${index + 1}`)
  );
};

export const SimpleTable = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: columnGenerator(5),
    }),
    []
  );

  const dataSource = useMemo<DataSource>(() => {
    const data = new ArrayProxy(
      1_000_000_000,
      rowGenerator(config.columns.map((col) => col.name))
    );
    return new ArrayDataSource({
      columnDescriptors: config.columns,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data,
    });
  }, [config.columns]);

  return (
    <Table config={config} dataSource={dataSource} height={625} width={1000} />
  );
};
SimpleTable.displaySequence = displaySequence++;

export const TableScrollingAPI = () => {
  const [rowInputValue, setRowInputValue] = useState("");
  const [scrollPosition, setScrollPosition] = useState("");
  const scrollingAPI = useRef<ScrollingAPI>(noScrolling);

  const handleChangeRowInput = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setRowInputValue(value);
  }, []);
  const handleChangeScrollPosition = useCallback<
    ChangeEventHandler<HTMLInputElement>
  >((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setScrollPosition(value);
  }, []);

  const handleScrollToIndex = useCallback(() => {
    const rowIndex = parseInt(rowInputValue);
    if (!isNaN(rowIndex)) {
      scrollingAPI.current.scrollToIndex(rowIndex);
    }
  }, [rowInputValue]);

  const handleScrollToPosition = useCallback(() => {
    const rowIndex = parseInt(rowInputValue);
    if (!isNaN(rowIndex)) {
      scrollingAPI.current.scrollToIndex(rowIndex);
    }
  }, [rowInputValue]);

  const config = useMemo<TableConfig>(
    () => ({
      columns: columnGenerator(5),
      zebraStripes: true,
    }),
    []
  );

  const dataSource = useMemo<DataSource>(() => {
    const data = new ArrayProxy(
      1_000_000_000,
      rowGenerator(config.columns.map((col) => col.name))
    );
    return new ArrayDataSource({
      columnDescriptors: config.columns,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      data,
    });
  }, [config.columns]);

  return (
    <>
      <Table
        config={config}
        dataSource={dataSource}
        height={625}
        scrollingApiRef={scrollingAPI}
        width={1000}
      />
      <Toolbar height={36} style={{ marginTop: 50 }}>
        <Input value={rowInputValue} onChange={handleChangeRowInput} />
        <Button onClick={handleScrollToIndex}>Scroll To Row at Index</Button>
        <Input value={scrollPosition} onChange={handleChangeScrollPosition} />
        <Button onClick={handleScrollToPosition}>Scroll To Position</Button>
      </Toolbar>
    </>
  );
};
TableScrollingAPI.displaySequence = displaySequence++;
