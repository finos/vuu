import { RpcResponseHandler, useVuuTables } from "@finos/vuu-data-react";
import { hasAction, MenuRpcResponse, TableSchema } from "@finos/vuu-data";
import { useCallback } from "react";
import { getFormConfig } from "./session-editing";
import { Feature, SessionEditingForm } from "packages/vuu-shell/src";
import { VuuTable } from "@finos/vuu-protocol-types";
import { SetDialog } from "@finos/vuu-popups";

const withTable = (action: unknown): action is { table: VuuTable } =>
  action !== null && typeof action === "object" && "table" in action;

const vuuFilterTableFeatureUrl = "./feature-filter-table/index.js";

export const useRpcResponseHandler = (setDialogState: SetDialog) => {
  const tables = useVuuTables();

  const handleClose = useCallback(() => {
    setDialogState(undefined);
  }, [setDialogState]);

  const handleRpcResponse = useCallback<RpcResponseHandler>(
    (response) => {
      if (
        hasAction(response) &&
        typeof response.action === "object" &&
        response.action !== null &&
        "type" in response.action &&
        response.action?.type === "OPEN_DIALOG_ACTION"
      ) {
        const { tableSchema } = response.action as unknown as {
          tableSchema: TableSchema;
        };
        if (tableSchema) {
          const formConfig = getFormConfig(response as MenuRpcResponse);
          //   dialogTitleRef.current = formConfig.config.title;
          setDialogState({
            content: (
              <SessionEditingForm {...formConfig} onClose={handleClose} />
            ),
            title: "Set Parameters",
          });
        } else if (
          withTable(response.action) &&
          tables &&
          response.action.table
        ) {
          const schema = tables.get(response.action.table.table);
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
          }
        }
      } else {
        console.warn(`App, handleServiceRequest ${JSON.stringify(response)}`);
      }
    },
    [handleClose, setDialogState, tables]
  );

  return {
    handleRpcResponse,
  };
};
