import { useEffect, useState } from 'react';
import { ConnectionManager } from '../connection-manager';

let _serverUrl = null;
const VUU = 'Vuu';

export const connectToServer = (serverUrl, token) => {
  if (serverUrl && serverUrl !== _serverUrl) {
    _serverUrl = serverUrl;
    // Kick the server into life while the UI is busy rendering
    ConnectionManager.connect(_serverUrl, VUU, token);
  }
};

export const getServerUrl = () => _serverUrl;

export const useServerConnection = (serverUrl) => {
  // Lets assume for now this doesn't change at runtime
  if (_serverUrl === null && serverUrl) {
    connectToServer(serverUrl);
  }
  const [server, setServer] = useState(null);

  useEffect(() => {
    let active = true;

    async function connect() {
      const res = await ConnectionManager.connect(_serverUrl, VUU);
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
