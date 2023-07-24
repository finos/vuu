import React from "react";
import ReactDOM from "react-dom";
import { LoginPanel } from "@finos/vuu-shell";
import { SaltProvider } from "@salt-ds/core";
import { uuid } from "@finos/vuu-utils";

import "./login.css";

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
  <SaltProvider>
    <LoginPanel requirePassword={false} onSubmit={login} />
  </SaltProvider>,
  document.getElementById("root")
);
