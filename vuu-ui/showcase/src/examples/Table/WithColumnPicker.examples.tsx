import { getSchema } from "@vuu-ui/vuu-data-test";
import { TableSchema } from "@vuu-ui/vuu-data-types";
import { FlexboxLayout } from "@vuu-ui/vuu-layout";
import { ContextPanel, ContextPanelProps } from "@vuu-ui/vuu-shell";
import { Table } from "@vuu-ui/vuu-table";
import {
  ColumnModel,
  ColumnPicker,
  ColumnsChangeHandler,
  DataSourceStats,
} from "@vuu-ui/vuu-table-extras";
import {
  ColumnChangeSource,
  isColumnAdded,
  isColumnRemoved,
} from "@vuu-ui/vuu-table-extras/src/column-picker/ColumnModel";
import {
  ColumnDescriptor,
  TableConfig,
  TableConfigChangeHandler,
} from "@vuu-ui/vuu-table-types";
import {
  ContextPanelProvider,
  IconButton,
  ShowContextPanel,
  useContextPanel,
} from "@vuu-ui/vuu-ui-controls";
import { toColumnName, useData, VuuShellLocation } from "@vuu-ui/vuu-utils";
import {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const WithFooterAndColumnPickerTemplate = ({
  ContextPanelProps,
  schema = getSchema("TwoHundredColumns"),
  selectedColumns = schema.columns.slice(0, 10),
}: {
  ContextPanelProps?: ContextPanelProps;
  schema?: TableSchema;
  selectedColumns?: ColumnDescriptor[];
}) => {
  const { VuuDataSource } = useData();
  const showContextPanel = useContextPanel();

  const [initialTableConfig, columnModel] = useMemo<
    [TableConfig, ColumnModel]
  >(() => {
    return [
      {
        columns: selectedColumns,
        rowSeparators: true,
        zebraStripes: true,
      },
      new ColumnModel(schema.columns, selectedColumns),
    ];
  }, [schema, selectedColumns]);

  const [tableConfig, setTableConfig] = useState(initialTableConfig);

  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: initialTableConfig.columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource, schema, initialTableConfig],
  );

  const handleChangeSelectedColumns = useCallback<ColumnsChangeHandler>(
    (columns, source, changeDescriptor) => {
      if (source === ColumnChangeSource.ColumnPicker) {
        if (isColumnAdded(changeDescriptor)) {
          dataSource.columns = dataSource.columns.concat(
            changeDescriptor.column.name,
          );
        } else if (isColumnRemoved(changeDescriptor)) {
          dataSource.columns = dataSource.columns.filter(
            (col) => col !== changeDescriptor.column.name,
          );
        }
        setTableConfig((config) => ({
          ...config,
          columns,
        }));
      }
    },
    [dataSource],
  );

  const handleTableConfigChange = useCallback<TableConfigChangeHandler>(
    (config, configChangeType) => {
      console.log(`Table config changed`, { config });
      if (configChangeType?.type === "column-removed") {
        columnModel.removeItemFromSelectedColumns(
          configChangeType.column.name,
          ColumnChangeSource.Table,
        );
      }
    },
    [columnModel],
  );

  useEffect(() => {
    columnModel.on("change", handleChangeSelectedColumns);
  }, [columnModel, handleChangeSelectedColumns]);

  const toggleColumnPicker = useCallback(() => {
    showContextPanel(
      <ColumnPicker columnModel={columnModel} style={{ height: "100%" }} />,
      "Column Picker",
    );
  }, [columnModel, showContextPanel]);

  return (
    <FlexboxLayout style={{ height: 645, width: "100%" }}>
      <div
        className="container"
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        <div className="table-container" style={{ flex: 1 }}>
          <Table
            config={tableConfig}
            dataSource={dataSource}
            onConfigChange={handleTableConfigChange}
            renderBufferSize={30}
            width="100%"
          />
        </div>
        <div className="table-footer" style={{ height: 40 }}>
          <DataSourceStats
            dataSource={dataSource}
            tooltrayActions={
              <IconButton icon="settings" onClick={toggleColumnPicker} />
            }
          />
        </div>
      </div>

      <ContextPanel
        {...ContextPanelProps}
        id={VuuShellLocation.ContextPanel}
        overlay
      />
    </FlexboxLayout>
  );
};

export const TwoHundredColumns = () => {
  const [contextPanelProps, setContextPanelProps] = useState<
    ContextPanelProps | undefined
  >(undefined);

  const showContextPanel = useCallback<ShowContextPanel>((content, title) => {
    if (isValidElement(content)) {
      setContextPanelProps({ content, expanded: true, title });
    }
  }, []);

  const hideContextPanel = () => {
    setContextPanelProps(undefined);
  };

  return (
    <ContextPanelProvider
      hideContextPanel={hideContextPanel}
      showContextPanel={showContextPanel}
    >
      <WithFooterAndColumnPickerTemplate
        ContextPanelProps={contextPanelProps}
      />
    </ContextPanelProvider>
  );
};

/** tags=data-consumer */
export const ParentOrders = () => {
  const [contextPanelProps, setContextPanelProps] = useState<
    ContextPanelProps | undefined
  >(undefined);

  const showContextPanel = useCallback<ShowContextPanel>((content, title) => {
    if (isValidElement(content)) {
      setContextPanelProps({ content, expanded: true, title });
    }
  }, []);

  const hideContextPanel = () => {
    setContextPanelProps(undefined);
  };

  const selectedColumns = useMemo<ColumnDescriptor[]>(
    () => [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "ccy", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
    ],
    [],
  );

  return (
    <ContextPanelProvider
      hideContextPanel={hideContextPanel}
      showContextPanel={showContextPanel}
    >
      <WithFooterAndColumnPickerTemplate
        ContextPanelProps={contextPanelProps}
        schema={getSchema("parentOrders")}
        selectedColumns={selectedColumns}
      />
    </ContextPanelProvider>
  );
};
