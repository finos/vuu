import { ArrayDataSource } from "@finos/vuu-data-local";
import { ArrayProxy } from "@finos/vuu-data-test";
import { DataSource } from "@finos/vuu-data-types";
import { noScrolling, ScrollingAPI, Table } from "@finos/vuu-table";
import { TableConfig } from "@finos/vuu-table-types";
import { Toolbar } from "@finos/vuu-ui-controls";
import { Button, Input } from "@salt-ds/core";
import {
  ChangeEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { columnGenerator, rowGenerator } from "./SimpleTableDataGenerator";

let displaySequence = 1;

export const SimpleTable = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: columnGenerator(5),
      rowSeparators: true,
      zebraStripes: true,
    }),
    []
  );

  const dataSource = useMemo<DataSource>(() => {
    const data = new ArrayProxy(
      10_000_000_000,
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
