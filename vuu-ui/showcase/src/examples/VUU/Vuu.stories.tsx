import {
  Dropdown,
  List,
  ListItem,
  Toolbar,
  ToolbarField,
} from "@heswell/salt-lab";
import { useEffect, useState } from "react";

import { useTypeaheadSuggestions, useVuuTables } from "@finos/vuu-data";
import { useAutoLoginToVuuServer } from "../utils";

let displaySequence = 1;

export const VuuTables = () => {
  const tables = useVuuTables();

  useAutoLoginToVuuServer();

  return (
    <List width={200}>
      {tables
        ? Array.from(tables.entries()).map(([tableName, schema]) => (
            <ListItem
              key={tableName}
            >{`[${schema.table.module}] ${schema.table.table}`}</ListItem>
          ))
        : null}
    </List>
  );
};

VuuTables.displaySequence = displaySequence++;

export const FilterToolbar = () => {
  const [currencies, setCurrencies] = useState<string[]>([]);
  const getSuggestions = useTypeaheadSuggestions();

  useAutoLoginToVuuServer();

  useEffect(() => {
    getSuggestions([
      { module: "SIMUL", table: "instruments" },
      "currency",
    ]).then((response) => setCurrencies(response));
  }, [getSuggestions]);

  return (
    <Toolbar id="toolbar-default">
      <ToolbarField
        className="vuuFilterDropdown"
        label="Currency"
        labelPlacement="top"
      >
        <Dropdown
          defaultSelected={[]}
          selectionStrategy="multiple"
          source={currencies}
          style={{ width: 100 }}
        />
      </ToolbarField>
    </Toolbar>
  );
};
