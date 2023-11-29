// import { Table } from "@finos/vuu-table";
import { Button } from "@salt-ds/core";
import { useState } from "react";
// import { useTableConfig } from "../utils/useTableConfig";
import { DockLayout } from "./components/DockLayout";

import "./LayoutExperiments.examples.css";

let displaySequence = 1;

const classBase = "DockLayout";

const CONTENT = 2;
const TOP = 4;
const LEFT = 8;
const BOTTOM = 16;
const RIGHT = 32;

const CONTENT_ONLY = CONTENT;

export const DefaultDockLayout = () => {
  const [openPanels, setOpenPanels] = useState(CONTENT_ONLY);
  return (
    <div style={{ height: "100vh", display: "flex" }}>
      <DockLayout
        resize="defer"
        showBottomPanel={Boolean(BOTTOM & openPanels)}
        showLeftPanel={Boolean(LEFT & openPanels)}
        showRightPanel={Boolean(RIGHT & openPanels)}
        showTopPanel={Boolean(TOP & openPanels)}
        style={{ flex: "1 1 auto", height: "100%" }}
      >
        <div data-dock="top" style={{ backgroundColor: "cornflowerblue" }} />
        <div data-dock="left" style={{ backgroundColor: "aliceblue" }} />
        <div data-dock="right" style={{ backgroundColor: "paleturquoise" }} />
        <div data-dock="bottom" style={{ backgroundColor: "beige" }} />
        <div
          className={`${classBase}-content`}
          data-dock="content"
          style={{ backgroundColor: "yellow" }}
        />
      </DockLayout>
      <div
        style={{
          display: "grid",
          flex: "0 0 200px",
          alignContent: "start",
          padding: "0 6px",
          gap: 6,
        }}
      >
        <Button onClick={() => setOpenPanels(CONTENT_ONLY)}>
          Content Only
        </Button>
        <Button onClick={() => setOpenPanels(CONTENT + TOP)}>Top</Button>
        <Button onClick={() => setOpenPanels(CONTENT + TOP + LEFT)}>
          Left and Top
        </Button>
        <Button onClick={() => setOpenPanels(CONTENT + TOP + BOTTOM)}>
          Top and Bottom
        </Button>
        <Button onClick={() => setOpenPanels(CONTENT + TOP + LEFT + BOTTOM)}>
          Left, Top and Bottom
        </Button>
        <Button onClick={() => setOpenPanels(CONTENT + RIGHT)}>Right</Button>
      </div>
    </div>
  );
};
DefaultDockLayout.displaySequence = displaySequence++;

export const GridToolbar = () => {
  return (
    <div id="grid-toolbar" style={{ background: "darkgray", padding: 8 }}>
      <div id="toolbar-inner">
        <div id="picker" />
        <div id="side" />
        <div id="units" />
        <div id="notional" />
        <div id="notional-usd" />
        <div id="send-button" />
      </div>
    </div>
  );
};
GridToolbar.displaySequence = displaySequence++;
