import {
  Chart,
  ChartConfig,
  ChartContextMenuOptions,
  ChartMenuLocation,
  ChartProps,
  DataExclusionOptions,
} from "@vuu-ui/vuu-chart";
import {
  CHART_VARIANT_PREFIXES,
  CHART_VARIANT_SUFFIXES,
  getSchema,
  LocalDataSourceProvider,
} from "@vuu-ui/vuu-data-test";
import { SyntheticEvent, useCallback, useMemo, useState } from "react";
import {
  ContextMenuProvider,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import type {
  TableCellRendererProps,
  TableConfig,
  TableContextMenuDef,
} from "@vuu-ui/vuu-table-types";
import { Table } from "@vuu-ui/vuu-table";
import cx from "clsx";
import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import {
  metadataKeys,
  registerComponent,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import {
  DataEditingProvider,
  EditButtons,
  type EditMode,
  useEditableTable,
  useEditSession,
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
              height: "100%",
              maxHeight: 680,
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

const seriesCounts = [5, 10, 20, 30, 50];

const SwitchSeriesColumnsTemplate = () => {
  const [suffix, setSuffix] = useState(CHART_VARIANT_SUFFIXES[0]);
  const [seriesCount, setSeriesCount] = useState(seriesCounts[0]);
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema("ChartVariantTable");
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  const config = useMemo<ChartConfig>(() => ({}), []);

  const seriesColumnNames = useMemo(
    () =>
      CHART_VARIANT_PREFIXES.slice(0, seriesCount).map(
        (prefix) => `${prefix}_${suffix}`,
      ),
    [seriesCount, suffix],
  );

  const onChangeSuffix = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      setSuffix((evt.currentTarget as HTMLButtonElement).value);
    },
    [],
  );

  const onChangeSeriesCount = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      setSeriesCount(parseInt((evt.currentTarget as HTMLButtonElement).value));
    },
    [],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, padding: "0px 6px" }}>
        <ToggleButtonGroup onChange={onChangeSuffix} value={suffix}>
          {CHART_VARIANT_SUFFIXES.map((value) => (
            <ToggleButton key={value} value={value}>
              {value}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <ToggleButtonGroup
          aria-label="Number of series"
          onChange={onChangeSeriesCount}
          value={String(seriesCount)}
        >
          {seriesCounts.map((count) => (
            <ToggleButton key={count} value={String(count)}>
              {`${count} series`}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <div style={{ width: 800, height: 600 }}>
        <Chart
          categoryColumnName="date"
          chartSettings={{ useCoarsePointer: true, renderer: "svg" }}
          config={config}
          dataSource={dataSource}
          seriesColumnNames={seriesColumnNames}
        />
      </div>
    </div>
  );
};

/**
 * The user switches between charting the <prefix>_set_a, <prefix>_set_b and
 * <prefix>_set_c columns, and chooses how many series to chart. Each prefix
 * keeps its colour across the switch.
 */
export const SwitchSeriesColumns = () => (
  <LocalDataSourceProvider>
    <SwitchSeriesColumnsTemplate />
  </LocalDataSourceProvider>
);

const excludedColumnName = (column: string) => `${column}_excluded`;

/**
 * Renders a value that can be excluded. In an edit session, a click
 * toggles the companion <column>_excluded value.
 */
const ExcludableCell = ({ column, dataRow }: TableCellRendererProps) => {
  const editSession = useEditSession();
  const { name, valueFormatter } = column;
  const excludedColumn = excludedColumnName(name);
  const isExcluded = dataRow[excludedColumn] === true;

  const handleClick = useCallback(() => {
    if (editSession?.canCancel) {
      void editSession.commit(
        dataRow.key,
        excludedColumn,
        isExcluded,
        !isExcluded,
        true,
      );
    }
  }, [dataRow.key, editSession, excludedColumn, isExcluded]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: showcase example, the table handles keyboard navigation
    <span
      className={cx("ExcludableCell", {
        "ExcludableCell-excluded": isExcluded,
      })}
      data-excluded={isExcluded}
      onClick={handleClick}
    >
      {valueFormatter(dataRow[name])}
    </span>
  );
};

registerComponent("example.excludable-cell", ExcludableCell, "cell-renderer");

type DataView = "chart" | "table";

const excludableSeriesColumns = ["price", "volume"];

const EditableChartAndTableTemplate = () => {
  const { VuuDataSource } = useData();
  const [dataView, setDataView] = useState<DataView>("table");
  const [editMode, setEditMode] = useState<EditMode>("view");
  const sourceDataSource = useMemo(() => {
    const schema = getSchema("ChartTable");
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  const exitEditMode = useCallback(() => setEditMode("view"), []);
  // One edit session, and so one session DataSource, is shared by both
  // views. Only one view is mounted at a time. The mounted view resumes
  // the DataSource with its own range and suspends it when unmounted.
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

  const onChangeDataView = useCallback(
    (event: SyntheticEvent<HTMLButtonElement>) => {
      setDataView((event.currentTarget as HTMLButtonElement).value as DataView);
    },
    [],
  );
  const onToggleEditMode = useCallback(
    (event: SyntheticEvent<HTMLButtonElement>) => {
      setEditMode((event.currentTarget as HTMLButtonElement).value as EditMode);
    },
    [],
  );

  const setExcluded = useCallback(
    async (options: ChartContextMenuOptions, excluded: boolean) => {
      const { column, columnMap, row } = options;
      const columnName = excludedColumnName(column);
      await editSession.commit(
        row[metadataKeys.KEY] as string,
        columnName,
        row[columnMap[columnName]],
        excluded,
        true,
      );
    },
    [editSession],
  );
  const onExcludeItem = useCallback(
    (options: ChartContextMenuOptions) => setExcluded(options, true),
    [setExcluded],
  );
  const onIncludeItem = useCallback(
    (options: ChartContextMenuOptions) => setExcluded(options, false),
    [setExcluded],
  );
  const { menuBuilder, menuActionHandler } = useContextMenu({
    enabled: editMode === "edit",
    onExcludeItem,
    onIncludeItem,
  });
  const dataExclusionOptions = useMemo<DataExclusionOptions>(
    () => ({
      isExcludedData: (row, columnMap, column) =>
        row[columnMap[excludedColumnName(column)]] === true,
      symbol:
        "path://M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M9 9l6 6M15 9l-6 6",
    }),
    [],
  );

  const tableConfig = useMemo<TableConfig>(
    () => ({
      columns: getSchema("ChartTable").columns.map((column) =>
        excludableSeriesColumns.includes(column.name)
          ? {
              ...column,
              type: {
                name: "number",
                renderer: { name: "example.excludable-cell" },
              },
            }
          : { ...column, hidden: column.name !== "date" },
      ),
    }),
    [],
  );

  return (
    <ContextMenuProvider
      menuActionHandler={menuActionHandler}
      menuBuilder={menuBuilder}
    >
      <DataEditingProvider editSession={editSession}>
        <style>{`
          .EditableChartAndTable-edit .ExcludableCell {
            cursor: pointer;
          }
          .ExcludableCell-excluded {
            color: var(--salt-content-secondary-foreground);
            text-decoration: line-through;
          }
        `}</style>
        <div
          className={cx("EditableChartAndTable", {
            "EditableChartAndTable-edit": editMode === "edit",
          })}
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: 680,
            width: 800,
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              flex: "0 0 32px",
              gap: 12,
              padding: "0 6px",
            }}
          >
            <ToggleButtonGroup
              aria-label="Data view"
              onChange={onChangeDataView}
              value={dataView}
            >
              <ToggleButton value="table">Table</ToggleButton>
              <ToggleButton value="chart">Chart</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              aria-label="Edit mode"
              onChange={onToggleEditMode}
              value={editMode}
            >
              <ToggleButton value="view">View</ToggleButton>
              <ToggleButton value="edit">Edit</ToggleButton>
            </ToggleButtonGroup>
          </div>
          <div style={{ flex: "1 1 auto", minHeight: 0 }}>
            {dataView === "table" ? (
              <Table
                config={tableConfig}
                dataSource={dataSource}
                height="100%"
                renderBufferSize={10}
                width="100%"
              />
            ) : (
              <Chart
                categoryColumnName="date"
                chartSettings={{ useCoarsePointer: true, renderer: "svg" }}
                config={{ selectionModel: "single" }}
                dataExclusions={dataExclusionOptions}
                dataSource={dataSource}
                seriesColumnNames={excludableSeriesColumns}
              />
            )}
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
  );
};

/**
 * Table and Chart views of the same data share one edit session. The user
 * can switch views at any time, including mid edit, and exclude items in
 * either view: by clicking a value in the table, or from the context menu
 * of a data point in the chart.
 */
export const EditableChartAndTable = () => (
  <LocalDataSourceProvider>
    <EditableChartAndTableTemplate />
  </LocalDataSourceProvider>
);
