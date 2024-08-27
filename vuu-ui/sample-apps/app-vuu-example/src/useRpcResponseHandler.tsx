import { useVuuTables } from "@finos/vuu-data-react";
import { RpcResponseHandler } from "@finos/vuu-data-types";
import { useDialog } from "@finos/vuu-popups";
import { VuuTable } from "@finos/vuu-protocol-types";
import { Feature } from "@finos/vuu-shell";
import { isActionMessage } from "@finos/vuu-utils";
import { useCallback } from "react";

const withTable = (action: unknown): action is { table: VuuTable } =>
  action !== null && typeof action === "object" && "table" in action;

const vuuFilterTableFeatureUrl = "../feature-filter-table/index.js";

export const useRpcResponseHandler = () => {
  const tables = useVuuTables();
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
          tables &&
          rpcResponse.action.table
        ) {
          const schema = tables.get(rpcResponse.action.table.table);
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
    [setDialogState, tables],
  );

  return {
    handleRpcResponse,
  };
};
