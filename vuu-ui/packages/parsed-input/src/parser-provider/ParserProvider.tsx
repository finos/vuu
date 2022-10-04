import { ParserResults } from "@vuu-ui/datagrid-parsers";
import { createContext, ReactNode, useCallback, useContext } from "react";

export const ParserContext = createContext<{
  parser: any;
  suggestionProvider: any;
}>({
  parser: null,
  suggestionProvider: null,
});

export interface ParserProviderProps {
  children: ReactNode;
  parser: (text: string, typedText: string) => ParserResults;
  suggestionProvider: any;
}

export const ParserProvider = ({
  children,
  parser,
  suggestionProvider,
}: ParserProviderProps) => {
  return (
    <ParserContext.Provider value={{ parser, suggestionProvider }}>
      {children}
    </ParserContext.Provider>
  );
};

export const useParser = () => {
  const { parser, suggestionProvider } = useContext(ParserContext);
  return useCallback(
    (text, typedText) => parser(text, typedText, suggestionProvider),
    [parser, suggestionProvider]
  );
};
