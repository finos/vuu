import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import './ConnectionStatusIcon.css';

type connectionStatus = 'connected' | 'reconnected' | 'connecting' | 'disconnected';

interface ConnectionStatusProps {
	connectionStatus: connectionStatus
	className?: string;
	props?: unknown;
	element?: string;
}

export const ConnectionStatusIcon = ({ connectionStatus, className, element = 'span', ...props}: ConnectionStatusProps) => {
	const [classBase, setClassBase] = useState<string>('vuuConnectingStatus');
	useEffect(() => {
		switch(connectionStatus) {
			case 'connected':
			case 'reconnected':
				setClassBase('vuuActiveStatus');
				break;
			case 'connecting':
				setClassBase('vuuConnectingStatus');
				break;
			case 'disconnected':
				setClassBase('vuuDisconnectedStatus');
				break;
			default:
				break;
		}
	}, [connectionStatus]);

	const statusIcon = React.createElement (
		element,
		{
			...props,
			className: cx('vuuStatus vuuIcon', classBase, className)
		},
	)

	return (
		<>
			<div className='vuuStatus-container salt-theme'>
				{statusIcon}
				<div	className='vuuStatus-text'>Status: {connectionStatus.toUpperCase()}</div>
			</div>
		</>
	)
}