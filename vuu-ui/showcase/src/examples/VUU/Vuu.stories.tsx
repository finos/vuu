import {
  Dropdown,
  List,
  ListItem,
  Toolbar,
  ToolbarField,
} from "@heswell/salt-lab";
import { useEffect, useMemo, useState } from "react";

import {
  authenticate as vuuAuthenticate,
  connectToServer,
  useTypeaheadSuggestions,
  useVuuTables,
} from "@finos/vuu-data";

let displaySequence = 1;

export const VuuTables = () => {
  const tables = useVuuTables();

  useEffect(() => {
    const connect = async () => {
      const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
      connectToServer("127.0.0.1:8090/websocket", authToken);
    };
    connect();
  }, []);

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

  useMemo(() => {
    connectToServer("wss://127.0.0.1:8090/websocket", "fake-auth-token");
  }, []);

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
