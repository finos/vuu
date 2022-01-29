import React, { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { ThemeProvider } from '@vuu-ui/theme';
import { Flexbox } from '@vuu-ui/layout';
import { Tree } from '@vuu-ui/ui-controls';

import './App.css';

const sourceFromImports = (stories, prefix = '', icon = 'folder') =>
  Object.entries(stories)
    .filter(([path]) => path !== 'default')
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
  console.log({ source });
  const { pathname } = useLocation();
  const handleChange = (evt, [selected]) => navigate(selected.id);
  return (
    <ThemeProvider>
      <Flexbox style={{ flexDirection: 'row', width: '100vw', height: '100vh' }}>
        <Tree
          className="ShowcaseNav"
          style={{ flex: '0 0 200px' }}
          data-resizeable
          defaultSelected={[pathname.slice(1)]}
          onSelectionChange={handleChange}
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
  );
};
