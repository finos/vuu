import { SaltProvider } from "@salt-ds/core";
import { authenticate } from "@vuu-ui/vuu-data-remote";
import { LoginPanel } from "@vuu-ui/vuu-shell";
import { createRoot } from "react-dom/client";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";
import "./login.css";

async function login(username: string, password = "password") {
  try {
    const { authUrl } = await vuuConfig;
    const { token } = await authenticate(username, password, authUrl);
    const date = new Date();
    const days = 1;
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `vuu-username=${username};expires=${date.toUTCString()};path=/`;
    document.cookie = `vuu-auth-token=${token};expires=${date.toUTCString()};path=/`;
    document.cookie = `vuu-auth-mode=login`;
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
  }
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <SaltProvider theme="vuu-theme" density="high">
      <LoginPanel onSubmit={login} />
    </SaltProvider>,
  );
}
