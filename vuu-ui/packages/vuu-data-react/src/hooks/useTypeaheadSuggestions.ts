import { makeRpcCall } from "@finos/vuu-data-remote";
import { TableSchemaTable } from "@finos/vuu-data-types";
import {
  ClientToServerGetUniqueValues,
  ClientToServerGetUniqueValuesStartingWith,
  TypeaheadParams,
} from "@finos/vuu-protocol-types";
import { useCallback } from "react";

export type SuggestionFetcher = (params: TypeaheadParams) => Promise<string[]>;

// const SPECIAL_SPACE = "_";
const TYPEAHEAD_MESSAGE_CONSTANTS = {
  type: "RPC_CALL",
  service: "TypeAheadRpcHandler",
};

export const getTypeaheadParams = (
  table: TableSchemaTable,
  column: string,
  text = "",
  selectedValues: string[] = []
): TypeaheadParams => {
  if (text !== "" && !selectedValues.includes(text.toLowerCase())) {
    return [table, column, text];
  }
  return [table, column];
};

export const useTypeaheadSuggestions = () =>
  useCallback<SuggestionFetcher>(async (params: TypeaheadParams) => {
    const rpcMessage =
      params.length === 2
        ? ({
            method: "getUniqueFieldValues",
            params,
            ...TYPEAHEAD_MESSAGE_CONSTANTS,
          } as ClientToServerGetUniqueValues)
        : ({
            method: "getUniqueFieldValuesStartingWith",
            params,
            ...TYPEAHEAD_MESSAGE_CONSTANTS,
          } as ClientToServerGetUniqueValuesStartingWith);
    return makeRpcCall<string[]>(rpcMessage);
  }, []);
