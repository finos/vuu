import React from 'react';

const ComponentContext = React.createContext(null);

export const ComponentProvider = ({ children, components = {} }) => {
  return (
    <ComponentContext.Consumer>
      {(parentContext) => (
        <ComponentContext.Provider value={{ ...parentContext, ...components }}>
          {children}
        </ComponentContext.Provider>
      )}
    </ComponentContext.Consumer>
  );
};

export default ComponentContext;
