import {
  AuthenticationProvider,
  type RemoteModuleConnection,
} from "@vuu-ui/vuu-auth";
import type { ReactNode } from "react";

export interface RemoteModuleProps {
  children: ReactNode;
  connection: RemoteModuleConnection;
}

export const RemoteModule = ({ children, connection }: RemoteModuleProps) => (
  <AuthenticationProvider mode="vuu-connection" connection={connection}>
    {children}
  </AuthenticationProvider>
);
