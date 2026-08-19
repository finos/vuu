import { ModalProvider } from "@vuu-ui/core";
import { createRoot } from "react-dom/client";
import { SaltProviderNext } from "@salt-ds/core";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import UserAdmin from "./UserAdmin";

async function start(): Promise<void> {
  const container = document.getElementById("root");
  if (!container) throw new Error("Root element not found");

  const root = createRoot(container);
  const router = createBrowserRouter([
    {
      path: "*",
      element: (
        <ModalProvider>
          <UserAdmin />
        </ModalProvider>
      ),
    },
  ]);
  root.render(
    <SaltProviderNext theme="vuu-theme" density="high">
      <VuuDataSourceProvider>
        <div style={{ height: "100vh", width: "100vw" }}>
          <RouterProvider router={router} />
        </div>
      </VuuDataSourceProvider>
    </SaltProviderNext>,
  );
}

start();
