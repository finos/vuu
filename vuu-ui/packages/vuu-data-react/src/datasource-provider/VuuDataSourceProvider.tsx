import { useOptionalVuuConnectionId } from "@vuu-ui/vuu-auth";
import { ConnectionManager, VuuDataSource } from "@vuu-ui/vuu-data-remote";
import type { DataSourceConstructorProps } from "@vuu-ui/vuu-data-types";
import { DataProvider } from "@vuu-ui/vuu-utils2";
import { useMemo, type ReactNode } from "react";

/**
 * Supplies the standard VUU data-source implementation. Authentication and
 * websocket lifecycle are handled by AuthenticationProvider.
 */
export const VuuDataSourceProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const connectionId = useOptionalVuuConnectionId() ?? "portal";
  const BoundVuuDataSource = useMemo(
    () =>
      class ConnectionScopedVuuDataSource extends VuuDataSource {
        constructor(props: DataSourceConstructorProps) {
          super({ ...props, connectionId });
        }
      },
    [connectionId],
  );
  const getServerAPI = useMemo(
    () => () => ConnectionManager.serverAPIFor(connectionId),
    [connectionId],
  );

  return (
    <DataProvider
      VuuDataSource={BoundVuuDataSource}
      getServerAPI={getServerAPI}
      isLocalData={false}
    >
      {children}
    </DataProvider>
  );
};
