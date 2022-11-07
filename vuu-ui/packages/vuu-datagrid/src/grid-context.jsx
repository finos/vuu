//TODO GridContext should be nestable and inherit
import React, { useEffect, useMemo } from 'react';
/** @type {GridContext} */
const GridContext = React.createContext();
export default GridContext;

const NO_CONTEXT = {};

const chainInheritedContextValues = (localContext, inheritedContext) => {
  const { dispatchGridAction: localDispatch, ...localContextValues } = localContext;
  const { dispatchGridAction: inheritedDispatch, ...inheritedContextValues } = inheritedContext;

  const dispatchGridAction = (...args) =>
    localDispatch?.(...args) || inheritedDispatch?.(...args) || false;

  return {
    ...inheritedContextValues,
    ...localContextValues,
    dispatchGridAction
  };
};

const Provider = ({ children, context = NO_CONTEXT, value = NO_CONTEXT }) => {
  const contextValue = useMemo(() => {
    return chainInheritedContextValues(value, context);
  }, [context, value]);
  return <GridContext.Provider value={contextValue}>{children}</GridContext.Provider>;
};

export const GridProvider = ({ children, value }) => {
  return (
    <GridContext.Consumer>
      {(parentContext) => (
        <Provider context={parentContext} value={value}>
          {children}
        </Provider>
      )}
    </GridContext.Consumer>
  );
};
