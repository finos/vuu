import { List, ListItem } from "@finos/vuu-ui-controls";
import { useVuuTables, VuuDataSourceProvider } from "@finos/vuu-data-react";
import { useAutoLoginToVuuServer } from "../utils";

let displaySequence = 1;

const VuuTablesTemplate = () => {
  const tableSchemas = useVuuTables();

  useAutoLoginToVuuServer({ authenticate: false });

  return (
    <VuuDataSourceProvider>
      <List width={200}>
        {tableSchemas?.map(({ table: { module, table } }, i) => (
          <ListItem key={i}>{`[${module}] ${table}`}</ListItem>
        )) ?? null}
      </List>
    </VuuDataSourceProvider>
  );
};

export const VuuTables = () => {
  return (
    <VuuDataSourceProvider>
      <VuuTablesTemplate />
    </VuuDataSourceProvider>
  );
};

VuuTables.displaySequence = displaySequence++;
