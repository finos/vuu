import React, { createContext, ReactNode, useContext } from "react";

const initial = {};

const IFrameContext = createContext(initial);

export const useIFrameContext = () => useContext(IFrameContext);

export const IFrameContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const contextValue = {};
  return (
    <IFrameContext.Provider value={contextValue}>
      {children}
    </IFrameContext.Provider>
  );
};
