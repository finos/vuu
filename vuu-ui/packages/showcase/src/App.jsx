import React from 'react';
import { Flexbox } from '@vuu-ui/layout';
import { Example1 } from './examples/example.stories.mdx';

import './App.css';

export const App = () => {
  return (
    <Flexbox style={{ flexDirection: 'row', width: '100vw', height: '100vw' }}>
      <div
        className="Palette"
        style={{ flex: '0 0 200px', backgroundColor: 'yellow' }}
        data-resizeable
      />
      <div
        className="Content"
        style={{ flex: '1 1 auto', backgroundColor: 'ivory' }}
        data-resizeable
      >
        <Example1 />
      </div>
    </Flexbox>
  );
};
