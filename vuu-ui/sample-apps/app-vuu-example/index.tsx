import {
  ConnectionManager,
  ConnectionStatus,
  LostConnectionHandler,
  VuuAuthenticator,
  VuuAuthProvider,
  VuuAuthTokenIssuePolicy,
} from "@vuu-ui/vuu-data-remote";
import { isLoginErrorMessage } from "@vuu-ui/vuu-utils";
import { createRoot } from "react-dom/client";
import { App } from "./src/App";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";

const { websocketUrl } = await vuuConfig;

const vuuAuth = new VuuAuthenticator({
  authProvider: new VuuAuthProvider("/api/authn"),
  authTokenIssuePolicy: VuuAuthTokenIssuePolicy.UsernamePassword,
  websocketUrl,
});

const lostConnectionHandler = new LostConnectionHandler(vuuAuth);

const onConnectionStatusChange = (connectionStatus: ConnectionStatus) => {
  if (connectionStatus === "disconnected") {
    // do we care about the reason ?
    lostConnectionHandler.reconnect();
  }
};

const container = document.getElementById("root");
if (!container) {
  throw Error("No react root defined in page");
}
try {
  const [{ userName }] = await vuuAuth.login();
  ConnectionManager.on("connection-status", onConnectionStatusChange);
  const root = createRoot(container);
  root.render(<App logout={vuuAuth.logout} user={{ username: userName }} />);
} catch (err: unknown) {
  if (isLoginErrorMessage(err)) {
    const root = createRoot(container);
    root.render(<div>{`${err}`}</div>);
  } else {
    vuuAuth.logout();
  }
}
