import { useVuuAccessToken } from "@vuu-ui/vuu-auth";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import type { ReactNode } from "react";

export interface RemoteModuleProps {
  children: ReactNode;
  connectionId: string;
  websocketUrl?: string;
}

export const RemoteModule = ({
  children,
  connectionId,
  websocketUrl,
}: RemoteModuleProps) => {
  const token = useVuuAccessToken();

  return (
    <VuuDataSourceProvider
      autoConnect={token !== null && websocketUrl !== undefined}
      authenticate
      connectionId={connectionId}
      token={token ?? undefined}
      websocketUrl={websocketUrl}
    >
      {children}
    </VuuDataSourceProvider>
  );
};
