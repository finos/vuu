let displaySequence = 1;
import { useCallback, useRef } from "react";
import { GridLayout, GridLayoutItem, LayoutAPI } from "./components/GridLayout";
import "./GridLayout.examples.css";

export const GridLayoutA = () => {
  // prettier-ignore

  const layoutApi = useRef<LayoutAPI>(null)

  const splitSelectedRow = useCallback(() => {
    const activeComponent = document.querySelector(".component-active");
    if (activeComponent && layoutApi.current) {
      console.log("split active");
      layoutApi.current.splitGridRow(activeComponent.id);
    }
  }, []);

  const splitSelectedCol = useCallback(() => {
    const activeComponent = document.querySelector(".component-active");
    if (activeComponent && layoutApi.current) {
      console.log("split active");
      layoutApi.current.splitGridCol(activeComponent.id);
    }
  }, []);

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
      </div>
      <GridLayout
        colCount={2}
        id="GridLayoutA"
        rowCount={2}
        layoutAPI={layoutApi}
      >
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
            gridRowStart: 2,
            gridRowEnd: 3,
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
            gridRowEnd: 3,
          }}
        >
          <div style={{ background: "red" }} />
        </GridLayoutItem>
      </GridLayout>
    </div>
  );
};
GridLayoutA.displaySequence = displaySequence++;

export const GridLayoutC = () => {
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
GridLayoutC.displaySequence = displaySequence++;

export const GridLayoutB = () => {
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
GridLayoutB.displaySequence = displaySequence++;

export const GridLayoutD = () => {
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
GridLayoutD.displaySequence = displaySequence++;

export const GridLayoutE = () => {
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
GridLayoutE.displaySequence = displaySequence++;
