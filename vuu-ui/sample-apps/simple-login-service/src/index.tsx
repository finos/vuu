import { VuuLoginHandler } from "@vuu-ui/vuu-auth";
import { SaltProviderNext } from "@salt-ds/core";
import { LoginPanel } from "@vuu-ui/vuu-shell";
import { createRoot } from "react-dom/client";
import type { Accent } from "@salt-ds/core";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";
import "./index.css";

const vuuPurple = "purple" as Accent;

const config = {
  ssl: true,
  authUrl: "http://localhost:5001",
  moduleRegistryUrl: "/module-registry.json",
  restUrl: "api/authn",
  websocketUrl: "wss://localhost:8090/websocket",
};

const authHandler = new VuuLoginHandler(config);

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <SaltProviderNext
      accent={vuuPurple}
      corner="rounded"
      theme="vuu-theme"
      density="high"
    >
      <LoginPanel onSubmit={authHandler.login} />
    </SaltProviderNext>,
  );
}
