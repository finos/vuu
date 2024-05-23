import {
  SimulTableName,
  VuuModule,
  VuuTableName,
  getSchema,
  simulModule,
} from "@finos/vuu-data-test";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { useCallback } from "react";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { BulkEditPanelProps } from "./BulkEditPanel";

export interface RPCSimulResponse {
  action: {
    renderComponent: string;
    table: {
      module: VuuModule;
      table: string;
    };
  };
  type: "OPEN_DIALOG_ACTION";
}

const createSessionDatasource = (response: RPCSimulResponse) => {
  const ds = simulModule.createDataSource(
    response.action.table.table as SimulTableName
  );
  return ds;
};

const createSessionTableconfig = (tableName?: VuuTableName) => {
  const schema = getSchema(tableName ?? "instruments");
  const tableConfig = {
    columns: applyDefaultColumnConfig(schema, getDefaultColumnConfigSession),
    rowSeparators: true,
    zebraStripes: true,
  };
  return tableConfig;
};

export const useBulkEditPanel = (props: BulkEditPanelProps) => {
  const dsSession = createSessionDatasource(
    props.response as unknown as RPCSimulResponse
  );
  const tableConfig = createSessionTableconfig(props.mainTableName);
  const dataSource = props.dataSource;
  const setDialogClose = props.setDialogClose;

  const closeDialog = () => {
    // setDialogState(undefined);
    setDialogClose();
  };

  const handleSave = useCallback(() => {
    dataSource.rpcCall?.({
      namedParams: {},
      params: ["1"],
      rpcName: "SAVE_BULK_EDITS",
      type: "VIEW_PORT_RPC_CALL",
    });
    // setDialogState(undefined);
    setDialogClose();
  }, [dataSource, setDialogClose]);

  return {
    dsSession,
    tableConfig,
    closeDialog,
    handleSave,
  };
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
    case "askSize":
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
