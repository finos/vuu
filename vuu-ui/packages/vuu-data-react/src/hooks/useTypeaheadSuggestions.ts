import {makeRpcCall, newMakeRpcCall} from "@finos/vuu-data-remote";
import { SuggestionFetcher, TableSchemaTable } from "@finos/vuu-data-types";
import {
  VuuRpcServiceRequest,
  TypeaheadParams, NewVuuRpcServiceRequest, VuuContext, NewTypeaheadParams
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
  useCallback<SuggestionFetcher>(async (paramsArray: TypeaheadParams) => {

    var context: VuuContext = {
      type: "VIEWPORT_CONTEXT",
      viewPortId: ""
    }

    var params: NewTypeaheadParams = {
      table: paramsArray[0]["table"],
      module: paramsArray[0]["module"],
      column: paramsArray[1]
    };
    const rpcMessage: NewVuuRpcServiceRequest =
         {
            type: "RPC_REQUEST",
            context,
            rpcName: "getUniqueFieldValues",
           params,
          }
        // : {
        //     type: "RPC_REQUEST",
        //     context,
        //     rpcName: "getUniqueFieldValuesStartingWith",
        //     params,
        //   };
    return newMakeRpcCall<string[]>(rpcMessage);
  }, []);
