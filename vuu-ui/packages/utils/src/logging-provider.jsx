import React from 'react';
import { createContext, useContext, useMemo } from 'react';

const LoggingContext = createContext();

const EMPTY_PROPS = {};

const defaultLogger = {
  for: (name, path, props) => ({
    log: (msg) => console.log(`[${path}] [${name}] ${msg} ${JSON.stringify(props)}`)
  }),
  log: (msg) => console.log(msg)
};

const extractLoggingProps = (props) => {
  const propNames = Object.keys(props);
  if (!propNames.some((propName) => propName.startsWith('data-log'))) {
    return props;
  }

  let loggingProps = {};
  let restProps = {};

  propNames.forEach((propName) => {
    if (propName.startsWith('data-log')) {
      loggingProps[propName.slice(9)] = props[propName];
    } else {
      restProps[propName] = props[propName];
    }
  });
  return [loggingProps, restProps];
};

export const useLogger = (name, props) => {
  const { logger, path } = useContext(LoggingContext);
  const [logProps, restProps] = useMemo(() => {
    const result = extractLoggingProps(props);
    return Array.isArray(result) ? result : [EMPTY_PROPS, result];
  }, [props]);
  return [logger.for(name, path, logProps), restProps];
};

export function LoggingDomain({ children, path }) {
  const { path: parentPath, logger } = useContext(LoggingContext);
  return (
    <LoggingContext.Provider value={{ logger, path: `${parentPath}/${path}` }}>
      {children}
    </LoggingContext.Provider>
  );
}

export function LoggingProvider({ children, logger = defaultLogger, path = 'root' }) {
  return <LoggingContext.Provider value={{ logger, path }}>{children}</LoggingContext.Provider>;
}
