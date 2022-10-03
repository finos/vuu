import { useEffect, useState } from 'react';
import { ConnectionManager, ServerAPI } from '../connection-manager';

// should this be a promise ?
let _serverUrl: string;

export const connectToServer = (serverUrl: string, token?: string) => {
  if (serverUrl && serverUrl !== _serverUrl) {
    _serverUrl = serverUrl;
    // Kick the server into life while the UI is busy rendering
    ConnectionManager.connect(_serverUrl, token);
  }
};

export const getServerUrl = () => _serverUrl;

export const useServerConnection = (serverUrl?: string) => {
  // Lets assume for now this doesn't change at runtime
  if (_serverUrl === null && serverUrl) {
    connectToServer(serverUrl);
  }
  const [server, setServer] = useState<ServerAPI>();

  useEffect(() => {
    let active = true;
    async function connect() {
      const res = await ConnectionManager.connect(_serverUrl);
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
