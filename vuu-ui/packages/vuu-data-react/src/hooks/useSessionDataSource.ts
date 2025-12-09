import type {
  DataSource,
  DataSourceConfig,
  DataSourceConfigChangeHandler,
  DataSourceConstructorProps,
} from "@vuu-ui/vuu-data-types";
import { useData } from "@vuu-ui/vuu-utils";
import { useCallback, useRef } from "react";

const sessionState = new Map<string, DataSource>();

export interface SessionStateHookProps {
  onConfigChange?: DataSourceConfigChangeHandler;
}

export const useSessionDataSource = (props?: SessionStateHookProps) => {
  const { VuuDataSource } = useData();

  const dataSourceConfigRef = useRef<DataSourceConfig | undefined>(undefined);

  const getDataSource = useCallback(
    (
      sessionKey: string,
      dataSourceConstructorProps?: DataSourceConstructorProps,
    ) => {
      let ds = sessionState.get(sessionKey);
      if (ds) {
        if (ds.range.from > 0) {
          // UI does not currently restore scroll position, so always reset to top of dataset
          ds.range = ds.range.reset;
        }
        return ds;
      }

      if (dataSourceConstructorProps?.columns) {
        ds = new VuuDataSource({
          ...dataSourceConstructorProps,
          viewport: sessionKey,
          ...dataSourceConfigRef.current,
        });
        if (props?.onConfigChange) {
          ds.on("config", props.onConfigChange);
        }
        sessionState.set(sessionKey, ds);
        return ds;
      } else {
        throw Error(
          `[useSessionDataSource] unable to create new DataSource, columns have not been defined `,
        );
      }
    },
    [VuuDataSource, props?.onConfigChange],
  );

  const clearDataSource = useCallback(
    (sessionKey: string, unsubscribe?: boolean) => {
      const ds = sessionState.get(sessionKey);
      if (ds) {
        sessionState.delete(sessionKey);
        if (unsubscribe === true) {
          ds.unsubscribe();
        }
      } else {
        console.warn(
          `[useSessionbDatasource] clearDataSource ${sessionKey} not found `,
        );
      }
    },
    [],
  );

  return {
    clearDataSource,
    getDataSource,
  };
};
