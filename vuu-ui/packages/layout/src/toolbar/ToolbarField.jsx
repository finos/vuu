import React from 'react';
import './ToolbarField.css';

const ToolbarField = ({ children, ...props }) => {
  return (
    <div {...props} className="ToolbarField">
      {children}
    </div>
  );
};

export default ToolbarField;
