import React from 'react';

export default function Control({ tabIdx, children }) {
  return (
    <div className="control" tabIndex={tabIdx}>
      {children}
    </div>
  );
}
