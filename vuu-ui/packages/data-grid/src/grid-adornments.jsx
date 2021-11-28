import React from 'react';

export const Header = ({ children, height }) => {
  return (
    <div className="header" style={{ position: 'absolute', top: 0, height, width: '100%' }}>
      {children}
    </div>
  );
};

export const Footer = ({ children, height }) => {
  return (
    <div className="header" style={{ position: 'absolute', bottom: 0, height, width: '100%' }}>
      {children}
    </div>
  );
};

export const InlineHeader = ({ children, height }) => {
  return (
    <div
      className="inline-header"
      style={{ position: 'absolute', bottom: 0, height, width: '100%' }}
    >
      {children}
    </div>
  );
};
