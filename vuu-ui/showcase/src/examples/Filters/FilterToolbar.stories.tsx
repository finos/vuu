// import { Switch } from "@heswell/uitk-core";
import { Pill } from "@heswell/uitk-core";
import {
  Dropdown,
  ToggleButton,
  ToggleButtonToggleEventHandler,
  Toolbar,
  ToolbarField,
} from "@heswell/uitk-lab";
import React, { useCallback, useState } from "react";

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

  const [testOneEnabled, enableTestOne] = useState(true);
  const [testTwoEnabled, enableTestTwo] = useState(true);
  const [testThreeEnabled, enableTestThree] = useState(true);

  const handleToggleTestOne: ToggleButtonToggleEventHandler = useCallback(
    (evt, toggled) => enableTestOne(toggled),
    []
  );
  const handleToggleTestTwo: ToggleButtonToggleEventHandler = useCallback(
    (evt, toggled) => enableTestTwo(toggled),
    []
  );
  const handleToggleTestThree: ToggleButtonToggleEventHandler = useCallback(
    (evt, toggled) => enableTestThree(toggled),
    []
  );

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
      <ToggleButton
        className="vuuToggleButton"
        onToggle={handleToggleTestOne}
        toggled={testOneEnabled}
        variant="secondary"
      >
        Test One
      </ToggleButton>
      <ToggleButton
        className="vuuToggleButton"
        onToggle={handleToggleTestTwo}
        toggled={testTwoEnabled}
      >
        Test Two
      </ToggleButton>
      <ToggleButton
        className="vuuToggleButton"
        onToggle={handleToggleTestThree}
        toggled={testThreeEnabled}
      >
        Test Three
      </ToggleButton>
      <Pill
        className="vuuFilterPill"
        label="Test Four"
        variant="selectable"
      ></Pill>
    </Toolbar>
  );
};
