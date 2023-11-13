import {
  authenticate as vuuAuthenticate,
  connectToServer,
} from "@finos/vuu-data";
import { useEffect, useState } from "react";
import { ContentStatus } from "@salt-ds/lab";

export const useAutoLoginToVuuServer = (autoLogin = true) => {
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const connect = async () => {
      try {
        const authToken = (await vuuAuthenticate(
          "steve",
          "xyz",
          "/api/authn"
        )) as string;
        console.log(`connect to server`);
        connectToServer({ url: "localhost:8090/websocket", authToken });
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
      <ContentStatus
        actionLabel="Unable to authenticate against Vuu Server"
        message="A Vuu Server instance must be running to show this example."
        title="No Vuu Server"
      />
    );
  }
};
