import { useTableConfig } from "../utils";
import {
  DivElementKeyedWithTranslate,
  DivElementKeyedWithTranslateInlineScrollbarsCssVariables,
  DivElementWithTranslate,
  TableNext,
} from "./html-table-components";

import { RowProps } from "@finos/vuu-table/src/TableRow";
import { useMemo, useState } from "react";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
} from "@heswell/salt-lab";
import { Flexbox } from "@finos/vuu-layout";

let displaySequence = 1;

const bufferCount = 5;
const rowHeight = 30;
const headerHeight = 30;
const viewportHeight = 700;
const visibleRowCount = 20;

export type ComponentTypeNoChildren<T = unknown> = (props: T) => JSX.Element;
export type RowType = ComponentTypeNoChildren<RowProps>;

export const DefaultDivElementWithTranslate = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
    rangeChangeRowset: "full",
  });

  return (
    <DivElementWithTranslate
      {...config}
      headerHeight={30}
      height={645}
      renderBufferSize={0}
      rowHeight={30}
      width={715}
    />
  );
};
DefaultDivElementWithTranslate.displaySequence = displaySequence++;

export const DefaultDivElementKeyedWithTranslate = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
    rangeChangeRowset: "full",
  });

  return (
    <DivElementKeyedWithTranslate
      {...config}
      headerHeight={30}
      height={645}
      renderBufferSize={0}
      rowHeight={30}
      width={715}
    />
  );
};
DefaultDivElementKeyedWithTranslate.displaySequence = displaySequence++;

export const DefaultDivElementKeyedWithTranslateInlineScrollbarsCssVariables =
  () => {
    const { typeaheadHook: _, ...config } = useTableConfig({
      columnCount: 10,
      count: 1000,
      rangeChangeRowset: "full",
    });

    return (
      <DivElementKeyedWithTranslateInlineScrollbarsCssVariables
        {...config}
        headerHeight={30}
        height={645}
        renderBufferSize={0}
        rowHeight={30}
        width={715}
      />
    );
  };
DefaultDivElementKeyedWithTranslateInlineScrollbarsCssVariables.displaySequence =
  displaySequence++;

export const DefaultTableNext = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
    rangeChangeRowset: "full",
  });

  return (
    <TableNext
      {...config}
      headerHeight={30}
      height={645}
      renderBufferSize={0}
      rowHeight={30}
      width={715}
    />
  );
};
DefaultTableNext.displaySequence = displaySequence++;

export const TableNextAutoSize = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
    rangeChangeRowset: "full",
  });

  return (
    <div style={{ height: 800, width: 900, background: "#ccc" }}>
      <TableNext
        {...config}
        headerHeight={30}
        renderBufferSize={0}
        rowHeight={30}
      />
    </div>
  );
};
DefaultTableNext.displaySequence = displaySequence++;

export const TableNextStaticBorders = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
    rangeChangeRowset: "full",
  });

  return (
    <TableNext
      {...config}
      headerHeight={30}
      height={600}
      renderBufferSize={0}
      rowHeight={30}
      style={{ border: "solid 10px #ccc" }}
      width={600}
    />
  );
};
TableNextStaticBorders.displaySequence = displaySequence++;

export const TableNextAutoBorders = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
    rangeChangeRowset: "full",
  });

  return (
    <div style={{ height: 600, width: 600, background: "#ccc" }}>
      <TableNext
        {...config}
        headerHeight={30}
        renderBufferSize={0}
        rowHeight={30}
        style={{ border: "solid 10px #ccc" }}
      />
    </div>
  );
};
TableNextAutoBorders.displaySequence = displaySequence++;

export const ResizeTableNext = () => {
  const tableSize = useMemo(
    () => [
      { height: 645, width: 715 },
      { height: 645, width: 915 },
      { height: 745, width: 715 },
      { height: 745, width: 915 },
      { height: undefined, width: undefined },
    ],
    []
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
    rangeChangeRowset: "full",
  });

  const handleChangeSize: ToggleButtonGroupChangeEventHandler = (
    _event,
    index
  ) => {
    setSelectedIndex(index);
  };

  const handleChangeBorder: ToggleButtonGroupChangeEventHandler = (
    _event,
    index
  ) => {
    setSelectedIndex(index);
  };

  const { height, width } = tableSize[selectedIndex];
  return (
    <>
      <ToggleButtonGroup
        onChange={handleChangeSize}
        selectedIndex={selectedIndex}
      >
        <ToggleButton>715 X 645</ToggleButton>
        <ToggleButton>915 x 645</ToggleButton>
        <ToggleButton>715 x 745</ToggleButton>
        <ToggleButton>915 x 745</ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup
        onChange={handleChangeBorder}
        selectedIndex={selectedIndex}
      >
        <ToggleButton>No border</ToggleButton>
        <ToggleButton>1px 4 sides</ToggleButton>
        <ToggleButton>10px 4 sides</ToggleButton>
      </ToggleButtonGroup>

      <div style={{ height: 800, width: "100%", background: "#ccc" }}>
        <TableNext
          {...config}
          headerHeight={30}
          height={height}
          renderBufferSize={0}
          rowHeight={30}
          width={width}
        />
      </div>
    </>
  );
};
DefaultTableNext.displaySequence = displaySequence++;

export const TableNextResizeable = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
    rangeChangeRowset: "full",
  });

  return (
    <div
      style={{
        height: 802,
        width: 902,
        background: "#ccc",
        border: "solid 1px brown",
        margin: 10,
      }}
    >
      <Flexbox style={{ height: "100%", width: "100%" }}>
        <div data-resizeable style={{ background: "white", flex: "1 1 0px" }} />
        <Flexbox style={{ flexDirection: "column", flex: "1 1 0px" }}>
          <div
            data-resizeable
            style={{ background: "white", flex: "1 1 0px" }}
          />
          <div data-resizable style={{ flex: "1 1 0px" }}>
            <TableNext
              {...config}
              data-resizeable
              headerHeight={30}
              renderBufferSize={0}
              rowHeight={30}
            />
          </div>
        </Flexbox>
      </Flexbox>
    </div>
  );
};
TableNextResizeable.displaySequence = displaySequence++;

export const TableNext2MillionRows = () => {
  // const { typeaheadHook: _, ...config } = useTableConfig({ count: 2_000_000 });
  const { typeaheadHook: _, ...config } = useTableConfig({
    count: 100_000,
    rangeChangeRowset: "full",
  });

  // const { typeaheadHook: _, ...config } = useTableConfig({
  //   columnCount: 10,
  //   count: 1000,
  //   rangeChangeRowset: "full",
  // });

  return (
    // <div style={{ height: 600, width: 600, background: "#ccc" }}>
    <TableNext
      {...config}
      headerHeight={30}
      height={600}
      renderBufferSize={0}
      rowHeight={30}
      width={600}
    />
    // </div>
  );
};
TableNext2MillionRows.displaySequence = displaySequence++;
