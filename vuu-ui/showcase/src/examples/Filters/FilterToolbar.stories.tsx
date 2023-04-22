// import { Switch } from "@salt-ds/core";
import { ColumnFilter } from "@finos/vuu-filters";
import {
  Dropdown,
  Pill,
  ToggleButton,
  ToggleButtonToggleEventHandler,
  Toolbar,
  ToolbarField,
  Tooltray,
} from "@heswell/salt-lab";
import { useCallback, useState } from "react";

import { useAutoLoginToVuuServer, useSchemas } from "../utils";
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
  const {
    schemas: { parentOrders },
  } = useSchemas();

  const error = useAutoLoginToVuuServer();

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
    <div className="vuuColumnFilterBar">
      <ColumnFilter schema={parentOrders} style={{ minWidth: 120 }} />

      {/* <Tooltray alignEnd>
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
      </Tooltray> */}
    </div>
  );
};
