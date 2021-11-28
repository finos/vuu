import React, { createContext, useCallback, useContext } from 'react';

const WS = /\s+/;

const parseText = (text) => {
  return text
    .split(/(\s+)/)
    .filter((str) => str.length)
    .map((str) =>
      WS.test(str)
        ? {
            type: 'ws',
            text: str
          }
        : {
            type: 'text',
            text: str
          }
    );
};

export const ParserContext = createContext();

// TODO accept suggestionFactory here too
export const ParserProvider = ({ children, parser = parseText, suggestionFactory }) => {
  return (
    <ParserContext.Provider value={{ parseText: parser, suggestionProvider: suggestionFactory }}>
      {children}
    </ParserContext.Provider>
  );
};

export const useParser = () => {
  const { parseText, suggestionProvider } = useContext(ParserContext);
  return useCallback(
    // TODO maybe allow user to pass in a suggestionProvider here to override default ?
    (text, typedText) => parseText(text, typedText, suggestionProvider),
    [parseText, suggestionProvider]
  );
};
