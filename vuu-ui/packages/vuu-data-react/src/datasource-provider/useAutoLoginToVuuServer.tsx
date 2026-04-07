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
  token: tokenProp = "no-token",
  user = "steve",
  websocketUrl,
}: {
  /**
   * if true, auth url on vuuserver will be used to get token
   * auth url is "/api/authn"
   */
  authenticate?: boolean;
  /**
   * true by default, will go ahead and open websocket connection
   */
  autoConnect?: boolean;
  autoLogin?: boolean;
  secure?: boolean;
  /**
   * use with no authenticate step, to provide auth token.
   * Used when vuu server is performing no token check
   */
  token?: string;
  user?: string;
  websocketUrl?: string;
} = {}) => {
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const connect = async () => {
      try {
        let token = tokenProp;
        if (authenticate) {
          const response = await vuuAuthenticate(user, "xyz", "/api/authn");
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
  }, [authenticate, autoConnect, secure, tokenProp, user, websocketUrl]);

  if (errorMessage) {
    return (
      <p>
        Unable to authenticate against Vuu Server A Vuu Server instance must be
        running to show this example.
      </p>
    );
  }
};
