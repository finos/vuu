import React from 'react';
import classnames from 'classnames';

const ActionButton = ({ actionId, accessibleText, className, iconName, onClick, ...props }) => {
  const handleClick = (evt) => {
    onClick(evt, actionId);
  };
  return (
    <button
      {...props}
      className={classnames('ActionButton', className)}
      onClick={handleClick}
      title="Close View"
      variant="secondary"
    ></button>
  );
};

export default ActionButton;
