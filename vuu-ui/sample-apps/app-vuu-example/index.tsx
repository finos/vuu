import React from "react";
import ReactDOM from "react-dom";
import { App } from "./src/App";
import { getAuthDetailsFromCookies, redirectToLogin } from "@finos/vuu-shell";

import "@salt-ds/theme/index.css";
import "@finos/vuu-icons/icons.css";

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
