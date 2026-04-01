import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { useVuuMenuActions } from "@vuu-ui/vuu-data-react";
import { getSchema, SimulTableName } from "@vuu-ui/vuu-data-test";
import { Table, TableProps, useTableConfig } from "@vuu-ui/vuu-table";
import {
  DataSourceStats,
  TableFooter,
  TabbedTableSettingsAction,
  TableFooterTray,
} from "@vuu-ui/vuu-table-extras";
import {
  ColumnDescriptor,
  ColumnLayout,
  DefaultColumnConfiguration,
  TableContextMenuDef,
} from "@vuu-ui/vuu-table-types";
import {
  applyDefaultColumnConfig,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { DemoTableContainer } from "./DemoTableContainer";
import { ModalProvider } from "@vuu-ui/vuu-ui-controls";

export type SimulTableProps = Partial<TableProps> & {
  autosubscribeColumns?: string[];
  columnLayout?: ColumnLayout;
  columns?: readonly ColumnDescriptor[];
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  rowClassNameGenerators?: string[];
  tableContextMenuHook?: () => TableContextMenuDef;
  tableName?: SimulTableName;
};

const SimulTableBase = ({
  EmptyDisplay,
  autosubscribeColumns,
  columnLayout,
  columns: columnsProp,
  dataSource: dataSourceProp,
  getDefaultColumnConfig,
  height,
  renderBufferSize = 10,
  rowClassNameGenerators,
  tableContextMenuHook,
  tableName = "instruments",
  ...props
}: SimulTableProps) => {
  const { VuuDataSource } = useData();

  const useContextMenu = tableContextMenuHook ?? useVuuMenuActions;

  const tableSchema = getSchema(tableName);

  const tableContainerStyle = { flex: "1 1 auto" };

  const initialTableConfig = useMemo(
    () => ({
      columnLayout,
      columns:
        columnsProp ??
        applyDefaultColumnConfig(tableSchema, getDefaultColumnConfig),
      rowClassNameGenerators,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [
      columnLayout,
      columnsProp,
      getDefaultColumnConfig,
      rowClassNameGenerators,
      tableSchema,
    ],
  );

  const dataSource = useMemo(
    () =>
      dataSourceProp ??
      new VuuDataSource({
        columns: tableSchema.columns.map(toColumnName),
        table: tableSchema.table,
      }),
    [VuuDataSource, dataSourceProp, tableSchema.columns, tableSchema.table],
  );

  const {
    tableConfig,
    columnModel,
    onTableDisplayAttributeChange,
    onTableConfigChange,
  } = useTableConfig({
    availableColumns: tableSchema.columns,
    config: initialTableConfig,
    dataSource,
  });

  const { menuBuilder, menuActionHandler } = useContextMenu({ dataSource });

  return (
    <ModalProvider>
      <ContextMenuProvider
        menuActionHandler={menuActionHandler}
        menuBuilder={menuBuilder}
      >
        <div className="DemoTableContainer-table" style={tableContainerStyle}>
          <Table
            EmptyDisplay={EmptyDisplay}
            config={tableConfig}
            dataSource={dataSource}
            height={height}
            onConfigChange={onTableConfigChange}
            renderBufferSize={renderBufferSize}
            {...props}
          />
        </div>
        <TableFooter>
          <DataSourceStats dataSource={dataSource} />
          <TableFooterTray>
            <TabbedTableSettingsAction
              allowCreateCalculatedColumn
              columnModel={columnModel}
              config={tableConfig}
              data-embedded
              onDisplayAttributeChange={onTableDisplayAttributeChange}
              vuuTable={tableSchema.table}
            />
          </TableFooterTray>
        </TableFooter>
      </ContextMenuProvider>
    </ModalProvider>
  );
};
export const SimulTable = (props: SimulTableProps) => {
  return (
    <>
      <DemoTableContainer>
        <SimulTableBase {...props} />
      </DemoTableContainer>
    </>
  );
};
