import {
  Dropdown,
  Toolbar,
  Tooltray,
  ToolbarButton,
  ToolbarField,
} from "@heswell/uitk-lab";
import {
  ExportIcon,
  ShareIcon,
  NotificationIcon,
  TearOutIcon,
} from "@heswell/uitk-icons";
import { Button } from "@heswell/uitk-core";
import { ColumnChooserIcon, CsvIcon, PdfIcon } from "@heswell/uitk-icons";
import { Flexbox } from "@vuu-ui/layout";

import "@heswell/component-anatomy/esm/index.css";
import { useState } from "react";

export const DefaultToolbar = () => {
  const typeData = ["Open", "Close", "Discarded", "Resolved"];
  const rangeData = [
    "Today",
    "Yesterday",
    "Last Week",
    "Last Month",
    "Last Year",
  ];

  const logItemName = (buttonName: string) =>
    console.log(`${buttonName} button clicked'`);

  return (
    <Toolbar id="toolbar-default">
      <ToolbarField label="Range">
        <Dropdown
          defaultSelected={rangeData[0]}
          source={rangeData}
          style={{ width: 100 }}
        />
      </ToolbarField>
      <ToolbarField label="Type">
        <Dropdown
          defaultSelected={typeData[0]}
          source={typeData}
          style={{ width: 90 }}
        />
      </ToolbarField>
      <ToolbarButton onClick={() => logItemName("export")}>
        <ExportIcon /> Export
      </ToolbarButton>
      <ToolbarButton onClick={() => logItemName("share")}>
        <ShareIcon /> Share
      </ToolbarButton>
      <ToolbarButton onClick={() => logItemName("alerts")}>
        <NotificationIcon /> Set Alerts
      </ToolbarButton>
      <ToolbarButton onClick={() => logItemName("expand")}>
        <TearOutIcon /> Expand
      </ToolbarButton>
    </Toolbar>
  );
};

export const TooltrayCollapseOrder = () => {
  const viewsData = ["No view selected", "Outstanding", "Closed"];
  const [view, setView] = useState(viewsData[0]);

  return (
    <Flexbox style={{ height: 200, width: 800 }}>
      <div data-resizeable style={{ flex: 1 }}>
        <Toolbar style={{ minWidth: 32 }}>
          <Tooltray
            aria-label="views tooltray"
            data-collapsible="dynamic"
            data-priority={3}
            // overflowButtonLabel="Views"
          >
            <ToolbarField label="Views" labelPlacement="left">
              <Dropdown
                onSelect={(_, item) => setView(item)}
                selected={view}
                source={viewsData}
                style={{ width: 132 }}
              />
            </ToolbarField>
            <ToolbarField>
              <Button>Save</Button>
            </ToolbarField>

            <ToolbarField>
              <Button>Save as...</Button>
            </ToolbarField>
            <ToolbarField>
              <Button disabled>Reset</Button>
            </ToolbarField>
            <ToolbarField>
              <ToolbarButton id="colsButton">
                Select Columns <ColumnChooserIcon />
              </ToolbarButton>
            </ToolbarField>
          </Tooltray>
          <Tooltray
            aria-label="export tooltray"
            data-align-end
            data-collapsible="dynamic"
            data-priority="2"
          >
            <ToolbarField>
              <ToolbarButton id="pdfButton">
                Export PDF <PdfIcon />
              </ToolbarButton>
            </ToolbarField>
            <ToolbarField>
              <ToolbarButton id="csvButton">
                Export CSV <CsvIcon />
              </ToolbarButton>
            </ToolbarField>
          </Tooltray>
        </Toolbar>
        <br />
      </div>
      <div data-resizeable />
    </Flexbox>
  );
};
