import React, { useContext } from 'react';

const LayoutToolbarContext = React.createContext({});

export default LayoutToolbarContext;

export const useLayoutToolbarContext = () => {
  return useContext(LayoutToolbarContext);
};
