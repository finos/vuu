import { SaltProviderNext } from "@salt-ds/core";
import { ModalProvider } from "@vuu-ui/core";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import ModuleAdmin from "./ModuleAdminLocal";

// The portal host provides the theme; load it here for standalone use only.
import "@vuu-ui/vuu-theme/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

// A data router, so Module Admin can guard unsaved edits on navigation.
const router = createBrowserRouter([
  {
    path: "*",
    element: (
      <ModalProvider>
        <div style={{ height: "100vh", width: "100vw" }}>
          <ModuleAdmin />
        </div>
      </ModalProvider>
    ),
  },
]);

createRoot(container).render(
  <SaltProviderNext density="high" theme="vuu-theme">
    <LocalDataSourceProvider>
      <RouterProvider router={router} />
    </LocalDataSourceProvider>
  </SaltProviderNext>,
);
