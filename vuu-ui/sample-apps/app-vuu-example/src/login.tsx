import React from "react";
import ReactDOM from "react-dom";
import { LoginPanel } from "@finos/vuu-shell";
import { authenticate } from "@finos/vuu-data";
import { ToolkitProvider } from "@heswell/uitk-core";

import "@finos/vuu-theme/index.css";
import "./login.css";

async function login(username: string, password: string) {
  try {
    const authToken = await authenticate(
      username,
      password /*, 'https://127.0.0.1:8443'*/
    );
    const date = new Date();
    const days = 1;
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `vuu-username=${username};expires=${date.toUTCString()};path=/`;
    document.cookie = `vuu-auth-token=${authToken};expires=${date.toUTCString()};path=/`;
    window.location.href = "/index.html";
  } catch (err) {
    console.error(err);
  }
}

ReactDOM.render(
  <ToolkitProvider>
    <LoginPanel onSubmit={login} />
  </ToolkitProvider>,
  document.getElementById("root")
);
