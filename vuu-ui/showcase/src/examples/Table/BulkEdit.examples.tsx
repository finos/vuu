import { useVuuMenuActions } from "@finos/vuu-data-react";
import {
  getSchema,
  simulModule,
  SimulTableName,
  vuuModule,
} from "@finos/vuu-data-test";
import { ContextMenuProvider, useDialog } from "@finos/vuu-popups";
import { BulkEditPanel, Table, TableProps } from "@finos/vuu-table";
import type {
  ColumnDescriptor,
  DefaultColumnConfiguration,
} from "@finos/vuu-table-types";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { useCallback, useMemo } from "react";
import "./BuySellRowClassNameGenerator";
import { DemoTableContainer } from "./DemoTableContainer";

let displaySequence = 1;

const getDefaultColumnConfigSession = (
  tableName: string,
  columnName: string
): Partial<ColumnDescriptor> | undefined => {
  switch (columnName) {
    case "currency":
      return {
        editable: true,
        type: {
          name: "string",
          renderer: {
            name: "dropdown-cell",
            values: ["CAD", "EUR", "GBP", "GBX", "USD"],
          },
        },
      };
    case "description":
      return {
        editable: true,
        type: {
          name: "string",
          renderer: {
            name: "input-cell",
          },
        },
      };
    case "exchange":
      return {
        editable: true,
        type: {
          name: "string",
          renderer: {
            name: "input-cell",
          },
        },
      };

    case "isin":
      return {
        editable: true,
        type: {
          name: "string",
          renderer: {
            name: "input-cell",
          },
        },
      };
    case "lotSize":
      return {
        editable: true,
        type: {
          name: "number",
          renderer: {
            name: "input-cell",
          },
        },
      };
  }
};

export const BulkEditTable = ({
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

  const { dialog, setDialogState } = useDialog();

  const handleCancel = () => {
    setDialogState(undefined);
  };

  const handleSubmit = useCallback(() => {
    tableProps.dataSource.rpcCall?.({
      namedParams: {},
      params: ["1"],
      rpcName: "APPLY_BULK_EDITS",
      type: "VIEW_PORT_RPC_CALL",
    });
    setDialogState(undefined);
  }, [setDialogState, tableProps.dataSource]);

  const handleEditMultiple = useCallback(() => {
    tableProps.dataSource.rpcCall?.({
      namedParams: {},
      params: ["1"],
      rpcName: "APPLY_EDIT_MULTIPLE",
      type: "VIEW_PORT_RPC_CALL",
    });
    setDialogState(undefined);
  }, [setDialogState, tableProps.dataSource]);

  const rpcResponseHandler = (response: any) => {
    const ds = simulModule.createDataSource(response.action.table.table);
    const tableConfig = {
      columns: applyDefaultColumnConfig(schema, getDefaultColumnConfigSession),
      rowSeparators: true,
      zebraStripes: true,
    };

    // console.log(ds);
    // const buildColDescriptor = (schema: Readonly<TableSchema>)=> {
    //   return Object.values(schema.columns).reduce<ColumnDescriptor>(
    //     (map, col, index) => ({
    //       ...map,
    //       [index]: col
    //     }),
    //     {name:'ColumnDescriptor'}
    //   );
    // }
    // console.log(buildColDescriptor(schemas.instruments));
    //  const inputColMap = buildDataColumnMap(schemas, 'instruments');
    //  console.log(inputColMap);
    // const inputColDescriptor: RuntimeColumnDescriptor[] = {
    //   label: 'Input Row',
    //   width: 200,
    //   valueFormatter: getValueFormatter(buildColDescriptor(schemas.instruments), 'string'),
    // }
    if (response.rpcName === "BULK_EDIT") {
      const content = {
        content: (
          <BulkEditPanel
            tableConfig={tableConfig}
            dataSource={ds}
            onCancel={handleCancel}
            onEditMultiple={handleEditMultiple}
            onSubmit={handleSubmit}
          />
        ),
        title: "Edit Instruments",
      };
      setDialogState(content);
    }
    return true;
  };

  const { buildViewserverMenuOptions, handleMenuAction } = useVuuMenuActions({
    dataSource: tableProps.dataSource,
    onRpcResponse: rpcResponseHandler,
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
            renderBufferSize={renderBufferSize}
            {...props}
          />
        </DemoTableContainer>
      </ContextMenuProvider>
      {dialog}
    </>
  );
};
BulkEditTable.displaySequence = displaySequence++;
