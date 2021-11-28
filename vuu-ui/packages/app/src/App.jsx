import React, { useCallback } from 'react';
import { Shell } from '@vuu-ui/shell';
import useLayoutConfig from './use-layout-config';
import * as layout from './Layouts';
import './App.css';

const simpleComponentUrl = './features/simple-component.js';

const paletteConfig = [
  {
    label: 'Pages'
  },
  {
    label: 'Layouts',
    items: [
      {
        label: 'Page 1',
        component: layout.twoColumns,
        template: true
      }
    ]
  },
  {
    label: 'Features',
    items: [
      {
        header: true,
        label: 'Simple Component',
        type: 'Feature',
        props: {
          id: 'steve',
          url: simpleComponentUrl
        }
      }
    ]
  }
];

const defaultLayout = {
  type: 'Stack',
  props: {
    style: {
      width: '100%',
      height: '100%'
    },
    showTabs: true,
    enableAddTab: true,
    preserve: true,
    active: 0
  },
  children: [
    {
      type: 'Placeholder',
      title: 'Page 1'
    }
  ]
};

export const App = () => {
  const [layoutConfig, setLayoutConfig] = useLayoutConfig(
    'https://localhost:8443/api/vui/steve',
    defaultLayout
  );

  console.log(`%cApp render`, 'color:green');

  const handleLayoutChange = useCallback(
    (layout) => {
      setLayoutConfig(layout);
    },
    [setLayoutConfig]
  );

  return (
    <Shell
      layout={layoutConfig}
      onLayoutChange={handleLayoutChange}
      paletteConfig={paletteConfig}
    />
  );
};
/*
      <ContextMenuProvider
        menuActionHandler={handleMenuAction}
        menuBuilder={buildViewserverMenuOptions}
      >
      <GridProvider value={{ dispatchGridAction }}>
      </GridProvider>
      </ContextMenuProvider>
*/
