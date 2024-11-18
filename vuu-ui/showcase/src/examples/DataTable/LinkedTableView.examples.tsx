import { LocalDataSourceProvider } from "@finos/vuu-data-test";
import { LinkedDataSources, LinkedTableView } from "@finos/vuu-datatable";
import { useMemo } from "react";

let displaySequence = 0;

export const TwoLevelLinkedTablesWithDescriptors = () => {
  const linkedDataSources = useMemo<LinkedDataSources>(() => {
    return {
      "1": {
        table: { module: "SIMUL", table: "parentOrders" },
        title: "Orders",
      },
      "2": {
        linkColumns: {
          fromColumn: "",
          toColumn: "",
        },
        dataSource: {
          table: { module: "SIMUL", table: "childOrders" },
          title: "Child Orders",
        },
      },
    };
  }, []);

  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <LinkedTableView
        linkedDataSources={linkedDataSources}
        style={{ height: "100%" }}
      />
    </LocalDataSourceProvider>
  );
};
TwoLevelLinkedTablesWithDescriptors.displaySequence = displaySequence++;
