import { NotificationsProvider } from "@finos/vuu-popups";
import {
  getAuthDetailsFromCookies,
  LayoutManagementProvider,
  redirectToLogin,
} from "@finos/vuu-shell";
import React from "react";
import ReactDOM from "react-dom";
import { App } from "./src/App";

import "@finos/vuu-icons/index.css";
import "@finos/vuu-theme/index.css";

const [username, token] = getAuthDetailsFromCookies();
if (!username || !token) {
  // This won't be needed with serverside protection
  redirectToLogin();
} else {
  ReactDOM.render(
    <NotificationsProvider>
      <LayoutManagementProvider>
        <App user={{ username, token }} />
      </LayoutManagementProvider>
    </NotificationsProvider>,
    document.getElementById("root")
  );
}
