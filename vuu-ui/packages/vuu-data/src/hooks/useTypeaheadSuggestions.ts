import {
  ClientToServerRpcCall,
  TypeAheadMethod,
  TypeaheadParams,
} from "@finos/vuu-protocol-types";
import { useCallback } from "react";
import { useRpcService } from "./useRpcService";

export type SuggestionFetcher = (params: TypeaheadParams) => Promise<string[]>;

const SPECIAL_SPACE = "_";

const containSpace = (text: string) => text.indexOf(" ") !== -1;
const replaceSpace = (text: string) => text.replace(/\s/g, SPECIAL_SPACE);

export const useTypeaheadSuggestions = () => {
  const makeRpcCall = useRpcService();
  const getTypeaheadSuggestions: SuggestionFetcher = useCallback(
    async (params: TypeaheadParams) => {
      const method: TypeAheadMethod =
        params.length === 2
          ? "getUniqueFieldValues"
          : "getUniqueFieldValuesStartingWith";

      const suggestions = await makeRpcCall<string[]>({
        type: "RPC_CALL",
        method,
        params,
      } as ClientToServerRpcCall);

      return suggestions.some(containSpace)
        ? suggestions.map(replaceSpace)
        : suggestions;
    },
    [makeRpcCall]
  );

  return getTypeaheadSuggestions;
};
