import { ClientToServerRpcCall } from "@finos/vuu-protocol-types";
import { useCallback } from "react";
import { useServerConnection } from "./useServerConnection";

export const useRpcService = () => {
  const server = useServerConnection(undefined);
  const makeRpcCall = useCallback(
    async <T = unknown>(rpcRequest: ClientToServerRpcCall) => {
      if (server) {
        return server.rpcCall<T>(rpcRequest);
      } else {
        // TODO we should queue the request when server isn't ready
        throw Error("Server not ready");
      }
    },
    [server]
  );

  return makeRpcCall;
};
