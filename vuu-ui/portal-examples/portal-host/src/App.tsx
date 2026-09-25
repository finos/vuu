import { useModuleRegistry } from "@vuu-ui/core";
import { ColumnSettingsPanel } from "@vuu-ui/vuu-table-extras";
import { registerComponent } from "@vuu-ui/vuu-utils";
import { ConfirmSelectionPanel } from "./order-management/cancel-confirm-prompt/ConfirmSelectionPanel";
import {
  PortalShell,
  WindowHost,
  WINDOW_HOST_ROUTE,
} from "@vuu-ui/core/portal";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useMemo, type ComponentType, type ReactNode } from "react";

import "./App.css";

registerComponent("cancel-confirm", ConfirmSelectionPanel, "view");
registerComponent("ColumnSettings", ColumnSettingsPanel, "view");

export interface AppProps {
  DataSourceProvider?: ComponentType<{ children: ReactNode }>;
}

const PortalRoute = ({ DataSourceProvider }: AppProps) => {
  const { modules: remoteModules } = useModuleRegistry();

  return (
    <PortalShell
      id="portal-demo"
      title="Portal Demo"
      remoteModules={remoteModules}
      DataSourceProvider={DataSourceProvider}
    />
  );
};

export const App = ({ DataSourceProvider }: AppProps) => {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: WINDOW_HOST_ROUTE,
          element: <WindowHost DataSourceProvider={DataSourceProvider} />,
        },
        {
          path: "*",
          element: <PortalRoute DataSourceProvider={DataSourceProvider} />,
        },
      ]),
    [DataSourceProvider],
  );

  return <RouterProvider router={router} />;
};
