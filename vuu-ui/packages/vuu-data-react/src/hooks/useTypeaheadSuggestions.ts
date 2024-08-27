import { makeRpcCall } from "@finos/vuu-data-remote";
import { SuggestionFetcher, TableSchemaTable } from "@finos/vuu-data-types";
import {
  VuuRpcServiceRequest,
  TypeaheadParams,
} from "@finos/vuu-protocol-types";
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

export const useTypeaheadSuggestions = () =>
  useCallback<SuggestionFetcher>(async (params: TypeaheadParams) => {
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
    return makeRpcCall<string[]>(rpcMessage);
  }, []);
