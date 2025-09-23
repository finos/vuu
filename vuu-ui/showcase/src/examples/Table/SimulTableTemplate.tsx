import { ContextMenuProvider } from "@vuu-ui/vuu-context-menu";
import { useVuuMenuActions } from "@vuu-ui/vuu-data-react";
import { getSchema, SimulTableName } from "@vuu-ui/vuu-data-test";
import { Table, TableProps } from "@vuu-ui/vuu-table";
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
import { useCallback, useMemo } from "react";
import { DemoTableContainer } from "./DemoTableContainer";

export type SimulTableProps = Partial<TableProps> & {
  columnLayout?: ColumnLayout;
  columns?: ColumnDescriptor[];
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  rowClassNameGenerators?: string[];
  tableContextMenuHook?: () => TableContextMenuDef;
  tableName?: SimulTableName;
};

export const SimulTable = ({
  columnLayout,
  columns: columnsProp,
  dataSource: dataSourceProp,
  getDefaultColumnConfig,
  height = 625,
  renderBufferSize = 10,
  rowClassNameGenerators,
  tableContextMenuHook,
  tableName = "instruments",
  ...props
}: SimulTableProps) => {
  const { VuuDataSource } = useData();

  const useContextMenu = tableContextMenuHook ?? useVuuMenuActions;

  const tableSchema = getSchema(tableName);

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columnLayout,
        columns:
          columnsProp ??
          applyDefaultColumnConfig(tableSchema, getDefaultColumnConfig),
        rowClassNameGenerators,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        dataSourceProp ??
        new VuuDataSource({
          columns: tableSchema.columns.map(toColumnName),
          table: tableSchema.table,
        }),
    }),
    [
      columnLayout,
      columnsProp,
      tableSchema,
      getDefaultColumnConfig,
      rowClassNameGenerators,
      dataSourceProp,
      VuuDataSource,
    ],
  );

  const handleConfigChange = useCallback(() => {
    // console.log(JSON.stringify(config, null, 2));
  }, []);

  const { menuBuilder, menuActionHandler } = useContextMenu({
    dataSource: tableProps.dataSource,
  });

  return (
    <>
      <ContextMenuProvider
        menuActionHandler={menuActionHandler}
        menuBuilder={menuBuilder}
      >
        <DemoTableContainer>
          <Table
            {...tableProps}
            height={height}
            onConfigChange={handleConfigChange}
            renderBufferSize={renderBufferSize}
            {...props}
          />
        </DemoTableContainer>
      </ContextMenuProvider>
    </>
  );
};
