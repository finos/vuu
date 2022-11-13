import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import { getAuthDetailsFromCookies, redirectToLogin } from "@finos/vuu-shell";

// import '@finos/theme/index.css';
// import '@finos/vuu-shell/index.css';
// import '@finos/vuu-layout/index.css';
// import '@finos/ui-controls/index.css';
// import '@finos/vuu-datagrid/index.css';
// import "./index.css";
import "@finos/vuu-theme/index.css";

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
