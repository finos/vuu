import {
  authenticate as vuuAuthenticate,
  ConnectionManager,
} from "@finos/vuu-data-remote";
import { useEffect, useState } from "react";

export const useAutoLoginToVuuServer = (autoLogin = true) => {
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const connect = async () => {
      try {
        const token = (await vuuAuthenticate(
          "steve",
          "xyz",
          "/api/authn",
        )) as string;
        ConnectionManager.connect({
          url: "wss://localhost:8090/websocket",
          token,
          username: "steve",
        });
      } catch (e: unknown) {
        if (e instanceof Error) {
          console.error(e.message);
          setErrorMessage(e.message);
        }
      }
    };
    if (autoLogin) {
      connect();
    }
  }, [autoLogin]);

  if (errorMessage) {
    return (
      <p>
        Unable to authenticate against Vuu Server A Vuu Server instance must be
        running to show this example.
      </p>
    );
  }
};
