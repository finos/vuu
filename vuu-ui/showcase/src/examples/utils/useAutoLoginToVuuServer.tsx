import {
  authenticate as vuuAuthenticate,
  ConnectionManager,
} from "@vuu-ui/vuu-data-remote";
import { useEffect, useState } from "react";

export const useAutoLoginToVuuServer = ({
  authenticate = true,
  autoConnect = true,
  autoLogin = true,
  secure = true,
}: {
  authenticate?: boolean;
  autoConnect?: boolean;
  autoLogin?: boolean;
  secure?: boolean;
} = {}) => {
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const connect = async () => {
      try {
        let token = "no-token";
        if (authenticate) {
          token = (await vuuAuthenticate(
            "steve",
            "xyz",
            "/api/authn",
          )) as string;
        }
        const protocol = secure ? "wss" : "ws";
        ConnectionManager.connect({
          url: `${protocol}://localhost:8090/websocket`,
          token,
        });
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error(e.message);
          setErrorMessage(e.message);
        }
      }
    };
    if (autoConnect && autoLogin) {
      connect();
    }
  }, [authenticate, autoConnect, autoLogin, secure]);

  if (errorMessage) {
    return (
      <p>
        Unable to authenticate against Vuu Server A Vuu Server instance must be
        running to show this example.
      </p>
    );
  }
};
