import { SaltProvider } from "@salt-ds/core";
import { LoginPanel } from "@vuu-ui/vuu-shell";
import { createRoot } from "react-dom/client";
import { VuuAuthProvider } from "@vuu-ui/vuu-data-remote";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";
import "./login.css";

const authProvider = new VuuAuthProvider("/api/authn");

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <SaltProvider theme="vuu-theme" density="high">
      <LoginPanel onSubmit={authProvider.login} />
    </SaltProvider>,
  );
}
