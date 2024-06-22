let displaySequence = 1;
import {
  getTrackIndex,
  GridLayout,
  GridLayoutItem,
  LayoutAPI,
} from "@finos/vuu-layout";
import { queryClosest, registerComponent } from "@finos/vuu-utils";
import { MouseEventHandler, useCallback, useMemo, useRef } from "react";
import { DebugGridItem } from "./components/DebugGridItem";
import { GridPalette, GridPaletteItem } from "./components/GridPalette";

import "./GridLayout.examples.css";

registerComponent("DebugGridItem", DebugGridItem, "view");

export const TwoByTwoGrid = () => {
  // prettier-ignore

  const layoutApi = useRef<LayoutAPI>(null)
  const trackRef = useRef({ columnIndex: -1, rowIndex: -1 });

  const splitSelectedRow = useCallback(() => {
    const activeComponent = document.querySelector(".vuuGridLayoutItem-active");
    if (activeComponent && layoutApi.current) {
      layoutApi.current.splitGridRow(activeComponent.id);
    }
  }, []);

  const splitSelectedCol = useCallback(() => {
    const activeComponent = document.querySelector(".vuuGridLayoutItem-active");
    if (activeComponent && layoutApi.current) {
      layoutApi.current.splitGridCol(activeComponent.id);
    }
  }, []);

  const addColumn = useCallback(() => {
    const activeComponent = document.querySelector(".vuuGridLayoutItem-active");
    if (activeComponent && layoutApi.current) {
      layoutApi.current.addGridColumn(activeComponent.id);
    }
  }, []);

  const addRow = useCallback(() => {
    const activeComponent = document.querySelector(".vuuGridLayoutItem-active");
    if (activeComponent && layoutApi.current) {
      layoutApi.current.addGridRow(activeComponent.id);
    }
  }, []);

  const removeColumn = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    const {
      current: { columnIndex },
    } = trackRef;
    layoutApi.current?.removeGridColumn(columnIndex);
  }, []);

  const onClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    ({ target, clientX, clientY }) => {
      const grid = queryClosest(target, ".vuuGridLayout");
      if (grid) {
        trackRef.current = getTrackIndex(grid, clientX, clientY);
      }
    },
    []
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
      }}
    >
      <div style={{ flex: "0 0 40px" }}>
        <button onClick={splitSelectedRow}>Split across the middle</button>
        <button onClick={splitSelectedCol}>Split down the middle</button>
        <button onClick={addRow}>Add a Row</button>
        <button onClick={addColumn}>Add a Column</button>
        <button onClick={removeColumn}>Remove Column</button>
        <div id="dragImage" style={{ position: "absolute", left: 0 }}></div>
      </div>
      <GridLayout
        colCount={2}
        id="GridLayoutA"
        onClick={onClick}
        rowCount={2}
        layoutAPI={layoutApi}
      >
        <GridLayoutItem
          header
          id="green"
          resizeable="hv"
          style={{
            gridColumnStart: 1,
            gridColumnEnd: 2,
            gridRowStart: 1,
            gridRowEnd: 2,
          }}
          title="Green"
        >
          <DebugGridItem
            debugLabel="Green"
            style={{
              background: "green",
            }}
          />
        </GridLayoutItem>
        <GridLayoutItem
          header
          id="blue"
          resizeable="hv"
          style={{
            gridColumnStart: 2,
            gridColumnEnd: 3,
            gridRowStart: 1,
            gridRowEnd: 2,
          }}
          title="Blue"
        >
          <DebugGridItem debugLabel="Blue" style={{ background: "blue" }} />
        </GridLayoutItem>
        <GridLayoutItem
          header
          id="yellow"
          resizeable="hv"
          style={{
            gridColumnStart: 1,
            gridColumnEnd: 2,
            gridRowStart: 2,
            gridRowEnd: 3,
          }}
          title="Yellow"
        >
          <DebugGridItem debugLabel="Yellow" style={{ background: "yellow" }} />
        </GridLayoutItem>
        <GridLayoutItem
          header
          id="red"
          resizeable="hv"
          style={{
            gridColumnStart: 2,
            gridColumnEnd: 3,
            gridRowStart: 2,
            gridRowEnd: 3,
          }}
          title="Red"
        >
          <DebugGridItem debugLabel="Red" style={{ background: "red" }} />
        </GridLayoutItem>
      </GridLayout>
    </div>
  );
};
TwoByTwoGrid.displaySequence = displaySequence++;

