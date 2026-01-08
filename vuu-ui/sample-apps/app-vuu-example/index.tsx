import { getAuthDetailsFromCookies, redirectToLogin } from "@vuu-ui/vuu-shell";
import { createRoot } from "react-dom/client";
import { App } from "./src/App";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme-deprecated/index.css";

const [username, token] = getAuthDetailsFromCookies();
if (!username || !token) {
  // This won't be needed with serverside protection
  redirectToLogin();
} else {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    root.render(<App user={{ username, token }} />);
  }
}
