import {
  authenticate as vuuAuthenticate,
  connectToServer,
} from "@vuu-ui/vuu-data";
import { useEffect, useState } from "react";
import { ContentStatus } from "@heswell/uitk-lab";

export const useAutoLoginToVuuServer = (autoLogin = true) => {
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => {
    const connect = async () => {
      try {
        const authToken = (await vuuAuthenticate("steve", "xyz")) as string;
        connectToServer("127.0.0.1:8090/websocket", authToken);
      } catch (e: unknown) {
        if (e instanceof Error) {
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
