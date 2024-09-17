import { ConnectionStatusIndicator } from "@finos/vuu-shell";

let displaySequence = 1;

export const DisconnectedStatus = () => {
  return <ConnectionStatusIndicator connectionStatus="disconnected" />;
};
DisconnectedStatus.displaySequence = displaySequence++;

export const ConnectingStatus = () => {
  return <ConnectionStatusIndicator connectionStatus="connecting" />;
};
ConnectingStatus.displaySequence = displaySequence++;

export const ConnectedStatus = () => {
  return <ConnectionStatusIndicator connectionStatus="connected" />;
};
ConnectedStatus.displaySequence = displaySequence++;
