import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import { ThemeProvider } from '@vuu-ui/theme';
import { Flexbox } from '@vuu-ui/layout';
import { List } from '@vuu-ui/ui-controls';
import * as stories from './examples';

console.log({ stories });

const components = Object.entries(stories).map(([label, storyItems]) => {
  console.log({ label, storyItems });
  return {
    label,
    childNodes: Object.entries(storyItems)
      .filter(([label]) => label !== 'default')
      .map(([label, component]) => ({
        label,
        component
      }))
  };
});

console.log({ components });

import './App.css';

export const App = () => {
  // const iframe = useRef(null);
  // const isLoaded = useRef(false);
  const [Component, setComponent] = useState(() => () => null);
  const handleSelection = (evt, [selected]) => {
    setComponent(() => selected.component);
  };

  // const loadContent = useCallback(() => {
  //   isLoaded.current = true;
  //   console.log({ component });
  //   const contentDoc = iframe.current.contentDocument;
  //   const contentRoot = contentDoc.body.querySelector('#root');
  //   ReactDOM.render(<ThemeProvider>{component}</ThemeProvider>, contentRoot);
  // }, [component]);

  // useEffect(() => {
  //   if (isLoaded.current) {
  //     loadContent();
  //   }
  // }, [loadContent]);

  // const handleContentLoaded = () => {
  //   loadContent();
  // };

  return (
    <ThemeProvider>
      <Flexbox style={{ flexDirection: 'row', width: '100vw', height: '100vh' }}>
        <List
          className="Palette"
          onChange={handleSelection}
          source={components}
          style={{ flex: '0 0 200px' }}
          data-resizeable
        />
        <div
          className="Content"
          style={{ flex: '1 1 auto', backgroundColor: 'ivory', position: 'relative' }}
          data-resizeable>
          <Component />
        </div>
      </Flexbox>
    </ThemeProvider>
  );
};
