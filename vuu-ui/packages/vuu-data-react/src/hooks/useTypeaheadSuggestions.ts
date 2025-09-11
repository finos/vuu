import { SuggestionFetcher, TableSchemaTable } from "@vuu-ui/vuu-data-types";
import {
  TypeaheadParams,
  VuuRpcServiceRequest,
} from "@vuu-ui/vuu-protocol-types";
import { useDataSource } from "@vuu-ui/vuu-utils";
import { useCallback } from "react";

export const getTypeaheadParams = (
  table: TableSchemaTable,
  column: string,
  text = "",
  selectedValues: string[] = [],
): TypeaheadParams => {
  if (text !== "" && !selectedValues.includes(text.toLowerCase())) {
    return [table, column, text];
  }
  return [table, column];
};

export const useTypeaheadSuggestions = () => {
  const dataSource = useDataSource(false);
  return useCallback<SuggestionFetcher>(
    async ([{ module, table }, column, starts]: TypeaheadParams) => {
      if (dataSource === undefined) {
        console.warn(
          `[useTypeaheadSuggestions] no dataSource provided (use DataSourceProvider)`,
        );
        return false;
      }
      const rpcMessage: Omit<VuuRpcServiceRequest, "context"> =
        starts === undefined
          ? {
              params: {
                column,
                module,
                table,
              },
              rpcName: "getUniqueFieldValues",
              type: "RPC_REQUEST",
            }
          : {
              params: {
                column,
                module,
                starts,
                table,
              },
              rpcName: "getUniqueFieldValuesStartingWith",
              type: "RPC_REQUEST",
            };

      try {
        // We don't just return rpcCall . In the case of an
        // error we will be returning the rejected promise, bypassing
        // the catch block below.
        const response = await dataSource.rpcRequest?.(rpcMessage);
        if (response?.type === "SUCCESS_RESULT") {
          return response.data as string[];
        } else {
          return false;
        }
      } catch (err) {
        return false;
      }
    },
    [dataSource],
  );
};
