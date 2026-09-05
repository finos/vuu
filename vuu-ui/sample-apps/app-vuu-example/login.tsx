import { SaltProviderNext } from "@salt-ds/core";
import { VuuLoginHandler } from "@vuu-ui/core";
import { LoginPanel } from "@vuu-ui/vuu-shell";
import { createRoot } from "react-dom/client";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";
import "./login.css";

import type { Accent } from "@salt-ds/core";

const vuuPurple = "purple" as Accent;

const authHandler = new VuuLoginHandler({
  ...(await vuuConfig),
  redirectUrl: "/index.html",
});

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
