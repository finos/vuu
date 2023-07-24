import { DockLayout } from "./components/DockLayout";

const classBase = "DockLayout";

import { Toolbar } from "@heswell/salt-lab";
import { Button } from "@salt-ds/core";
import { useState } from "react";
import "./LayoutExperiments.examples.css";
import { useTableConfig } from "../utils/useTableConfig";
import { Table } from "@finos/vuu-table";

let displaySequence = 1;

const CONTENT = 2;
const TOP = 4;
const LEFT = 8;
const BOTTOM = 16;
const RIGHT = 32;

const CONTENT_ONLY = CONTENT;

export const DefaultDockLayout = () => {
  const [openPanels, setOpenPanels] = useState(CONTENT_ONLY);
  return (
    <div style={{ height: "100%", display: "flex", gap: 12 }}>
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
      <Toolbar
        className="DockToolbar"
        orientation="vertical"
        style={{ flex: "0 0 200px" }}
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
      </Toolbar>
    </div>
  );
};
DefaultDockLayout.displaySequence = displaySequence++;

export const DockLayoutWithTable = () => {
  const [openPanels, setOpenPanels] = useState(CONTENT_ONLY);
  const config = useTableConfig({ count: 1_000 });

  return (
    <div style={{ height: "100%", display: "flex", gap: 12 }}>
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
        <Table
          {...config}
          data-dock="content"
          renderBufferSize={100}
          rowHeight={20}
          zebraStripes
        />
      </DockLayout>
      <Toolbar
        className="DockToolbar"
        orientation="vertical"
        style={{ flex: "0 0 200px" }}
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
      </Toolbar>
    </div>
  );
};
DockLayoutWithTable.displaySequence = displaySequence++;
