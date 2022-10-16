import { useEffect, useState } from "react";
import { ConnectionManager, ServerAPI } from "../connection-manager";

let serverResolver: (value: string | PromiseLike<string>) => void;
// should this be a promise ?
let _serverUrl = new Promise<string>((resolve) => {
  serverResolver = resolve;
});
let _serverString: string;

const setServerUrl = (server: string) => {
  _serverString = server;
  serverResolver(server);
};

/**
 * Open a connection to the VuuServer. This method opens the websocket connection
 * and logs in. It can be called from whichever client code has access to the auth
 * token (eg. the login page, or just a hardcoded login script in a sample).
 * This will unblock any DataSources which may have already tried to subscribe to data,
 * but lacked access to the auth token.
 *
 * Analogy - we may have multiple components that have created datasources and
 * opened subscriptions - they are like empty channels waiting for water - this call
 * will turn on the tap.
 *
 * @param serverUrl
 * @param token
 */
export const connectToServer = (serverUrl: string, token?: string) => {
  if (serverUrl && serverUrl !== _serverString) {
    setServerUrl(serverUrl);
    ConnectionManager.connect(serverUrl, token);
  }
};

export const getServerUrl = () => _serverString;

export const useServerConnection = (serverUrl?: string) => {
  // Lets assume for now this doesn't change at runtime
  if (_serverUrl === null && serverUrl) {
    // is this possible without the authToken
    connectToServer(serverUrl);
  }
  const [server, setServer] = useState<ServerAPI>();

  useEffect(() => {
    let active = true;
    async function connect() {
      const url = await _serverUrl;
      const res = await ConnectionManager.connect(url);
      if (active) {
        setServer(res);
      }
    }
    connect();
    return () => {
      active = false;
    };
  }, [serverUrl]);

  return server;
};