export const TwoByTwoEmptyCell = () => {
  return (
    <GridLayout colCount={2} id="GridLayoutB" rowCount={2}>
      <GridLayoutItem
        header
        id="blue"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Blue"
      >
        <DebugGridItem style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="black"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 2,
          gridRowEnd: 3,
        }}
        title="Black"
      >
        <div style={{ background: "black" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="red"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 2,
          gridRowEnd: 3,
        }}
        title="Red"
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
TwoByTwoEmptyCell.displaySequence = displaySequence++;

export const TwoByTwoColumnTwoDoubleRowspan = () => {
  return (
    <GridLayout colCount={2} id="GridLayoutB" rowCount={2}>
      <GridLayoutItem
        id="green-H"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
      >
        <div
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        id="blue-H"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 1,
          gridRowEnd: 3,
        }}
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red-H"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 2,
          gridRowEnd: 3,
        }}
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
TwoByTwoColumnTwoDoubleRowspan.displaySequence = displaySequence++;

export const TwoByTwoColumnOneDoubleRowspan = () => {
  return (
    <GridLayout colCount={2} id="GridLayoutB" rowCount={2}>
      <GridLayoutItem
        id="green-H"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 1,
          gridRowEnd: 3,
        }}
      >
        <div
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        id="blue-H"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red-H"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 2,
          gridRowEnd: 3,
        }}
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
TwoByTwoColumnOneDoubleRowspan.displaySequence = displaySequence++;

export const SkewedTowerDeepTopRight = () => {
  return (
    <GridLayout colCount={2} id="GridLayoutD" rowCount={3}>
      <GridLayoutItem
        id="green-H"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
      >
        <div
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        id="blue-H"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 1,
          gridRowEnd: 3,
        }}
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="black-H"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 2,
          gridRowEnd: 4,
        }}
      >
        <div style={{ background: "black" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red-H"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 3,
          gridRowEnd: 4,
        }}
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
SkewedTowerDeepTopRight.displaySequence = displaySequence++;

export const SkewedTowerDeepTopLeft = () => {
  return (
    <GridLayout colCount={2} id="GridLayoutE" rowCount={3}>
      <GridLayoutItem
        id="green-H"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 1,
          gridRowEnd: 3,
        }}
      >
        <div
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        id="blue-H"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="black-H"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 3,
          gridRowEnd: 4,
        }}
      >
        <div style={{ background: "black" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red-H"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 2,
          gridRowEnd: 4,
        }}
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
SkewedTowerDeepTopLeft.displaySequence = displaySequence++;

