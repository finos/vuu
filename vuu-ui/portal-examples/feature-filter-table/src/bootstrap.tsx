import { createRoot } from "react-dom/client";
import VuuFilterTableFeature from "./VuuFilterTableFeature";
import { LocalDataSourceProvider, simulModule } from "@vuu-ui/vuu-data-test";
import { SaltProviderNext } from "@salt-ds/core";

import "./bootstrap.css";
import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";

const instrumentsSchema = simulModule.schemas.instruments;

async function start(): Promise<void> {
  const container = document.getElementById("root");
  if (!container) throw new Error("Root element not found");

  const root = createRoot(container);
  root.render(
    <SaltProviderNext theme="vuu-theme" density="high">
      <LocalDataSourceProvider>
        <div style={{ width: "100vw", height: "100vh" }}>
          <VuuFilterTableFeature tableSchema={instrumentsSchema} />
        </div>
      </LocalDataSourceProvider>
    </SaltProviderNext>,
  );
}

start();
