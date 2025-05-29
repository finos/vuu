import { SuggestionFetcher, TableSchemaTable } from "@vuu-ui/vuu-data-types";
import {
  VuuRpcServiceRequest,
  TypeaheadParams,
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
  const { getServerAPI } = useDataSource();
  return useCallback<SuggestionFetcher>(
    async (params: TypeaheadParams) => {
      const rpcMessage: VuuRpcServiceRequest =
        params.length === 2
          ? {
              type: "RPC_CALL",
              service: "TypeAheadRpcHandler",
              method: "getUniqueFieldValues",
              params,
            }
          : {
              type: "RPC_CALL",
              service: "TypeAheadRpcHandler",
              method: "getUniqueFieldValuesStartingWith",
              params,
            };

      try {
        const serverAPI = await getServerAPI();
        // We don't just return serverAPI.rpcCall . In the case of an
        // error we will be returning the rejected promise, bypassing
        // the catch block below.
        const response = await serverAPI.rpcCall<string[]>(rpcMessage);
        return response;
      } catch (err) {
        return false;
      }
    },
    [getServerAPI],
  );
};
