import React, { HTMLAttributes, MouseEvent } from 'react';
import classnames from 'classnames';

export interface ActionButtonProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onClick'> {
  actionId: 'maximize' | 'minimize' | 'restore' | 'tearout';
  iconName?: string;
  onClick: (evt: MouseEvent, actionId: 'maximize' | 'minimize' | 'restore' | 'tearout') => void;
}

const ActionButton = ({ actionId, className, iconName, onClick, ...props }: ActionButtonProps) => {
  const handleClick = (evt: MouseEvent) => {
    onClick(evt, actionId);
  };
  return (
    <button
      {...props}
      className={classnames('ActionButton', className)}
      onClick={handleClick}
      title="Close View"></button>
  );
};

export default ActionButton;
