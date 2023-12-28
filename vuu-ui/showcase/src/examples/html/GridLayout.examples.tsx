let displaySequence = 1;

import { useCallback, useRef } from "react";
import {
  GridLayout,
  GridLayoutItem,
  GridSplitter,
  LayoutAPI,
} from "./components/GridLayout";
import "./GridLayout.examples.css";

export const GridLayoutA = () => {
  return (
    <GridLayout colCount={24} id="GridLayoutA" rowCount={13}>
      <div className="component" id="component-A1" />
      <div className="component" id="component-A2" />
      <div className="component" id="component-A3" />
      <div className="component" id="component-A4" />
      <div className="component" id="component-A5" />
    </GridLayout>
  );
};
GridLayoutA.displaySequence = displaySequence++;

export const GridLayoutB = () => {
  return (
    <GridLayout colCount={1} id="GridLayoutB" rowCount={4}>
      <div className="component" id="left-sidebar" tabIndex={0} />
      <div className="component" id="red-B" data-resizeable="v" />
      <div className="component" id="green-B" data-resizeable="v" />
      <div className="component" id="brown-B" data-resizeable="v" />
      <div className="component" id="black-B" data-resizeable="v" />
    </GridLayout>
  );
};
GridLayoutB.displaySequence = displaySequence++;

export const GridLayoutC = () => {
  // prettier-ignore
  return (
    <GridLayout colCount={3} id="GridLayoutC" rowCount={3}>
      <div className="component" id="left-sidebar" tabIndex={0}/>
      <div className="component" id="red-C" data-text="C1"/>
      <div className="component" id="green-C" data-resizeable="hv"/>
      <div className="component" id="brown-C" data-resizeable="hv" />
      <div className="component" id="black-C" data-resizeable="hv"/>
      <div className="component" id="yellow-C" data-resizeable="hv"/>
    </GridLayout>
  );
};
GridLayoutC.displaySequence = displaySequence++;

export const GridLayoutD = () => {
  // prettier-ignore
  return (
    <GridLayout colCount={2} id="GridLayoutD" rowCount={2}>
      <div className="component" data-color="green" id="green-D" data-resizeable="hv"/>
      <div className="component" data-color="brown" id="brown-D" data-resizeable="hv" />
      <div className="component" data-color="black" id="black-D" data-resizeable="hv"/>
      <div className="component" data-color="yellow" id="yellow-D" data-resizeable="hv"/>
    </GridLayout>
  );
};
GridLayoutD.displaySequence = displaySequence++;

export const GridLayoutE = () => {
  // prettier-ignore
  return (
    <GridLayout colCount={2} id="GridLayoutD" rowCount={3}>
      <div className="component" data-color="green" id="green-E" data-resizeable="hv"/>
      <div className="component" data-color="brown" id="brown-E" data-resizeable="hv" />
      <div className="component" data-color="black" id="black-E" data-resizeable="hv"/>
      <div className="component" data-color="yellow" id="yellow-E" data-resizeable="hv"/>
    </GridLayout>
  );
};
GridLayoutE.displaySequence = displaySequence++;

export const GridLayoutF = () => {
  // prettier-ignore
  return (
    <GridLayout colCount={2} id="GridLayoutF" rowCount={3}>
      <div className="component" id="red-F" data-text="C1"/>
      <div className="component" id="green-F" data-resizeable="hv"/>
      <div className="component" id="brown-F" data-resizeable="hv" />
      <div className="component" id="black-F" data-resizeable="hv"/>
      <div className="component" id="yellow-F" data-resizeable="hv"/>
    </GridLayout>
  );
};
GridLayoutF.displaySequence = displaySequence++;

export const GridLayoutG = () => {
  // prettier-ignore
  return (
    <GridLayout colCount={3} id="GridLayoutG" rowCount={3}>
      <div className="component" id="red-G" data-resizeable="h"/>
      <div className="component" id="cyan-G" data-resizeable="h"/>
      <div className="component" id="green-G" data-resizeable="hv"/>
      <div className="component" id="brown-G" data-resizeable="hv" />
      <div className="component" id="black-G" data-resizeable="hv"/>
      <div className="component" id="yellow-G" data-resizeable="hv"/>
    </GridLayout>
  );
};
GridLayoutG.displaySequence = displaySequence++;

export const GridLayoutH = () => {
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
        id="GridLayoutH"
        rowCount={2}
        layoutAPI={layoutApi}
      >
        <GridLayoutItem id="green-H" resizeable="hv">
          <div style={{ background: "green" }} />
        </GridLayoutItem>
        <GridLayoutItem id="brown-H" resizeable="hv">
          <div style={{ background: "brown" }} />
        </GridLayoutItem>
        <GridLayoutItem id="black-H" resizeable="hv">
          <div style={{ background: "black" }} />
        </GridLayoutItem>
        <GridLayoutItem id="yellow-H" resizeable="hv">
          <div style={{ background: "yellow" }} />
        </GridLayoutItem>
        <GridSplitter
          aria-controls="brown-H"
          orientation="horizontal"
          style={{ gridColumn: 2, gridRow: "1/2" }}
        />
        <GridSplitter
          aria-controls="yellow-H"
          orientation="horizontal"
          style={{ gridColumn: 2, gridRow: "2/3" }}
        />
        <GridSplitter
          aria-controls="black-H"
          orientation="vertical"
          style={{ gridColumn: "1/2", gridRow: 2 }}
        />
        <GridSplitter
          aria-controls="yellow-H"
          orientation="vertical"
          style={{ gridColumn: "2/3", gridRow: 2 }}
        />
      </GridLayout>
    </div>
  );
};
GridLayoutH.displaySequence = displaySequence++;
