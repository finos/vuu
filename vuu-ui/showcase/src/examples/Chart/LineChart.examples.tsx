import {
  Chart,
  ChartConfig,
  ChartContextMenuOptions,
  ChartMenuLocation,
  ChartProps,
  DataExclusionOptions,
} from "@vuu-ui/vuu-chart";
import { getSchema, LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import {
  ContextMenuProvider,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import { TableContextMenuDef } from "@vuu-ui/vuu-table-types";
import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import { useData } from "@vuu-ui/vuu-utils";
import { toColumnName } from "@vuu-ui/vuu-utils";
import {
  DataEditingProvider,
  EditButtons,
  type EditMode,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import { TableFooter, TableFooterTray } from "@vuu-ui/vuu-table-extras";

const useContextMenu = ({
  enabled = true,
  onExcludeItem,
  onIncludeItem,
}: {
  enabled?: boolean;
  onExcludeItem: (options: ChartContextMenuOptions) => void;
  onIncludeItem: (options: ChartContextMenuOptions) => void;
}): TableContextMenuDef => {
  const menuBuilder: MenuBuilder<ChartMenuLocation, ChartContextMenuOptions> =
    useCallback((_location, options) => {
      if (!enabled) {
        return [];
      }
      const { column, columnMap, row } = options;
      const isExcluded = row[columnMap[`${column}_excluded`]] === true;
      if (isExcluded) {
        return [{ id: "include", label: "Include Item", options }];
      } else {
        return [{ id: "exclude", label: "Exclude Item", options }];
      }
    }, [enabled]);

  const menuActionHandler = useCallback<
    MenuActionHandler<string, ChartContextMenuOptions>
  >(
    (menuItemId, options) => {
      if (options) {
        switch (menuItemId) {
          case "exclude": {
            onExcludeItem(options);
            return true;
          }
          case "include": {
            onIncludeItem(options);
            return true;
          }

          default:
            return false;
        }
      } else {
        return false;
      }
    },
    [onExcludeItem, onIncludeItem],
  );

  return {
    menuBuilder,
    menuActionHandler,
  };
};

const LineChartTemplate = ({
  config: configProp,
  dataExclusions,
  dataSource: dataSourceProp,
}: Partial<ChartProps>) => {
  const [series, setSeries] = useState(["price", "volume"]);
  const [symbolSize, setSymbolSize] = useState(6);
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    if (dataSourceProp) {
      return dataSourceProp;
    }
    const schema = getSchema("ChartTable");
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource, dataSourceProp]);

  const config = useMemo<ChartConfig>(() => {
    return {
      ...configProp,
      itemColorFunction:
        configProp?.itemColorFunction ??
        (({ data, color }) => (data.row.at(-1) === true ? "red" : color)),
      symbolSize: configProp?.symbolSize ?? symbolSize,
    };
  }, [configProp, symbolSize]);

  const onChangeSymbolSize = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      const button = evt.target as HTMLButtonElement;
      const value = parseInt(button.value);
      setSymbolSize(value);
    },
    [],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flex: "0 0 32px",
          gap: 12,
          padding: "0px 6px",
        }}
      >
        <Button onClick={() => setSeries(["price"])}>Price Only</Button>
        <Button onClick={() => setSeries(["volume"])}>Volume Only</Button>
        <Button onClick={() => setSeries(["price", "volume"])}>
          Price and Volume
        </Button>
        <ToggleButtonGroup onChange={onChangeSymbolSize} value={symbolSize}>
          <ToggleButton value={5}>5</ToggleButton>
          <ToggleButton value={6}>6</ToggleButton>
          <ToggleButton value={7}>7</ToggleButton>
          <ToggleButton value={10}>10</ToggleButton>
          <ToggleButton value={15}>15</ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div style={{ width: 800, height: 600 }}>
        <Chart
          categoryColumnName="date"
          chartSettings={{ useCoarsePointer: true, renderer: "svg" }}
          dataExclusions={dataExclusions}
          dataSource={dataSource}
          config={config}
          seriesColumnNames={series}
        />
      </div>
    </div>
  );
};

export const SimpleLineChart = () => (
  <LocalDataSourceProvider>
    <LineChartTemplate />
  </LocalDataSourceProvider>
);

