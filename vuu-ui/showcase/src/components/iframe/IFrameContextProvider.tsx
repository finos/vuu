import { createContext, useContext } from "react";

const initial = {};

const IFrameContext = createContext(initial);

export const useIFrameContext = () => useContext(IFrameContext);

export const IFrameContextProvider = ({ children }) => {
  const contextValue = {};
  return (
    <IFrameContext.Provider value={contextValue}>
      {children}
    </IFrameContext.Provider>
  );
};
