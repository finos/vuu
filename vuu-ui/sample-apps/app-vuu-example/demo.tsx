import { LoginPanel } from "@vuu-ui/vuu-shell";
import { uuid } from "@vuu-ui/vuu-utils";
import React from "react";
import ReactDOM from "react-dom";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";

import "./login.css";
import { SaltProvider } from "@salt-ds/core";

async function login(username: string) {
  try {
    const authToken = uuid();
    const date = new Date();
    const days = 1;
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `vuu-username=${username};expires=${date.toUTCString()};path=/`;
    document.cookie = `vuu-auth-token=${authToken};expires=${date.toUTCString()};path=/`;
    document.cookie = `vuu-auth-mode=demo`;

    window.location.href = "index.html";
  } catch (err) {
    console.error(err);
  }
}

ReactDOM.render(
  <SaltProvider theme="vuu-theme" density="high">
    <LoginPanel requirePassword={false} onSubmit={login} />
  </SaltProvider>,
  document.getElementById("root"),
);
