import React, { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ToolkitProvider } from '@heswell/uitk-core';

import { ThemeProvider } from '@vuu-ui/theme';
import { Flexbox } from '@vuu-ui/layout';
import { Tree } from '@vuu-ui/ui-controls';

import './App.css';

const byDisplaySequence = ([, f1], [, f2]) => {
  const { displaySequence: ds1 } = f1;
  const { displaySequence: ds2 } = f2;

  if (ds1 === undefined && ds2 === undefined) {
    return 0;
  } else if (ds2 === undefined) {
    return -1;
  } else if (ds1 === undefined) {
    return 1;
  } else {
    return ds1 - ds2;
  }
};

const sourceFromImports = (stories, prefix = '', icon = 'folder') =>
  Object.entries(stories)
    .filter(([path]) => path !== 'default')
    .sort(byDisplaySequence)
    .map(([label, stories]) => {
      const id = `${prefix}${label}`;
      if (typeof stories === 'function') {
        return {
          id,
          icon: 'rings',
          label
        };
      }
      return {
        id,
        icon,
        label,
        childNodes: sourceFromImports(stories, `${id}/`, 'box')
      };
    });

export const App = ({ stories }) => {
  let navigate = useNavigate();
  const source = useMemo(() => sourceFromImports(stories), [stories]);
  const { pathname } = useLocation();
  const handleChange = (evt, [selected]) => navigate(selected.id);
  return (
    <ToolkitProvider>
      <ThemeProvider>
        <Flexbox style={{ flexDirection: 'row', width: '100vw', height: '100vh' }}>
          <Tree
            className="ShowcaseNav"
            style={{ flex: '0 0 200px' }}
            data-resizeable
            defaultSelected={[pathname.slice(1)]}
            onSelectionChange={handleChange}
            revealSelected
            source={source}
          />
          <div
            className="Content"
            style={{ flex: '1 1 auto', backgroundColor: 'ivory', position: 'relative' }}
            data-resizeable>
            <Outlet />
          </div>
        </Flexbox>
      </ThemeProvider>
    </ToolkitProvider>
  );
};
