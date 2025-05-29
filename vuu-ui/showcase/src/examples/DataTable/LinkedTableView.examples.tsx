import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { LinkedDataSources, LinkedTableView } from "@vuu-ui/vuu-datatable";
import { useMemo } from "react";

export const TwoLevelLinkedTablesWithDescriptors = () => {
  const linkedDataSources = useMemo<LinkedDataSources>(() => {
    return {
      "1": {
        dataSource: {
          table: { module: "SIMUL", table: "parentOrders" },
        },
        title: "Orders",
      },
      "2": {
        vuuLink: {
          fromColumn: "",
          toColumn: "",
        },
        dataSource: {
          table: { module: "SIMUL", table: "childOrders" },
        },
        title: "Child Orders",
      },
    };
  }, []);

  return (
    <LocalDataSourceProvider>
      <LinkedTableView
        linkedDataSources={linkedDataSources}
        style={{ height: "100%" }}
      />
    </LocalDataSourceProvider>
  );
};

export const MultipleLevelTwoTables = () => {
  const linkedDataSources = useMemo<LinkedDataSources>(() => {
    return {
      "1": {
        dataSource: {
          table: { module: "SIMUL", table: "parentOrders" },
        },
        title: "Orders",
      },
      "2": [
        {
          vuuLink: {
            fromColumn: "parentOrderId",
            toColumn: "id",
          },
          dataSource: {
            table: { module: "SIMUL", table: "childOrders" },
            title: "Child Orders",
          },
          title: "Child Orders 1",
        },
        {
          vuuLink: {
            fromColumn: "parentOrderId",
            toColumn: "id",
          },
          dataSource: {
            table: { module: "SIMUL", table: "childOrders" },
          },
          title: "Child Orders 2",
        },
      ],
    };
  }, []);

  return (
    <LocalDataSourceProvider>
      <LinkedTableView
        linkedDataSources={linkedDataSources}
        style={{ height: "100%" }}
      />
    </LocalDataSourceProvider>
  );
};

export const ThreeLevelLinkedTablesWithDescriptors = () => {
  const linkedDataSources = useMemo<LinkedDataSources>(() => {
    return {
      "1": {
        dataSource: {
          table: { module: "SIMUL", table: "instruments" },
        },
        title: "instruments",
      },
      "2": {
        dataSource: {
          table: { module: "SIMUL", table: "parentOrders" },
        },
        vuuLink: {
          fromColumn: "ric",
          toColumn: "ric",
        },
        title: "Orders",
      },
      "3": {
        dataSource: {
          table: { module: "SIMUL", table: "childOrders" },
        },
        vuuLink: {
          fromColumn: "parentOrderId",
          toColumn: "id",
        },
        title: "Child Orders",
      },
    };
  }, []);

  return (
    <LocalDataSourceProvider>
      <LinkedTableView
        linkedDataSources={linkedDataSources}
        style={{ height: "100%" }}
      />
    </LocalDataSourceProvider>
  );
};
