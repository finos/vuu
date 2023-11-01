import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Flexbox, useLayoutProviderDispatch } from "@finos/vuu-layout";
import { SetPropsAction } from "@finos/vuu-layout/src/layout-reducer";
import { TableNext } from "@finos/vuu-table";
import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { RowProps } from "@finos/vuu-table";
import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import { useTableConfig } from "../utils";
import {
  DivElementKeyedWithTranslate,
  DivElementWithTranslate,
  VuuTable,
} from "./html-table-components";

let displaySequence = 1;

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
TableNextAutoSize.displaySequence = displaySequence++;

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

  const handleChangeSize = (evt: SyntheticEvent<HTMLButtonElement>) => {
    const { value } = evt.target as HTMLButtonElement;
    setSelectedIndex(parseInt(value));
  };

  const handleChangeBorder = (evt: SyntheticEvent<HTMLButtonElement>) => {
    const { value } = evt.target as HTMLButtonElement;
    setSelectedIndex(parseInt(value));
  };

  const { height, width } = tableSize[selectedIndex];
  return (
    <>
      <ToggleButtonGroup onChange={handleChangeSize} value={selectedIndex}>
        <ToggleButton value={0}>715 X 645</ToggleButton>
        <ToggleButton value={1}>915 x 645</ToggleButton>
        <ToggleButton value={2}>715 x 745</ToggleButton>
        <ToggleButton value={3}>915 x 745</ToggleButton>
      </ToggleButtonGroup>

      <ToggleButtonGroup onChange={handleChangeBorder} value={selectedIndex}>
        <ToggleButton value={0}>No border</ToggleButton>
        <ToggleButton value={1}>1px 4 sides</ToggleButton>
        <ToggleButton value={2}>10px 4 sides</ToggleButton>
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
ResizeTableNext.displaySequence = displaySequence++;

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

export const DefaultVuuTable = () => {
  const {
    typeaheadHook: _,
    config,
    ...props
  } = useTableConfig({
    count: 1000,
    lazyData: false,
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const handleConfigChange = useCallback((...args) => {
    console.log(`config change`, {
      args,
    });
  }, []);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        width: "100vw",
        height: "100vh",
      }}
    >
      <VuuTable
        {...props}
        config={{
          ...config,
        }}
        height={645}
        renderBufferSize={0}
        onConfigChange={handleConfigChange}
        width={750}
      />
    </div>
  );
};
DefaultVuuTable.displaySequence = displaySequence++;

export const AutoVuuTable = () => {
  const dispatchLayoutAction = useLayoutProviderDispatch();
  const {
    typeaheadHook: _,
    config,
    ...props
  } = useTableConfig({
    count: 1000,
    rangeChangeRowset: "full",
    table: { module: "SIMUL", table: "instruments" },
  });

  const handleShowColumnSettings = useCallback(
    (column?: KeyedColumnDescriptor) => {
      // how do we get the path
      // dispatchLayoutAction({
      //   type: "set-prop",
      //   path: "#context-panel",
      //   propName: "expanded",
      //   propValue: true,
      // } as SetPropAction);
      dispatchLayoutAction({
        type: "set-props",
        path: "#context-panel",
        props: {
          expanded: true,
          context: "column-settings",
          column,
        },
      } as SetPropsAction);
    },
    [dispatchLayoutAction]
  );

  const handleConfigChange = useCallback((...args) => {
    console.log(`config change`, {
      args,
    });
  }, []);

  return (
    <VuuTable
      {...props}
      config={{
        ...config,
      }}
      renderBufferSize={0}
      onConfigChange={handleConfigChange}
      onShowConfigEditor={handleShowColumnSettings}
    />
  );
};
AutoVuuTable.displaySequence = displaySequence++;

export const VuuTableTwentyColumns = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 20,
    count: 1000,
    lazyData: false,
    rangeChangeRowset: "full",
  });

  return <VuuTable {...config} height={645} renderBufferSize={0} width={750} />;
};
VuuTableTwentyColumns.displaySequence = displaySequence++;

export const VuuTable2MillionRows = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    count: 2_000_000,
    rangeChangeRowset: "full",
  });

  return (
    <VuuTable {...config} height={440} renderBufferSize={0} width={700} />
    // </div>
  );
};
VuuTable2MillionRows.displaySequence = displaySequence++;
