import {
  ClientToServerGetUniqueValues,
  ClientToServerGetUniqueValuesStartingWith,
  TypeaheadParams,
} from "@finos/vuu-protocol-types";
import { useCallback } from "react";
import { makeRpcCall } from "../connection-manager";

export type SuggestionFetcher = (params: TypeaheadParams) => Promise<string[]>;

const SPECIAL_SPACE = "_";
const TYPEAHEAD_MESSAGE_CONSTANTS = {
  type: "RPC_CALL",
  service: "TypeAheadRpcHandler",
};

const containSpace = (text: string) => text.indexOf(" ") !== -1;
const replaceSpace = (text: string) => text.replace(/\s/g, SPECIAL_SPACE);

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
      return suggestions.some(containSpace)
        ? suggestions.map(replaceSpace)
        : suggestions;
    },
    []
  );

  return getTypeaheadSuggestions;
};
