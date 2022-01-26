import React from 'react';

export default {
  title: 'Example/App'
};

export const Example1 = () => {
  return (
    <div className="Example1" style={{ width: 100, height: 100, backgroundColor: 'red' }}>
      Example 1
    </div>
  );
};

export const Example2 = () => {
  return (
    <div className="Example2" style={{ width: 100, height: 100, backgroundColor: 'yellow' }}>
      Example 2
    </div>
  );
};

export const Example3 = () => {
  return (
    <div
      className="Example3"
      style={{ width: 100, height: 100, backgroundColor: 'blue', color: 'white' }}>
      Example 3
    </div>
  );
};
