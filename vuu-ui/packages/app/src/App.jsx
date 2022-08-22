import React, { useCallback, useMemo, useState } from 'react';
import { Shell } from '@vuu-ui/shell';
import * as layout from './Layouts';
import './App.css';

const simpleComponentUrl = './features/simple-component/index.js';

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
  const [layoutConfig, setLayoutConfig] = useState(defaultLayout);
  const user = useMemo(() => ({ name: 'steve' }), []);

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
      user={user}
    />
  );
};
