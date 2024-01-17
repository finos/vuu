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
    </div>
  );
};
GridLayoutA.displaySequence = displaySequence++;

export const GridLayoutBlankSpace = () => {
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
        <div style={{ background: "blue" }} />
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
GridLayoutBlankSpace.displaySequence = displaySequence++;

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

export const GridLayoutF = () => {
  return (
    <GridLayout colCount={2} id="GridLayoutE" rowCount={2}>
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
        <div
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
        <div style={{ background: "blue" }} />
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
        <div style={{ background: "black" }} />
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
        <div style={{ background: "red" }} />
      </GridLayoutItem>
    </GridLayout>
  );
};
GridLayoutF.displaySequence = displaySequence++;

export const GridLayoutG = () => {
  return (
    <GridLayout colCount={2} id="GridLayoutE" rowCount={3}>
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

export const SingleRowFixedItemLeft = () => {
  return (
    <GridLayout colCount={4} id="GridLayoutE" rowCount={1}>
      <GridLayoutItem
        header
        id="green"
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
SingleRowFixedItemLeft.displaySequence = displaySequence++;

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
