import React from "react";
import ReactDOM from "react-dom";
import { LoginPanel, ThemeProvider } from "@finos/vuu-shell";
import { authenticate } from "@finos/vuu-data";

import "@finos/vuu-icons/index.css";
import "@finos/vuu-theme/index.css";

import "./login.css";

async function login(username: string, password = "password") {
  try {
    const { authUrl } = await vuuConfig;
    const authToken = await authenticate(username, password, authUrl);
    const date = new Date();
    const days = 1;
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `vuu-username=${username};expires=${date.toUTCString()};path=/`;
    document.cookie = `vuu-auth-token=${authToken};expires=${date.toUTCString()};path=/`;
    document.cookie = `vuu-auth-mode=login`;
    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
  }
}

ReactDOM.render(
  <ThemeProvider applyThemeClasses>
    <LoginPanel onSubmit={login} />
  </ThemeProvider>,
  document.getElementById("root")
);
