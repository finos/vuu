import { useVuuTables } from "@vuu-ui/vuu-data-react";
import { RpcResponseHandler } from "@vuu-ui/vuu-data-types";
import { useDialog } from "@vuu-ui/vuu-popups";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { Feature } from "@vuu-ui/vuu-shell";
import { isActionMessage, isSameTable } from "@vuu-ui/vuu-utils";
import { useCallback } from "react";

const withTable = (action: unknown): action is { table: VuuTable } =>
  action !== null && typeof action === "object" && "table" in action;

const vuuFilterTableFeatureUrl = "../feature-filter-table/index.js";

export const useRpcResponseHandler = () => {
  const tableSchemas = useVuuTables();
  const { setDialogState } = useDialog();

  const handleRpcResponse = useCallback<RpcResponseHandler>(
    (rpcResponse) => {
      if (
        isActionMessage(rpcResponse) &&
        typeof rpcResponse.action === "object" &&
        rpcResponse.action !== null &&
        "type" in rpcResponse.action &&
        rpcResponse.action?.type === "OPEN_DIALOG_ACTION"
      ) {
        if (
          withTable(rpcResponse.action) &&
          tableSchemas &&
          rpcResponse.action.table
        ) {
          const { table } = rpcResponse.action;
          const schema = tableSchemas.find((tableSchema) =>
            isSameTable(tableSchema.table, table),
          );
          if (schema) {
            // If we already have this table open in this viewport, ignore
            setDialogState({
              content: (
                <Feature
                  height={400}
                  ComponentProps={{ tableSchema: schema }}
                  url={vuuFilterTableFeatureUrl}
                  width={700}
                />
              ),
              title: "",
            });
            return true;
          }
        }
      }
      return false;
    },
    [setDialogState, tableSchemas],
  );

  return {
    handleRpcResponse,
  };
};