export const SkewedTerracesWideTopLeft = () => {
  return (
    <GridLayout colCount={3} id="GridLayoutE" rowCount={2}>
      <GridLayoutItem
        id="green"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 3,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
      >
        <DebugGridItem
          debugLabel="Green"
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        id="blue"
        resizeable="hv"
        style={{
          gridColumnStart: 3,
          gridColumnEnd: 4,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
      >
        <DebugGridItem
          debugLabel="Blue"
          style={{
            background: "blue",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        id="black"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 2,
          gridRowEnd: 3,
        }}
      >
        <DebugGridItem
          debugLabel="Yellow"
          style={{
            background: "yellow",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        id="red"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 4,
          gridRowStart: 2,
          gridRowEnd: 3,
        }}
      >
        <DebugGridItem
          debugLabel="Red"
          style={{
            background: "red",
          }}
        />
      </GridLayoutItem>
    </GridLayout>
  );
};
SkewedTerracesWideTopLeft.displaySequence = displaySequence++;

export const GridLayoutG = () => {
  return (
    <GridLayout colCount={3} id="GridLayoutE" rowCount={3}>
      <GridLayoutItem
        id="green-H"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Green"
      >
        <div
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        id="blue-H"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 4,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Blue"
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="black-H"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 3,
          gridRowStart: 2,
          gridRowEnd: 3,
        }}
        title="Black"
      >
        <div style={{ background: "black" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red-H"
        resizeable="hv"
        style={{
          gridColumnStart: 3,
          gridColumnEnd: 4,
          gridRowStart: 2,
          gridRowEnd: 3,
        }}
        title="Red"
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
GridLayoutG.displaySequence = displaySequence++;

export const GridLayoutH = () => {
  return (
    <GridLayout
      colCount={2}
      id="GridLayoutE"
      rowCount={3}
      style={{
        gridTemplateRows: "1fr 32px 1fr",
      }}
    >
      <GridLayoutItem
        header
        id="green"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Green"
      >
        <div
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="blue"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 4,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Blue"
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>

      <GridLayoutItem
        id="tabs"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 4,
          gridRowStart: 2,
          gridRowEnd: 3,
        }}
      >
        <div style={{ background: "brown", bottom: 0 }} />
      </GridLayoutItem>

      <GridLayoutItem
        id="black"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 4,
          gridRowStart: 3,
          gridRowEnd: 4,
        }}
        title="Black"
      >
        <div style={{ background: "black", top: 0 }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 4,
          gridRowStart: 3,
          gridRowEnd: 4,
        }}
        title="Red"
      >
        <div style={{ background: "red", top: 0 }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
GridLayoutH.displaySequence = displaySequence++;

export const FourCellTerrace = () => {
  return (
    <GridLayout colCount={4} id="GridLayoutE" rowCount={1}>
      <GridLayoutItem
        header
        id="green"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Green"
      >
        <DebugGridItem
          debugLabel="Green"
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="blue"
        resizeable="hv"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Blue"
      >
        <DebugGridItem
          debugLabel="Blue"
          style={{
            background: "blue",
          }}
        />
      </GridLayoutItem>

      <GridLayoutItem
        header
        id="yellow"
        resizeable="hv"
        style={{
          gridColumnStart: 3,
          gridColumnEnd: 4,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Yellow"
      >
        <DebugGridItem
          debugLabel="Yellow"
          style={{
            background: "yellow",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="red"
        resizeable="hv"
        style={{
          gridColumnStart: 4,
          gridColumnEnd: 5,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Red"
      >
        <DebugGridItem
          debugLabel="Red"
          style={{
            background: "red",
          }}
        />
      </GridLayoutItem>
    </GridLayout>
  );
};
FourCellTerrace.displaySequence = displaySequence++;

export const SingleRowFixedItemCenter = () => {
  return (
    <GridLayout colCount={4} id="GridLayoutE" rowCount={1}>
      <GridLayoutItem
        header
        id="green"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Green"
      >
        <div
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="blue"
        style={{
          gridColumnStart: 2,
          gridColumnEnd: 3,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Blue"
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>

      <GridLayoutItem
        header
        id="black"
        resizeable="hv"
        style={{
          gridColumnStart: 3,
          gridColumnEnd: 4,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Black"
      >
        <div style={{ background: "black" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="red"
        resizeable="hv"
        style={{
          gridColumnStart: 4,
          gridColumnEnd: 5,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Red"
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
SingleRowFixedItemCenter.displaySequence = displaySequence++;

export const SingleColumnFixedItemCenter = () => {
  return (
    <GridLayout
      colCount={1}
      id="GridLayoutE"
      rowCount={4}
      style={{
        gridTemplateRows: "1fr 1fr 1fr 1fr",
      }}
    >
      <GridLayoutItem
        header
        id="green"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 1,
          gridRowEnd: 2,
        }}
        title="Green"
      >
        <div
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="blue"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 2,
          gridRowEnd: 3,
        }}
        title="Blue"
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>

      <GridLayoutItem
        header
        id="black"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 3,
          gridRowEnd: 4,
        }}
        title="Black"
      >
        <div style={{ background: "black" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="red"
        resizeable="hv"
        style={{
          gridColumnStart: 1,
          gridColumnEnd: 2,
          gridRowStart: 4,
          gridRowEnd: 5,
        }}
        title="Red"
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
SingleColumnFixedItemCenter.displaySequence = displaySequence++;

export const EmptyGridLayout = () => {
  return <GridLayout colCount={2} id="GridLayoutE" rowCount={2}></GridLayout>;
};
EmptyGridLayout.displaySequence = displaySequence++;

export const EmptyWithPalette = () => {
  const paletteItems = useMemo<GridPaletteItem[]>(
    () => [
      {
        id: "red",
        label: "Red",
        type: "DebugGridItem",
        props: {
          debugLabel: "Red",
          style: {
            background: "red",
          },
        },
      },
      {
        id: "green",
        label: "Green",
        type: "DebugGridItem",
        props: {
          debugLabel: "Green",
          style: {
            background: "green",
          },
        },
      },
    ],
    []
  );
  return (
    <>
      <div id="dragImage" style={{ position: "absolute", left: 0 }}></div>

      <GridLayout
        cols={["200px", "1fr"]}
        colCount={2}
        id="GridLayoutE"
        rowCount={1}
        style={{ height: "calc(100vh - 30px)", marginTop: 30 }}
      >
        <GridLayoutItem
          id="palette"
          isDropTarget={false}
          resizeable="hv"
          style={{
            gridColumnStart: 1,
            gridColumnEnd: 2,
            gridRowStart: 1,
            gridRowEnd: 2,
          }}
        >
          <GridPalette paletteItems={paletteItems} />
        </GridLayoutItem>
      </GridLayout>
    </>
  );
};
EmptyWithPalette.displaySequence = displaySequence++;
