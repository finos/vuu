import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import type { ReactNode } from "react";
import { useVuuAccessToken } from "../authentication-provider/AuthenticationProvider";

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
