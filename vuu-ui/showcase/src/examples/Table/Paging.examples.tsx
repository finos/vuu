import { useVuuMenuActions } from "@finos/vuu-data-react";
import {
  SimulTableName,
  simulModule,
  simulSchemas,
} from "@finos/vuu-data-test";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { Table, TableProps } from "@finos/vuu-table";
import { ColumnLayout } from "@finos/vuu-table-types";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import { DemoTableContainer } from "./DemoTableContainer";
import { VuuDataSource } from "@finos/vuu-data-remote";
import { useAutoLoginToVuuServer } from "../utils";

const SimulTable = ({
  columnLayout,
  height = "100%",
  rowClassNameGenerators,
  tableName = "instruments",
  ...props
}: Partial<TableProps> & {
  columnLayout?: ColumnLayout;
  rowClassNameGenerators?: string[];
  tableName?: SimulTableName;
}) => {
  const schema = simulSchemas[tableName];

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columnLayout,
        columns: applyDefaultColumnConfig(schema),
        rowClassNameGenerators,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource: simulModule.createDataSource(tableName),
    }),
    [columnLayout, rowClassNameGenerators, schema, tableName],
  );

  const handleConfigChange = useCallback(() => {
    // console.log(JSON.stringify(config, null, 2));
  }, []);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
  });

  return (
    <>
      <ContextMenuProvider
        menuActionHandler={handleMenuAction}
        menuBuilder={buildViewserverMenuOptions}
      >
        <DemoTableContainer>
          <Table
            {...tableProps}
            height={height}
            onConfigChange={handleConfigChange}
            showPaginationControls
            {...props}
          />
        </DemoTableContainer>
      </ContextMenuProvider>
    </>
  );
};

const VuuTable = ({
  columnLayout,
  height = "100%",
  rowClassNameGenerators,
  tableName = "instruments",
  ...props
}: Partial<TableProps> & {
  columnLayout?: ColumnLayout;
  rowClassNameGenerators?: string[];
  tableName?: SimulTableName;
}) => {
  const schema = simulSchemas[tableName];

  useAutoLoginToVuuServer({ authenticate: false, secure: false });

  const tableProps = useMemo<Pick<TableProps, "config" | "dataSource">>(
    () => ({
      config: {
        columnLayout,
        columns: applyDefaultColumnConfig(schema),
        lineNumbers: true,
        rowClassNameGenerators,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource: new VuuDataSource({
        columns: schema.columns.map((col) => col.name),
        table: { module: "SIMUL", table: tableName },
      }),
      // viewportRowLimit: 20,
    }),
    [columnLayout, rowClassNameGenerators, schema, tableName],
  );

  const handleConfigChange = useCallback(() => {
    // console.log(JSON.stringify(config, null, 2));
  }, []);

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
  });

  return (
    <>
      <ContextMenuProvider
        menuActionHandler={handleMenuAction}
        menuBuilder={buildViewserverMenuOptions}
      >
        <DemoTableContainer>
          <Table
            {...tableProps}
            height={height}
            onConfigChange={handleConfigChange}
            showPaginationControls
            {...props}
          />
        </DemoTableContainer>
      </ContextMenuProvider>
    </>
  );
};

export const WithArrayDataSource = () => (
  <SimulTable columnLayout="fit" tableName="instruments" />
);

export const WithVuuDataSource = () => (
  <VuuTable columnLayout="fit" tableName="instruments" />
);
