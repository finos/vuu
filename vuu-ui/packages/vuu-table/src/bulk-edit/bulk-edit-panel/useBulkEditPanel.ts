import {
  SimulTableName,
  VuuModule,
  VuuTableName,
  getSchema,
  simulModule,
} from "@finos/vuu-data-test";
import { applyDefaultColumnConfig } from "@finos/vuu-utils";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { BulkEditPanelHookProps } from "./BulkEditPanel";

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

export const useBulkEditPanel = (props: BulkEditPanelHookProps) => {
  const dsSession = createSessionDatasource(
    props.response as unknown as RPCSimulResponse
  );
  const tableConfig = createSessionTableconfig(props.mainTableName);

  return {
    dsSession,
    tableConfig,
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
