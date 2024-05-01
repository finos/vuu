import { ConnectionStatus } from "@finos/vuu-data-types";
import { ConnectionStatusIndicator } from "@finos/vuu-shell";

let displaySequence = 1;

export const ActiveStatus = () => {
  const connectionStatus: ConnectionStatus = "connected";
  return (
    <ConnectionStatusIndicator connectionStatus={connectionStatus} data-icon />
  );
};
ActiveStatus.displaySequence = displaySequence++;

export const ConnectingStatus = () => {
  const connectionStatus: ConnectionStatus = "connecting";
  return (
    <ConnectionStatusIndicator connectionStatus={connectionStatus} data-icon />
  );
};
ConnectingStatus.displaySequence = displaySequence++;

export const DisconnectedStatus = () => {
  const connectionStatus: ConnectionStatus = "disconnected";
  return (
    <ConnectionStatusIndicator connectionStatus={connectionStatus} data-icon />
  );
};
DisconnectedStatus.displaySequence = displaySequence++;
