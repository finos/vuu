import { useVuuMenuActions } from "@finos/vuu-data-react";
import {
  getSchema,
  simulModule,
  SimulTableName,
  vuuModule,
} from "@finos/vuu-data-test";
import { ContextMenuProvider, Dialog } from "@finos/vuu-popups";
import { Table, TableProps } from "@finos/vuu-table";
import type {
  ColumnDescriptor,
  DefaultColumnConfiguration,
} from "@finos/vuu-table-types";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { useCallback, useMemo, useState, ReactElement } from "react";
import { DemoTableContainer } from "./DemoTableContainer";
import "./BuySellRowClassNameGenerator";

import { Button } from "@salt-ds/core";
//import { BulkEditRow } from "@finos/vuu-table";

let displaySequence = 1;

const getDefaultColumnConfig = (
  tableName: string,
  columnName: string
): Partial<ColumnDescriptor> | undefined => {
  switch (columnName) {
    case "ask":
    case "bid":
      return {
        type: {
          name: "number",
          renderer: {
            name: "vuu.price-move-background",
            flashStyle: "arrow-bg",
          },
          formatting: { decimals: 2, zeroPad: true },
        },
      };
    case "askSize":
    case "bidSize":
      return {
        type: {
          name: "number",
          renderer: {
            name: "vuu.price-move-background",
            flashStyle: "bg-only",
          },
          formatting: { decimals: 0 },
        },
      };

    case "last":
    case "open":
    case "close":
      return {
        type: {
          name: "number",
          formatting: { decimals: 2, zeroPad: true },
        },
      };
    case "wishlist":
      return { editable: true };
  }
};

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

export type DialogState = {
  content: ReactElement;
  title: string;
  hideCloseButton?: boolean;
};

export const SimulTable = ({
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

  const [dialogState, setDialogState] = useState<DialogState>();

  const closeDialog = () => {
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
  }, []);

  const handleEditMultiple = useCallback(() => {
    tableProps.dataSource.rpcCall?.({
      namedParams: {},
      params: ["1"],
      rpcName: "APPLY_EDIT_MULTIPLE",
      type: "VIEW_PORT_RPC_CALL",
    });
    setDialogState(undefined);
  }, []);

  const rpcResponseHandler = (response: any) => {
    //console.log(response);
    const ds = simulModule.createDataSource(response.action.table.table);
    const tableConfig = {
      columns: applyDefaultColumnConfig(schema, getDefaultColumnConfigSession),
      rowSeparators: true,
      zebraStripes: true,
    };

    if (response.rpcName === "EDIT_ROW") {
      const content = {
        content: (
          <>
            <Table
              config={tableConfig}
              dataSource={ds}
              height={500}
              width={800}
            />
            <Button onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit</Button>
            <Button onClick={handleEditMultiple}>Edit Multiple</Button>
          </>
        ),
        title: "Edit",
      };
      setDialogState(content);
    }
    return true;
  };

  const dialog = dialogState ? (
    <Dialog
      className="vuuDialog"
      isOpen={true}
      onClose={closeDialog}
      style={{ maxHeight: 800 }}
      title="Edits"
    >
      {dialogState.content}
    </Dialog>
  ) : null;

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
SimulTable.displaySequence = displaySequence++;

export const InstrumentsExtended = () => (
  <SimulTable
    tableName="instrumentsExtended"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);
InstrumentsExtended.displaySequence = displaySequence++;

export const Prices = () => {
  return (
    <SimulTable
      tableName="prices"
      getDefaultColumnConfig={getDefaultColumnConfig}
    />
  );
};
Prices.displaySequence = displaySequence++;

const rowClassGenerators = ["buy-sell-rows"];

export const Orders = () => {
  return (
    <SimulTable
      tableName="orders"
      rowClassNameGenerators={rowClassGenerators}
    />
  );
};
Orders.displaySequence = displaySequence++;

export const InstrumentPrices = () => (
  <SimulTable
    tableName="instrumentPrices"
    getDefaultColumnConfig={getDefaultColumnConfig}
  />
);
InstrumentPrices.displaySequence = displaySequence++;
