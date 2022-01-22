import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ThemeProvider } from '@vuu-ui/theme';
import { connectToServer /*, useViewserver */ } from '@vuu-ui/data-remote';
import useLayoutConfig from './use-layout-config';

import { Chest, DraggableLayout, Drawer, FlexboxLayout as Flexbox, View } from '@vuu-ui/layout';
import { AppHeader } from './app-header';
import { AppPalette } from './app-palette';

import './shell.css';

export const Shell = ({ children, defaultLayout, paletteConfig, serverUrl, user }) => {
  const paletteView = useRef(null);
  const [open, setOpen] = useState(false);

  const [layout, setLayoutConfig] = useLayoutConfig(user, defaultLayout);

  const handleLayoutChange = useCallback(
    (layout) => {
      setLayoutConfig(layout);
    },
    [setLayoutConfig]
  );

  const handleDrawerClick = (e) => {
    if (!paletteView.current?.contains(e.target)) {
      setOpen(!open);
    }
  };

  useEffect(() => {
    connectToServer(serverUrl, user.token);
  }, [serverUrl, user.token]);

  return (
    <ThemeProvider>
      <DraggableLayout
        className="hw"
        style={{ width: '100vw', height: '100vh' }}
        onLayoutChange={handleLayoutChange}
        layout={layout}>
        <Flexbox id="fb-app" className="App" style={{ flexDirection: 'column', height: '100%' }}>
          <AppHeader user={user} />
          <Chest style={{ flex: 1 }}>
            <Drawer
              onClick={handleDrawerClick}
              open={open}
              position="left"
              inline
              peekaboo
              sizeOpen={200}
              toggleButton="end">
              <View
                id="vw-app-palette"
                key="app-palette"
                ref={paletteView}
                title="Views"
                header
                style={{ height: '100%' }}>
                <AppPalette config={paletteConfig} style={{ flex: 1, width: 200 }} />
              </View>
            </Drawer>
            <DraggableLayout dropTarget style={{ width: '100%', height: '100%' }}>
              {/*<Stack style={{ width: '100%', height: '100%' }} showTabs enableAddTab preserve>
                  <Placeholder title="Page 1" closeable={false} />
              </Stack> */}
            </DraggableLayout>
          </Chest>
        </Flexbox>
      </DraggableLayout>
      {children}
    </ThemeProvider>
  );
};
