import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import { getAuthDetailsFromCookies, redirectToLogin } from "@vuu-ui/vuu-shell";

// import '@vuu-ui/theme/index.css';
// import '@vuu-ui/vuu-shell/index.css';
// import '@vuu-ui/vuu-layout/index.css';
// import '@vuu-ui/ui-controls/index.css';
// import '@vuu-ui/vuu-datagrid/index.css';
// import "./index.css";
import "@vuu-ui/vuu-theme/index.css";

const [username, token] = getAuthDetailsFromCookies();
if (!username || !token) {
  // This won't be needed with serverside protection
  redirectToLogin();
} else {
  ReactDOM.render(
    <App user={{ username, token }} />,
    document.getElementById("root")
  );
}
