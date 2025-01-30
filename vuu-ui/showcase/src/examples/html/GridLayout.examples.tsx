import {
  GridLayout,
  GridLayoutChangeHandler,
  GridLayoutItem,
  GridLayoutProvider,
  TrackSize,
} from "@finos/vuu-layout";
import { queryClosest } from "@finos/vuu-utils";
import {
  CSSProperties,
  HTMLAttributes,
  MouseEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { DebugGridItem } from "./components/DebugGridItem";
import { GridPalette, GridPaletteItem } from "./components/GridPalette";

import "./GridLayout.examples.css";
import { Button } from "@salt-ds/core";
import {
  useGridLayoutDispatch,
  useGridModel,
} from "@finos/vuu-layout/src/grid-layout/GridLayoutContext";

export const SingleItemFillsGrid = () => {
  return (
    <GridLayout
      layout={{
        cols: ["1fr"],
        rows: ["1fr"],
      }}
      full-page
      id="GridLayoutB"
    >
      <GridLayoutItem
        header
        id="blue"
        resizeable="hv"
        style={{
          gridArea: "1/1/2/2",
        }}
        title="Blue"
      >
        <DebugGridItem style={{ background: "blue" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const SingleStackedItemFillsGrid = () => {
  return (
    <GridLayout
      layout={{ cols: ["1fr"], rows: ["1fr"] }}
      full-page
      id="GridLayout1"
    >
      <GridLayoutItem
        data-drop-target
        header
        id="brown"
        key="brown"
        resizeable="hv"
        style={{
          gridArea: "1/1/2/2",
        }}
        stackId="tabs-1"
        title="Brown"
      >
        <DebugGridItem style={{ background: "brown" }} />
      </GridLayoutItem>
      <GridLayoutItem
        data-drop-target
        header
        id="navy"
        key="navy"
        resizeable="hv"
        style={{
          gridArea: "1/1/2/2",
        }}
        stackId="tabs-1"
        title="Navy"
      >
        <DebugGridItem style={{ background: "navy" }} />
      </GridLayoutItem>
      <GridLayoutItem
        data-drop-target
        header
        id="red"
        key="red"
        resizeable="hv"
        style={{
          gridArea: "1/1/2/2",
        }}
        stackId="tabs-1"
        title="Red"
      >
        <DebugGridItem style={{ background: "red" }} />
      </GridLayoutItem>
      <GridLayoutItem
        data-drop-target
        header
        id="yellow"
        key="yellow"
        resizeable="hv"
        style={{
          gridArea: "1/1/2/2",
        }}
        stackId="tabs-1"
        title="Yellow"
      >
        <DebugGridItem style={{ background: "yellow" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
// prettier-ignore
export const TowerOfTwoStackedItems = () => {
  return (
    <GridLayout
      layout={{ cols: ["1fr"], rows: ["1fr", "1fr"] }}
      full-page
      id="GridLayoutB"
    >
      <GridLayoutItem
        header id="brown" key="brown" resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
        stackId="tabs-1" title="Brown"
      >
        <DebugGridItem style={{ background: "brown" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header id="navy" key="navy" resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
        stackId="tabs-1" title="Navy"
      >
        <DebugGridItem style={{ background: "navy" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header id="red" key="red" resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
        stackId="tabs-1" title="Red"
      >
        <DebugGridItem style={{ background: "red" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header id="yellow" key="yellow" resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
        stackId="tabs-1" title="Yellow"
      >
        <DebugGridItem style={{ background: "yellow" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header id="green" key="green" resizeable="hv"
        style={{ gridArea: "2/1/3/2" }}
        stackId="tabs-2" title="Green"
      >
        <DebugGridItem style={{ background: "green" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="pink"
        key="pink"
        resizeable="hv"
        style={{
          gridArea: "2/1/3/2",
        }}
        stackId="tabs-2"
        title="Pink"
      >
        <DebugGridItem style={{ background: "pink" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header id="ivory" key="ivory" resizeable="hv"
        style={{ gridArea: "2/1/3/2" }}
        stackId="tabs-2" title="Ivory"
      >
        <DebugGridItem style={{ background: "ivory" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="rebeccapurple"
        key="rebeccapurple"
        resizeable="hv"
        style={{
          gridArea: "2/1/3/2",
        }}
        stackId="tabs-2"
        title="Rebecca Purple"
      >
        <DebugGridItem style={{ background: "rebeccapurple" }} />
      </GridLayoutItem>

    </GridLayout>
  );
};

export const TwoByTwoGrid = () => {
  // prettier-ignore

  const trackRef = useRef({ columnIndex: -1, rowIndex: -1 });

  const getTrackIndex = (grid: HTMLElement, x: number, y: number) => {
    const { left, top } = grid.getBoundingClientRect();
    const columns = getComputedStyle(grid)
      .getPropertyValue("grid-template-columns")
      .split(" ")
      .map((value) => parseInt(value, 10));
    const rows = getComputedStyle(grid)
      .getPropertyValue("grid-template-rows")
      .split(" ")
      .map((value) => parseInt(value, 10));

    let columnIndex = 0;
    let rowIndex = 0;

    let posLeft = left;
    let posTop = top;

    for (let i = 0; i < columns.length; i++) {
      posLeft += columns[i];
      if (posLeft > x) {
        columnIndex = i;
        break;
      }
    }

    for (let i = 0; i < rows.length; i++) {
      posTop += rows[i];
      if (posTop > y) {
        rowIndex = i;
        break;
      }
    }

    return { columnIndex, rowIndex };
  };

  const onClick = useCallback<MouseEventHandler<HTMLDivElement>>(
    ({ target, clientX, clientY }) => {
      const grid = queryClosest(target, ".vuuGridLayout");
      if (grid) {
        trackRef.current = getTrackIndex(grid, clientX, clientY);
      }
    },
    [],
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
        <div id="dragImage" style={{ position: "absolute", left: 0 }}></div>
      </div>
      <GridLayout
        full-page
        id="GridLayoutA"
        layout={{
          cols: ["1fr", "1fr"],
          rows: ["1fr", "1fr"],
        }}
        onClick={onClick}
      >
        <GridLayoutItem
          data-drop-target
          header
          id="green"
          key="green"
          resizeable="hv"
          style={{
            gridArea: "1/1/2/2",
          }}
          title="Green"
        >
          <DebugGridItem
            style={{
              background: "green",
            }}
          />
        </GridLayoutItem>
        <GridLayoutItem
          data-drop-target
          header
          id="blue"
          key="blue"
          resizeable="hv"
          style={{
            gridArea: "1/2/2/3",
          }}
          title="Blue"
        >
          <DebugGridItem style={{ background: "blue" }} />
        </GridLayoutItem>
        <GridLayoutItem
          data-drop-target
          header
          id="yellow"
          key="yellow"
          resizeable="hv"
          style={{
            gridArea: "2/1/3/2",
          }}
          title="Yellow"
        >
          <DebugGridItem style={{ background: "yellow" }} />
        </GridLayoutItem>
        <GridLayoutItem
          data-drop-target
          header
          id="red"
          key="red"
          resizeable="hv"
          style={{
            gridArea: "2/2/3/3",
          }}
          title="Red"
        >
          <DebugGridItem style={{ background: "red" }} />
        </GridLayoutItem>
      </GridLayout>
    </div>
  );
};

export const TwoByTwoEmptyCell = () => {
  return (
    <GridLayout
      layout={{
        cols: ["1fr", "1fr"],
        rows: ["1fr", "1fr"],
      }}
      full-page
      id="GridLayoutB"
    >
      <GridLayoutItem
        header
        id="blue"
        resizeable="hv"
        style={{
          gridArea: "1/2/2/3",
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
          gridArea: "2/1/3/2",
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
          gridArea: "2/2/3/3",
        }}
        title="Red"
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const TwoByTwoDoubleRowspanInColumnTwo = () => {
  return (
    <GridLayout
      layout={{
        cols: ["1fr", "1fr"],
        rows: ["1fr", "1fr"],
      }}
      full-page
      id="GridLayoutB"
    >
      <GridLayoutItem
        header
        id="green-H"
        resizeable="hv"
        style={{
          gridArea: "1/2/2/2",
        }}
      >
        <div
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="blue-H"
        resizeable="hv"
        style={{
          gridArea: "1/2/3/3",
        }}
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="red-H"
        resizeable="hv"
        style={{
          gridArea: "2/1/3/2",
        }}
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const TwoByTwoColumnOneDoubleRowspan = () => {
  return (
    <GridLayout
      full-page
      id="GridLayoutB"
      layout={{
        cols: ["1fr", "1fr"],
        rows: ["1fr", "1fr"],
      }}
    >
      <GridLayoutItem
        id="green-H"
        resizeable="hv"
        style={{
          gridArea: "1/1/3/2",
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
          gridArea: "1/2/2/3",
        }}
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red-H"
        resizeable="hv"
        style={{
          gridArea: "2/2/3/3",
        }}
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const SkewedTowerDeepTopRight = () => {
  return (
    <GridLayout
      full-page
      id="GridLayoutD"
      layout={{
        cols: ["1fr", "1fr"],
        rows: ["1fr", "1fr", "1fr"],
      }}
    >
      <GridLayoutItem
        header
        id="green"
        key="green"
        resizeable="hv"
        style={{
          gridArea: "1/1/2/2",
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
        id="blue"
        key="blue"
        resizeable="hv"
        style={{
          gridArea: "1/2/3/3",
        }}
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="yellow"
        key="yellow"
        resizeable="hv"
        style={{
          gridArea: "2/1/4/2",
        }}
      >
        <div style={{ background: "yellow" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red"
        key="red"
        resizeable="hv"
        style={{
          gridArea: "3/2/4/3",
        }}
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const SkewedTowerDeepTopLeft = () => {
  return (
    <GridLayout
      layout={{
        cols: ["1fr", "1fr"],
        rows: ["1fr", "1fr", "1fr"],
      }}
      full-page
      id="GridLayoutE"
    >
      <GridLayoutItem
        id="green-H"
        resizeable="hv"
        style={{ gridArea: "1/1/3/2" }}
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
        style={{ gridArea: "1/2/2/3" }}
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="black-H"
        resizeable="hv"
        style={{ gridArea: "3/1/4/1" }}
      >
        <div style={{ background: "black" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red-H"
        resizeable="hv"
        style={{ gridArea: "2/2/4/3" }}
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const SkewedTerracesWideTopLeft = () => {
  return (
    <GridLayout
      full-page
      id="GridLayoutE"
      layout={{
        cols: ["1fr", "1fr", "1fr"],
        rows: ["1fr", "1fr"],
      }}
    >
      <GridLayoutItem
        id="green"
        key={"green"}
        resizeable="hv"
        style={{ gridArea: "1/1/2/3" }}
      >
        <DebugGridItem
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        id="blue"
        key="blue"
        resizeable="hv"
        style={{ gridArea: "1/3/2/4" }}
      >
        <DebugGridItem
          style={{
            background: "blue",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="yellow"
        key="yellow"
        resizeable="hv"
        style={{ gridArea: "2/1/3/2" }}
      >
        <DebugGridItem
          style={{
            background: "yellow",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        id="red"
        key="red"
        resizeable="hv"
        style={{ gridArea: "2/2/3/4" }}
      >
        <DebugGridItem
          style={{
            background: "red",
          }}
        />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const GridLayoutG = () => {
  return (
    <GridLayout
      full-page
      id="GridLayoutE"
      layout={{
        cols: ["1fr", "1fr", "1fr"],
        rows: ["1fr", "1fr"],
      }}
    >
      <GridLayoutItem
        id="green-H"
        resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
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
        style={{ gridArea: "1/2/2/4" }}
        title="Blue"
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="black-H"
        resizeable="hv"
        style={{ gridArea: "2/1/3/3" }}
        title="Black"
      >
        <div style={{ background: "black" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red-H"
        resizeable="hv"
        style={{ gridArea: "2/3/3/4" }}
        title="Red"
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const GridLayoutH = () => {
  return (
    <GridLayout
      full-page
      id="GridLayoutE"
      layout={{
        cols: ["1fr", "1fr"],
        rows: ["1fr", "32px", "1fr"],
      }}
    >
      <GridLayoutItem
        header
        id="green"
        resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
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
        style={{ gridArea: "1/2/2/4" }}
        title="Blue"
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>
      {/* should also be able to work out fixed height by lack of resizeable */}
      <GridLayoutItem height={32} id="tabs" style={{ gridArea: "2/1/3/4" }}>
        <div style={{ background: "brown", bottom: 0 }} />
      </GridLayoutItem>

      <GridLayoutItem
        id="black"
        resizeable="hv"
        style={{ gridArea: "4/1/4/4" }}
        title="Black"
      >
        <div style={{ background: "black", top: 0 }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="red"
        resizeable="hv"
        style={{ gridArea: "3/1/4/4" }}
        title="Red"
      >
        <div style={{ background: "red", top: 0 }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const FourCellTerrace = () => {
  return (
    <GridLayout
      full-page
      id="GridLayoutE"
      layout={{
        cols: ["1fr", "1fr", "1fr", "1fr"],
        rows: ["1fr"],
      }}
    >
      <GridLayoutItem
        header
        id="green"
        resizeable="hv"
        style={{ gridArea: "1/1/2/2" }}
        title="Green"
      >
        <DebugGridItem
          style={{
            background: "green",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="blue"
        resizeable="hv"
        style={{ gridArea: "1/2/2/3" }}
        title="Blue"
      >
        <DebugGridItem
          style={{
            background: "blue",
          }}
        />
      </GridLayoutItem>

      <GridLayoutItem
        header
        id="yellow"
        resizeable="hv"
        style={{ gridArea: "1/3/2/4" }}
        title="Yellow"
      >
        <DebugGridItem
          style={{
            background: "yellow",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="red"
        resizeable="hv"
        style={{ gridArea: "1/4/2/5" }}
        title="Red"
      >
        <DebugGridItem
          style={{
            background: "red",
          }}
        />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const FixedAppHeaderSimpleContent = () => {
  return (
    <GridLayout
      layout={{
        cols: ["1fr"],
        rows: ["80px", "1fr"],
      }}
      full-page
      id="GridLayoutB"
    >
      <GridLayoutItem height={80} id="gray" style={{ gridArea: "1/1/2/2" }}>
        <DebugGridItem style={{ background: "gray" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="blue"
        resizeable="hv"
        style={{
          gridArea: "2/1/3/2",
        }}
        title="Blue"
      >
        <DebugGridItem style={{ background: "blue" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
export const FixedAppHeaderThreeColumnContent = () => {
  return (
    // prettier-ignore
    <GridLayout id="GridLayoutB" full-page
      layout={{ cols: ["200px", "1fr", "200px"], rows: ["48px", "40px", "1fr"] }}
    >
      <GridLayoutItem id="gray" style={{ gridArea: "1/1/2/4" }}>
        <DebugGridItem style={{ background: "gray" }} />
      </GridLayoutItem>
      <GridLayoutItem id="blue" resizeable="h" title="Blue" style={{ gridArea: "2/1/4/2" }} >
        <DebugGridItem style={{ background: "blue" }} />
      </GridLayoutItem>
      <GridLayoutItem id="brown" resizeable="h" style={{ gridArea: "2/2/3/3" }} >
        <DebugGridItem style={{ background: "brown" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="red"
        resizeable="hv"
        title="Red"
        style={{ gridArea: "3/2/4/3" }}
      >
        <DebugGridItem style={{ background: "red" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="yellow"
        resizeable="h"
        title="Yellow"
        style={{ gridArea: "2/3/4/4" }}
      >
        <DebugGridItem style={{ background: "yellow" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

const closeButtonStyleLeft: CSSProperties = {
  bottom: 6,
  position: "absolute",
  left: 6,
};
const closeButtonStyleRight: CSSProperties = {
  bottom: 6,
  position: "absolute",
  right: 6,
};

const flip = (size: string) => (size === "0px" ? "200px" : "0px");

export const FixedAppHeaderCollapsibleSidebars = () => {
  const [cols, setCols] = useState<TrackSize[]>(["200px", "1fr", "200px"]);
  const [rows] = useState<TrackSize[]>(["48px", "40px", "1fr"]);
  const toggleLeftSidebar = () => {
    setCols(([col1, col2, col3]) => [flip(col1), col2, col3]);
  };
  const closeLeftSidebar = () => {
    setCols(([, col2, col3]) => ["0px", col2, col3]);
  };
  const toggleRightSidebar = () => {
    setCols(([col1, col2, col3]) => [col1, col2, flip(col3)]);
  };
  const closeRightSidebar = () => {
    setCols(([col1, col2]) => [col1, col2, "0px"]);
  };
  return (
    // prettier-ignore
    <GridLayout id="GridLayoutB" full-page
      layout={{ cols, rows }}
    >
      <GridLayoutItem id="gray" style={{ gridArea: "1/1/2/4" }}>
        <DebugGridItem style={{ alignItems: "center",background: "gray",display: "flex", gap: 9,justifyContent: "center"  }} >
        <Button onClick={toggleLeftSidebar} >Toggle Left</Button>
        <Button onClick={toggleRightSidebar}>Toggle Right </Button>

          </DebugGridItem>
      </GridLayoutItem>
      <GridLayoutItem id="blue" resizeable="h" title="Blue" style={{ gridArea: "2/1/4/2" }} >
        <DebugGridItem style={{ background: "blue" }}>
          <Button onClick={closeLeftSidebar} style={closeButtonStyleLeft}>Close</Button>
          </DebugGridItem>
      </GridLayoutItem>
      <GridLayoutItem id="brown" resizeable="h" style={{ gridArea: "2/2/3/3" }} >
        <DebugGridItem style={{ background: "brown" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="red"
        resizeable="hv"
        title="Red"
        style={{ gridArea: "3/2/4/3" }}
      >
        <DebugGridItem style={{ background: "red" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="yellow"
        resizeable="h"
        title="Yellow"
        style={{ gridArea: "2/3/4/4" }}
      >
        <DebugGridItem style={{ background: "yellow" }} >
          <Button onClick={closeRightSidebar} style={closeButtonStyleRight}>Close</Button>
        </DebugGridItem>

      </GridLayoutItem>
    </GridLayout>
  );
};

const CustomHeader = ({
  children,
  ...htmlAttributes
}: HTMLAttributes<HTMLDivElement>) => {
  const dispatch = useGridLayoutDispatch();
  const gridModel = useGridModel();
  const toggleLeftSidebar = () => {
    const currentValue = gridModel.tracks.columns.at(0);
    const value: TrackSize = currentValue === 0 ? "200px" : 0;
    dispatch({ type: "resize-grid-column", trackIndex: 0, value });
  };
  const toggleRightSidebar = () => {
    const currentValue = gridModel.tracks.columns.at(2);
    const value: TrackSize = currentValue === 0 ? "200px" : 0;
    dispatch({ type: "resize-grid-column", trackIndex: 2, value });
  };
  return (
    <div
      className="CustomHeader"
      style={{
        alignItems: "center",
        display: "flex",
        gap: 9,
        background: "gray",
        justifyContent: "center",
      }}
      {...htmlAttributes}
    >
      <Button onClick={toggleLeftSidebar}>Toggle Left</Button>
      <Button onClick={toggleRightSidebar}>Toggle Right </Button>
    </div>
  );
};

export const FixedAppHeaderCustomCollapsibleSidebars = () => {
  const [cols, setCols] = useState<TrackSize[]>(["200px", "1fr", "200px"]);
  const [rows] = useState<TrackSize[]>(["48px", "40px", "1fr"]);
  const closeLeftSidebar = () => {
    setCols(([, col2, col3]) => ["0px", col2, col3]);
  };
  const closeRightSidebar = () => {
    setCols(([col1, col2]) => [col1, col2, "0px"]);
  };
  return (
    // prettier-ignore
    <GridLayout id="GridLayoutB" full-page
      layout={{ cols, rows }}
    >
      <GridLayoutItem id="gray" style={{ gridArea: "1/1/2/4" }}>
        <CustomHeader  />
      </GridLayoutItem>
      <GridLayoutItem id="blue" resizeable="h" title="Blue" style={{ gridArea: "2/1/4/2" }} >
        <DebugGridItem style={{ background: "blue" }}>
          <Button onClick={closeLeftSidebar} style={closeButtonStyleLeft}>Close</Button>
          </DebugGridItem>
      </GridLayoutItem>
      <GridLayoutItem id="brown" resizeable="h" style={{ gridArea: "2/2/3/3" }} >
        <DebugGridItem style={{ background: "brown" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="red"
        resizeable="hv"
        title="Red"
        style={{ gridArea: "3/2/4/3" }}
      >
        <DebugGridItem style={{ background: "red" }} />
      </GridLayoutItem>
      <GridLayoutItem
        id="yellow"
        resizeable="h"
        title="Yellow"
        style={{ gridArea: "2/3/4/4" }}
      >
        <DebugGridItem style={{ background: "yellow" }} >
          <Button onClick={closeRightSidebar} style={closeButtonStyleRight}>Close</Button>
        </DebugGridItem>

      </GridLayoutItem>
    </GridLayout>
  );
};

export const SingleRowFixedItemCenter = () => {
  return (
    <GridLayout
      full-page
      id="GridLayoutE"
      layout={{
        cols: ["1fr", "1fr", "1fr", "1fr"],
        rows: ["1fr"],
      }}
    >
      <GridLayoutItem
        header
        id="green"
        resizeable="hv"
        style={{
          gridArea: "1/1/2/2",
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
          gridArea: "1/2/2/3",
        }}
        title="Blue"
        width={150}
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>

      <GridLayoutItem
        header
        id="black"
        resizeable="hv"
        style={{
          gridArea: "1/3/2/4",
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
          gridArea: "1/4/2/5",
        }}
        title="Red"
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const SingleColumnFixedItemBlue = () => {
  return (
    <GridLayout
      full-page
      id="GridLayoutE"
      layout={{
        cols: ["1fr", "1fr"],
        rows: ["1fr", "1fr", "1fr", "1fr"],
      }}
      style={{
        gridTemplateRows: "1fr 100px 1fr 1fr",
      }}
    >
      <GridLayoutItem
        header
        id="green"
        resizeable="hv"
        style={{
          gridArea: "1/1/2/2",
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
        id="pink"
        resizeable="hv"
        style={{
          gridArea: "1/2/2/3",
        }}
        title="Pink"
      >
        <div
          style={{
            background: "pink",
          }}
        />
      </GridLayoutItem>
      <GridLayoutItem
        header
        height={100}
        id="blue"
        style={{
          gridArea: "2/1/3/3",
        }}
        title="Blue (fixed height 100px)"
      >
        <div style={{ background: "blue" }} />
      </GridLayoutItem>

      <GridLayoutItem
        header
        id="yellow"
        resizeable="hv"
        style={{
          gridArea: "3/1/4/3",
        }}
        title="Yellow"
      >
        <div style={{ background: "yellow" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="red"
        resizeable="hv"
        style={{
          gridArea: "4/1/5/2",
        }}
        title="Red"
      >
        <div style={{ background: "red" }} />
      </GridLayoutItem>
      <GridLayoutItem
        header
        id="brown"
        resizeable="hv"
        style={{
          gridArea: "4/2/5/3",
        }}
        title="Brown"
      >
        <div style={{ background: "brown" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};

export const EmptyGridLayout = () => {
  return (
    <GridLayout
      full-page
      id="GridLayoutE"
      layout={{
        cols: ["1fr", "1fr"],
        rows: ["1fr", "1fr"],
      }}
    ></GridLayout>
  );
};

export const EmptyWithPalette = () => {
  const paletteItems = useMemo<GridPaletteItem[]>(
    () => [
      {
        id: "red",
        label: "Red",
        type: "DebugGridItem",
        props: {
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
          style: {
            background: "green",
          },
        },
      },
      {
        id: "yellow",
        label: "Yellow",
        type: "DebugGridItem",
        props: {
          style: {
            background: "yellow",
          },
        },
      },
      {
        id: "brown",
        label: "Brown",
        type: "DebugGridItem",
        props: {
          style: {
            background: "brown",
          },
        },
      },
    ],
    [],
  );
  return (
    <>
      <div id="dragImage" style={{ position: "absolute", left: 0 }}></div>

      <GridLayoutProvider options={{ newChildItem: { header: true } }}>
        <GridLayout
          full-page
          id="GridLayoutE"
          layout={{
            cols: ["200px", "1fr"],
            rows: ["1fr"],
          }}
        >
          <GridLayoutItem
            id="palette"
            resizeable="hv"
            style={{ gridArea: "1/1/2/2" }}
          >
            <GridPalette paletteItems={paletteItems} />
          </GridLayoutItem>
        </GridLayout>
      </GridLayoutProvider>
    </>
  );
};

export const ShowCaseLayout = () => {
  const paletteItems = useMemo<GridPaletteItem[]>(
    () => [
      {
        id: "red",
        label: "Red",
        type: "DebugGridItem",
        props: {
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
          style: {
            background: "green",
          },
        },
      },
      {
        id: "yellow",
        label: "Yellow",
        type: "DebugGridItem",
        props: {
          style: {
            background: "yellow",
          },
        },
      },
      {
        id: "brown",
        label: "Brown",
        type: "DebugGridItem",
        props: {
          style: {
            background: "brown",
          },
        },
      },
    ],
    [],
  );
  return (
    <>
      <div id="dragImage" style={{ position: "absolute", left: 0 }}></div>

      <GridLayout
        full-page
        id="GridLayoutE"
        layout={{
          cols: ["200px", "1fr", "200px"],
          rows: ["48px", "40px", "1fr"],
        }}
      >
        <GridLayoutItem id="app-header" style={{ gridArea: "1/1/2/4" }}>
          <div style={{ background: "yellow" }}>AppHeader</div>
        </GridLayoutItem>
        <GridLayoutItem
          id="palette"
          resizeable="hv"
          style={{ gridArea: "2/1/4/2" }}
        >
          <GridPalette paletteItems={paletteItems} />
        </GridLayoutItem>

        <GridLayoutItem id="app-toolbar" style={{ gridArea: "2/2/3/3" }}>
          <div style={{ background: "brown", color: "white" }}>Toolbar</div>
        </GridLayoutItem>

        <GridLayoutItem
          id="brown"
          stackId="main-tabs"
          style={{ gridArea: "3/2/4/3" }}
          title="Brown"
        >
          <div style={{ background: "brown", color: "white" }}>Brown</div>
        </GridLayoutItem>
        <GridLayoutItem
          id="navy"
          stackId="main-tabs"
          style={{ gridArea: "3/2/4/3" }}
          title="Navy"
        >
          <div style={{ background: "navy", color: "white" }}>Navy</div>
        </GridLayoutItem>
        <GridLayoutItem
          id="gray"
          stackId="main-tabs"
          style={{ gridArea: "3/2/4/3" }}
          title="Gray"
        >
          <div style={{ background: "gray", color: "white" }}>Gray</div>
        </GridLayoutItem>
        <GridLayoutItem
          id="black"
          stackId="main-tabs"
          style={{ gridArea: "3/2/4/3" }}
          title="Black"
        >
          <div style={{ background: "black", color: "white" }}>Black</div>
        </GridLayoutItem>
      </GridLayout>
    </>
  );
};

export const ShowCaseLayoutNestedGrid = () => {
  const paletteItems = useMemo<GridPaletteItem[]>(
    () => [
      {
        label: "Red",
        type: "DebugGridItem",
        props: {
          style: {
            background: "red",
          },
        },
      },
      {
        label: "Green",
        type: "DebugGridItem",
        props: {
          style: {
            background: "green",
          },
        },
      },
      {
        label: "Yellow",
        type: "DebugGridItem",
        props: {
          style: {
            background: "yellow",
          },
        },
      },
      {
        label: "Brown",
        type: "DebugGridItem",
        props: {
          debugLabel: "Brown",
          style: {
            background: "brown",
          },
        },
      },
    ],
    [],
  );

  const handleGridLayoutChanged = useCallback<GridLayoutChangeHandler>(
    (id, gridLayout) => {
      console.log(`layout changed for grid ${id}`, {
        gridLayout,
      });
    },
    [],
  );

  return (
    <>
      <div id="dragImage" style={{ position: "absolute", left: 0 }}></div>
      <GridLayoutProvider options={{ newChildItem: { header: true } }}>
        <GridLayout
          full-page
          id="showcase"
          layout={{
            cols: ["200px", "1fr", "200px"],
            rows: ["48px", "40px", "1fr"],
          }}
          onChange={handleGridLayoutChanged}
        >
          <GridLayoutItem
            id="app-header"
            style={{
              gridArea: "1/1/2/4",
            }}
          >
            <div style={{ background: "yellow" }}>AppHeader</div>
          </GridLayoutItem>
          <GridLayoutItem
            id="palette"
            resizeable="hv"
            style={{
              gridArea: "2/1/4/2",
            }}
          >
            <GridPalette paletteItems={paletteItems} />
          </GridLayoutItem>

          <GridLayoutItem
            id="app-toolbar"
            style={{
              gridArea: "2/2/3/3",
            }}
          >
            <div style={{ background: "brown", color: "white" }}>Toolbar</div>
          </GridLayoutItem>

          <GridLayoutItem
            id="LayoutBrown"
            stackId="main-tabs"
            style={{ gridArea: "3/2/4/3" }}
            title="Brown Layout"
          >
            <GridLayout
              id="brown-layout"
              layout={{ cols: ["1fr"], rows: ["1fr"] }}
              title="Brown Layout"
            >
              <GridLayoutItem
                data-drop-target
                id="brown"
                resizeable="hv"
                style={{ gridArea: "1/1/2/2" }}
              >
                <DebugGridItem
                  style={{
                    background: "brown",
                  }}
                />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutItem>
          <GridLayoutItem
            id="LayoutNavy"
            stackId="main-tabs"
            style={{ gridArea: "3/2/4/3" }}
            title="Navy Layout"
          >
            <GridLayout
              id="navy-layout"
              layout={{
                cols: ["1fr"],
                rows: ["1fr"],
              }}
              title="Navy Layout"
            >
              <GridLayoutItem
                data-drop-target
                id="navy"
                style={{
                  gridArea: "1/1/2/2",
                }}
              >
                <DebugGridItem
                  style={{
                    background: "navy",
                  }}
                />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutItem>
          <GridLayoutItem
            id="LayoutGray"
            stackId="main-tabs"
            style={{ gridArea: "3/2/4/3" }}
            title="Gray Layout"
          >
            <GridLayout
              id="gray-layout"
              layout={{
                cols: ["1fr"],
                rows: ["1fr"],
              }}
              title="Gray Layout"
            >
              <GridLayoutItem
                data-drop-target
                id="gray"
                style={{
                  gridArea: "1/1/2/2",
                }}
              >
                <DebugGridItem
                  style={{
                    background: "darkgray",
                  }}
                />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutItem>
          <GridLayoutItem
            id="LayoutBlack"
            stackId="main-tabs"
            style={{ gridArea: "3/2/4/3" }}
            title="Black Layout"
          >
            <GridLayout
              id="black-layout"
              layout={{
                cols: ["1fr"],
                rows: ["1fr"],
              }}
              title="Black Layout"
            >
              <GridLayoutItem
                data-drop-target
                id="black"
                style={{
                  gridArea: "1/1/2/2",
                }}
              >
                <DebugGridItem
                  style={{
                    background: "black",
                    color: "white",
                  }}
                />
              </GridLayoutItem>
            </GridLayout>
          </GridLayoutItem>
        </GridLayout>
      </GridLayoutProvider>
    </>
  );
};
