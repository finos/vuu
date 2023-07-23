// import { Switch } from "@salt-ds/core";
import { Dropdown, Pill } from "@salt-ds/lab";
import { Toolbar, ToolbarField } from "@heswell/salt-lab";
import { ToggleButton } from "@salt-ds/core";
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

  const handleToggleTestOne = useCallback(
    () => enableTestOne((val) => !val),
    []
  );
  const handleToggleTestTwo = useCallback(
    () => enableTestTwo((val) => !val),
    []
  );
  const handleToggleTestThree = useCallback(
    () => enableTestThree((val) => !val),
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
        onChange={handleToggleTestOne}
        selected={testOneEnabled}
        value="one"
      >
        Test One
      </ToggleButton>
      <ToggleButton
        className="vuuToggleButton"
        onChange={handleToggleTestTwo}
        selected={testTwoEnabled}
        value="two"
      >
        Test Two
      </ToggleButton>
      <ToggleButton
        className="vuuToggleButton"
        onChange={handleToggleTestThree}
        selected={testThreeEnabled}
        value="three"
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
