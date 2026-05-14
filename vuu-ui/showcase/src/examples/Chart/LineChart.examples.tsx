import {
  Chart,
  ChartContextMenuOptions,
  ChartMenuLocation,
} from "@vuu-ui/vuu-chart";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import {
  Table as DataTable,
  TickingArrayDataSource,
} from "@vuu-ui/vuu-data-test";
import { useCallback, useMemo, useState } from "react";
import {
  ContextMenuProvider,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import { TableContextMenuDef } from "@vuu-ui/vuu-table-types";
import { ItemColorFunction } from "@vuu-ui/vuu-chart/src/ChartSeries";
import { Button } from "@salt-ds/core";

const ChartTableSchema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "date", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
    { name: "volume", serverDataType: "double" },
    { name: "edited", serverDataType: "boolean" },
  ],
  key: "id",
  table: { module: "TEST", table: "ParentTable" },
};

const table = new DataTable(
  ChartTableSchema,
  [
    ["001", "2026-04-02", 100, 1000, false],
    ["002", "2026-04-03", 101, 999, false],
    ["003", "2026-04-04", 102, 998, false],
    ["004", "2026-04-05", 103, 1000, false],
    ["005", "2026-04-06", 104, 1002, false],
    ["006", "2026-04-07", 105, 1000, true],
    ["007", "2026-04-08", 106, 1004, false],
    ["008", "2026-04-09", 107, 1040, false],
    ["009", "2026-04-10", 108, 1080, false],
    ["010", "2026-04-11", 109, 1100, false],
    ["010", "2026-04-12", 109, 1100, false],
    ["010", "2026-04-13", 114, 1100, false],
    ["010", "2026-04-14", 118, 1100, false],
    ["010", "2026-04-15", 125, 1100, false],
    ["010", "2026-04-16", 136, 1100, false],
    ["010", "2026-04-17", 170, 1100, false],
    ["010", "2026-04-18", 145, 1100, false],
    ["010", "2026-04-19", 147, 1100, false],
    ["010", "2026-04-20", 140, 1100, false],
    ["010", "2026-04-21", 138, 1100, false],
    ["010", "2026-04-22", 138, 1100, false],
    ["010", "2026-04-23", 120, 1100, false],
  ],
  { id: 0, date: 1, price: 2, volume: 3, edited: 4 },
);

const useContextMenu = (): TableContextMenuDef => {
  const menuBuilder: MenuBuilder<ChartMenuLocation, ChartContextMenuOptions> =
    useCallback((_location, options) => {
      return [{ id: "cell-copy", label: "Copy text", options }];
    }, []);

  const menuActionHandler = useCallback<
    MenuActionHandler<string, ChartContextMenuOptions>
  >((menuItemId, options) => {
    if (options) {
      switch (menuItemId) {
        case "cell-copy": {
          console.log("lets do it");
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
  const [series, setSeries] = useState(["price", "volume"]);
  const dataSource = useMemo(() => {
    return new TickingArrayDataSource({
      columnDescriptors: ChartTableSchema.columns,
      table,
    });
  }, []);

  const { menuBuilder, menuActionHandler } = useContextMenu();

  const itemColorFunction = useCallback<ItemColorFunction>((params) => {
    if (params.data.row.at(-1) === true) {
      return "red";
    }
    return params.color;
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ flex: "0 0 32px" }}>
        <Button onClick={() => setSeries(["price"])}>Price Only</Button>
        <Button onClick={() => setSeries(["volume"])}>Volume Only</Button>
        <Button onClick={() => setSeries(["price", "volume"])}>
          Price and Volume
        </Button>
      </div>
      <div style={{ width: 800, height: 600 }}>
        <ContextMenuProvider
          menuActionHandler={menuActionHandler}
          menuBuilder={menuBuilder}
        >
          <Chart
            categoryColumnName="date"
            chartSettings={{ useCoarsePointer: true, renderer: "svg" }}
            dataSource={dataSource}
            itemColorFunction={itemColorFunction}
            seriesColumnNames={series}
          />
        </ContextMenuProvider>
      </div>
    </div>
  );
};
