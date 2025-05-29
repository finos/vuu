import { List, ListItem } from "@vuu-ui/vuu-ui-controls";
import { useVuuTables, VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { useAutoLoginToVuuServer } from "../utils";

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
