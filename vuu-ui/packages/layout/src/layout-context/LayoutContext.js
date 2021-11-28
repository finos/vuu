import React, { useContext } from 'react';

const NO_CONTEXT = { dispatch: null };
console.log('%c[LayoutContext] create the layout context', 'color: green;font-weight:bold;');
const LayoutContext = React.createContext(NO_CONTEXT);

export const useLayoutDispatch = () => {
  const context = useContext(LayoutContext);
  return context?.dispatch ?? null;
};

export const useLayoutContext = () => useContext(LayoutContext);

export default LayoutContext;
