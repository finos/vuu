import { ConnectionStatus } from '@finos/vuu-data';
import { ConnectionStatusIcon } from '@finos/vuu-shell';

export const ActiveStatus = () => {
	const connectionStatus:ConnectionStatus = "connected";
	return <ConnectionStatusIcon connectionStatus={connectionStatus} data-icon />
}

export const ConnectingStatus = () => {
	const connectionStatus:ConnectionStatus = "connecting";
	return <ConnectionStatusIcon connectionStatus={connectionStatus} data-icon />
}

export const DisconnectedStatus = () => {
	const connectionStatus:ConnectionStatus = "disconnected";
	return <ConnectionStatusIcon connectionStatus={connectionStatus} data-icon />
}