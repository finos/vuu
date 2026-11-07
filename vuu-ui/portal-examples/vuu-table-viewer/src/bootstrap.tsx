import { SaltProviderNext } from "@salt-ds/core";
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");
if (!container) {
  throw Error("Root element not found");
}

createRoot(container).render(
  <SaltProviderNext density="high" theme="vuu-theme">
    <div style={{ padding: 24 }}>
      Vuu Table Viewer must be loaded within a host-managed Vuu connection.
    </div>
  </SaltProviderNext>,
);
