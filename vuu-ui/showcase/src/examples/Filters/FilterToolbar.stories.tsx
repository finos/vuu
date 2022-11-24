import {
  ExportIcon,
  NotificationIcon,
  ShareIcon,
  TearOutIcon,
} from "@heswell/uitk-icons";
import {
  Dropdown,
  Toolbar,
  ToolbarButton,
  ToolbarField,
} from "@heswell/uitk-lab";
import React from "react";

import "./FilterToolbar.stories.css";

const currencies = ["EUR", "USD", "CHF", "SEK", "JPY"];
const exchanges = ["XLON", "SETS", "NASDAQ"];

export const DefaultFilterToolbar = () => {
  //   const rangeData = [
  //     "Today",
  //     "Yesterday",
  //     "Last Week",
  //     "Last Month",
  //     "Last Year",
  //   ];

  const logItemName = (buttonName: string) =>
    console.log(`${buttonName} button clicked'`);

  return (
    <Toolbar id="toolbar-default">
      <ToolbarField
        className="vuuFilterDropdown"
        label="Currency"
        labelPlacement="top"
      >
        <Dropdown
          defaultSelected={[currencies[0]]}
          selectionStrategy="multiple"
          source={currencies}
          style={{ width: 100 }}
        />
      </ToolbarField>
      <ToolbarField
        className="vuuFilterDropdown"
        label="Exchange"
        labelPlacement="top"
      >
        <Dropdown
          defaultSelected={[exchanges[0]]}
          selectionStrategy="multiple"
          source={exchanges}
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
