import {
  authenticate as vuuAuthenticate,
  ConnectionManager,
} from "@vuu-ui/vuu-data-remote";
import { useEffect, useState } from "react";

export const useAutoLoginToVuuServer = ({
  authenticate = true,
  autoConnect = true,
  // autoLogin = true,
  secure = true,
  websocketUrl,
}: {
  authenticate?: boolean;
  autoConnect?: boolean;
  autoLogin?: boolean;
  secure?: boolean;
  websocketUrl?: string;
} = {}) => {
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const connect = async () => {
      try {
        let token = "no-token";
        if (authenticate) {
          const response = await vuuAuthenticate("steve", "xyz", "/api/authn");
          token = response.token;
        }

        const url =
          websocketUrl ?? `${secure ? "wss" : "ws"}://localhost/8090/websocket`;

        ConnectionManager.connect({
          url,
          token,
        });
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error(e.message);
          setErrorMessage(e.message);
        }
      }
    };
    if (autoConnect) {
      connect();
    }

    return () => {
      if (autoConnect) {
        ConnectionManager.disconnect();
      }
    };
  }, [authenticate, autoConnect, secure, websocketUrl]);

  if (errorMessage) {
    return (
      <p>
        Unable to authenticate against Vuu Server A Vuu Server instance must be
        running to show this example.
      </p>
    );
  }
};
