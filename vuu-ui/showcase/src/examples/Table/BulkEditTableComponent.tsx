import { useVuuMenuActions } from "@finos/vuu-data-react";
import { getSchema, SimulTableName, vuuModule } from "@finos/vuu-data-test";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { Table, TableProps } from "@finos/vuu-table";
import type { DefaultColumnConfiguration } from "@finos/vuu-table-types";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import "./BuySellRowClassNameGenerator";
import { DemoTableContainer } from "./DemoTableContainer";

export const BulkEditTableComponent = ({
  getDefaultColumnConfig,
  height = 625,
  renderBufferSize = 0,
  rowClassNameGenerators,
  tableName = "instruments",
  ...props
}: Partial<TableProps> & {
  getDefaultColumnConfig?: DefaultColumnConfiguration;
  rowClassNameGenerators?: string[];
  tableName: SimulTableName;
}) => {
  const schema = getSchema(tableName);

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columns: applyDefaultColumnConfig(schema, getDefaultColumnConfig),
        rowClassNameGenerators,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource:
        vuuModule<SimulTableName>("SIMUL").createDataSource(tableName),
    }),
    [getDefaultColumnConfig, rowClassNameGenerators, schema, tableName]
  );

  const handleConfigChange = useCallback(() => {
    // console.log(JSON.stringify(config, null, 2));
  }, []);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
  });

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildViewserverMenuOptions}
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
  );
};
