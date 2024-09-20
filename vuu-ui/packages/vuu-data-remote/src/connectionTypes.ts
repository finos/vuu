import { ConnectionStatus } from "@finos/vuu-data-types";

export interface Connection<T = unknown> {
  requiresLogin?: boolean;
  send: (message: T) => void;
  status: ConnectionStatus;
}
