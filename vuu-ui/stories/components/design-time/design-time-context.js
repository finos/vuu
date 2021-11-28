import React from 'react';
import { SelectionProvider } from '@vuu-ui/layout';
const DesignContext = React.createContext(true);
export default DesignContext;

export const DesignProvider = (props) => {
  const handleSelect = (selectedItem) => {
    if (props.onSelect) {
      props.onSelect(selectedItem);
    }
  };

  return (
    <SelectionProvider onSelect={handleSelect}>
      <DesignContext.Provider>{props.children}</DesignContext.Provider>
    </SelectionProvider>
  );
};

export const useDesignTime = () => {
  return useContext(DesignContext);
};
