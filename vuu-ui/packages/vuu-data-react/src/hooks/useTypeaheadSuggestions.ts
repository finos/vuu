import {
  ClientToServerGetUniqueValues,
  ClientToServerGetUniqueValuesStartingWith,
  TypeaheadParams,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { useCallback } from "react";
import { makeRpcCall } from "@finos/vuu-data";

export type SuggestionFetcher = (params: TypeaheadParams) => Promise<string[]>;

// const SPECIAL_SPACE = "_";
const TYPEAHEAD_MESSAGE_CONSTANTS = {
  type: "RPC_CALL",
  service: "TypeAheadRpcHandler",
};

export const getTypeaheadParams = (
  table: VuuTable,
  column: string,
  text = "",
  selectedValues: string[] = []
): TypeaheadParams => {
  if (text !== "" && !selectedValues.includes(text.toLowerCase())) {
    return [table, column, text];
  }
  return [table, column];
};

// const containSpace = (text: string) => text.indexOf(" ") !== -1;
// const replaceSpace = (text: string) => text.replace(/\s/g, SPECIAL_SPACE);

export const useTypeaheadSuggestions = () => {
  const getTypeaheadSuggestions: SuggestionFetcher = useCallback(
    async (params: TypeaheadParams) => {
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

      const suggestions = await makeRpcCall<string[]>(rpcMessage);

      // TODO replacing space with underscores like this is not being correctly handled elsewhere
      return suggestions;
      // return suggestions.some(containSpace)
      //   ? suggestions.map(replaceSpace)
      //   : suggestions;
    },
    []
  );

  return getTypeaheadSuggestions;
};