export const DataExclusions = () => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema("ChartTable");
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  const onExcludeItem = useCallback(
    async (options: ChartContextMenuOptions) => {
      const key = options.row[6];
      const resp = dataSource.editCell?.(
        key,
        `${options.column}_excluded`,
        true,
      );
      console.log({ resp });
    },
    [dataSource],
  );
  const onIncludeItem = useCallback(
    async (options: ChartContextMenuOptions) => {
      const key = options.row[6];
      const resp = dataSource.editCell?.(
        key,
        `${options.column}_excluded`,
        false,
      );
      console.log({ resp });
    },
    [dataSource],
  );

  const dataExclusionOptions = useMemo<DataExclusionOptions>(
    () => ({
      isExcludedData: (row, columnMap, column) =>
        row[columnMap[`${column}_excluded`]] === true,
      symbol:
        "path://M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20M9 9l6 6M15 9l-6 6",
    }),
    [],
  );

  const { menuBuilder, menuActionHandler } = useContextMenu({
    onExcludeItem,
    onIncludeItem,
  });

  return (
    <LocalDataSourceProvider>
      <ContextMenuProvider
        menuActionHandler={menuActionHandler}
        menuBuilder={menuBuilder}
      >
        <LineChartTemplate
          config={{ selectionModel: "single" }}
          dataExclusions={dataExclusionOptions}
          dataSource={dataSource}
        />
      </ContextMenuProvider>
    </LocalDataSourceProvider>
  );
};

export const EditableChart = () => {
  const { VuuDataSource } = useData();
  const [editMode, setEditMode] = useState<EditMode>("view");
  const sourceDataSource = useMemo(() => {
    const schema = getSchema("ChartTable");
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  const exitEditMode = useCallback(() => setEditMode("view"), []);
  const {
    canCancel,
    canSave,
    dataSource,
    editSession,
    isEditSessionReady,
    onCancel,
    onSave,
  } = useEditableTable({
    dataSource: sourceDataSource,
    isEditMode: editMode === "edit",
    onCancel: exitEditMode,
    onSave: exitEditMode,
  });

  const onToggleEditMode = useCallback(
    (event: SyntheticEvent<HTMLButtonElement>) => {
      setEditMode((event.target as HTMLButtonElement).value as EditMode);
    },
    [],
  );

  const onExcludeItem = useCallback(
    async (options: ChartContextMenuOptions) => {
      const key = options.row[6];
      const columnName = `${options.column}_excluded`;
      await editSession.commit(
        key,
        columnName,
        options.row[options.columnMap[columnName]],
        true,
        true,
      );
    },
    [editSession],
  );
  const onIncludeItem = useCallback(
    async (options: ChartContextMenuOptions) => {
      const key = options.row[6];
      const columnName = `${options.column}_excluded`;
      await editSession.commit(
        key,
        columnName,
        options.row[options.columnMap[columnName]],
        false,
        true,
      );
    },
    [editSession],
  );
  const { menuBuilder, menuActionHandler } = useContextMenu({
    enabled: editMode === "edit",
    onExcludeItem,
    onIncludeItem,
  });
  const dataExclusionOptions = useMemo<DataExclusionOptions>(
    () => ({
      isExcludedData: (row, columnMap, column) =>
        row[columnMap[`${column}_excluded`]] === true,
      symbol:
        "path://M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M9 9l6 6M15 9l-6 6",
    }),
    [],
  );

  return (
    <LocalDataSourceProvider>
      <ContextMenuProvider
        menuActionHandler={menuActionHandler}
        menuBuilder={menuBuilder}
      >
        <DataEditingProvider editSession={editSession}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: 680,
              width: 800,
            }}
          >
            <div
              style={{
                alignItems: "center",
                display: "flex",
                flex: "0 0 32px",
                padding: "0 6px",
              }}
            >
              <ToggleButtonGroup
                onChange={onToggleEditMode}
                value={editMode}
              >
                <ToggleButton value="view">View</ToggleButton>
                <ToggleButton value="edit">Edit</ToggleButton>
              </ToggleButtonGroup>
            </div>
            <div style={{ flex: "1 1 auto", minHeight: 0 }}>
              <Chart
                categoryColumnName="date"
                chartSettings={{ useCoarsePointer: true, renderer: "svg" }}
                dataExclusions={dataExclusionOptions}
                dataSource={dataSource}
                config={{ selectionModel: "single" }}
                seriesColumnNames={["price", "volume"]}
              />
            </div>
            <TableFooter
              style={{
                flex: isEditSessionReady ? "0 0 32px" : "0 0 0",
                height: editMode === "edit" ? 32 : 0,
                overflow: "hidden",
                transition: "flex-basis 200ms ease",
              }}
            >
              {isEditSessionReady ? (
                <TableFooterTray position="center">
                  <EditButtons
                    canCancel={canCancel}
                    canSave={canSave}
                    editSession={editSession}
                    onCancel={onCancel}
                    onSave={onSave}
                  />
                </TableFooterTray>
              ) : null}
            </TableFooter>
          </div>
        </DataEditingProvider>
      </ContextMenuProvider>
    </LocalDataSourceProvider>
  );
};
