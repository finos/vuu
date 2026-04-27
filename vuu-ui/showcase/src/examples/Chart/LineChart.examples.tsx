import { Chart, ChartContextMenuOptions } from "@vuu-ui/vuu-chart";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  Table as DataTable,
  TickingArrayDataSource,
} from "@vuu-ui/vuu-data-test";
import { useCallback, useMemo } from "react";
import {
  ContextMenuProvider,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import {
  TableContextMenuDef,
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table-types";

const ChartTableSchema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "date", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
    { name: "volume", serverDataType: "double" },
  ],
  key: "id",
  table: { module: "TEST", table: "ParentTable" },
};

const table = new DataTable(
  ChartTableSchema,
  [
    ["001", "2026-04-02", 100, 1000],
    ["002", "2026-04-03", 101, 999],
    ["003", "2026-04-04", 102, 998],
    ["004", "2026-04-05", 103, 1000],
    ["005", "2026-04-06", 104, 1002],
    ["006", "2026-04-07", 105, 1000],
    ["007", "2026-04-08", 106, 1004],
    ["008", "2026-04-09", 107, 1040],
    ["009", "2026-04-10", 108, 1080],
    ["010", "2026-04-11", 109, 1100],
    ["010", "2026-04-12", 109, 1100],
    ["010", "2026-04-13", 114, 1100],
    ["010", "2026-04-14", 118, 1100],
    ["010", "2026-04-15", 125, 1100],
    ["010", "2026-04-16", 136, 1100],
    ["010", "2026-04-17", 170, 1100],
    ["010", "2026-04-18", 145, 1100],
    ["010", "2026-04-19", 147, 1100],
    ["010", "2026-04-20", 140, 1100],
    ["010", "2026-04-21", 138, 1100],
    ["010", "2026-04-22", 138, 1100],
    ["010", "2026-04-23", 120, 1100],
  ],
  { id: 0, date: 1, price: 2, volume: 3 },
);

const useContextMenu = (): TableContextMenuDef => {
  const menuBuilder: MenuBuilder<TableMenuLocation, TableContextMenuOptions> =
    useCallback((_location, options) => {
      return [{ id: "cell-copy", label: "Copy text", options }];
    }, []);

  const menuActionHandler = useCallback<
    MenuActionHandler<string, ChartContextMenuOptions>
  >((menuItemId, options) => {
    if (options) {
      const { value } = options;
      switch (menuItemId) {
        case "cell-copy": {
          navigator.clipboard.writeText(`${value}`);
          return true;
        }

        default:
          return false;
      }
    } else {
      return false;
    }
  }, []);

  return {
    menuBuilder,
    menuActionHandler,
  };
};

export const SimpleLineChart = () => {
  const dataSource = useMemo(() => {
    return new TickingArrayDataSource({
      columnDescriptors: ChartTableSchema.columns,
      table,
    });
  }, []);

  const { menuBuilder, menuActionHandler } = useContextMenu();

  return (
    <div style={{ width: 800, height: 600 }}>
      <ContextMenuProvider
        menuActionHandler={menuActionHandler}
        menuBuilder={menuBuilder}
      >
        <Chart
          categoryColumnName="date"
          dataSource={dataSource}
          seriesColumnNames={["price"]}
        />
      </ContextMenuProvider>
    </div>
  );
};
