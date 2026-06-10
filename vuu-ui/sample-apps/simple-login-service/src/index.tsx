import { SaltProviderNext } from "@salt-ds/core";
import { LoginPanel } from "@vuu-ui/vuu-shell";
import { createRoot } from "react-dom/client";
import { VuuAuthProvider } from "@vuu-ui/vuu-data-remote";
import type { Accent } from "@salt-ds/core";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";
import "./index.css";

const vuuPurple = "purple" as Accent;

const authProvider = new VuuAuthProvider("/api/authn");

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
      <LoginPanel onSubmit={authProvider.login} />
    </SaltProviderNext>,
  );
}
