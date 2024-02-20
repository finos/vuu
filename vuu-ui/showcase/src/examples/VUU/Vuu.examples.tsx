import { List, ListItem } from "@finos/vuu-ui-controls";
import { useVuuTables } from "@finos/vuu-data-react";
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
