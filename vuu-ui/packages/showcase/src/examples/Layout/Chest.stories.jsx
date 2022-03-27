import React, { useRef, useState } from 'react';

import { List } from '@vuu-ui/ui-controls';
import {
  ChevronDoubleLeftButton,
  ChevronDoubleRightButton,
  Component,
  Chest,
  Drawer,
  Flexbox,
  Stack,
  View
} from '@vuu-ui/layout';

import './Chest.stories.css';

export default {
  title: 'Layout/Chest',
  component: Chest
};

const InlineDrawer = ({ inline, position, peekaboo }) => {
  const list = useRef(null);
  const [open, setOpen] = useState(false);
  const handleClick = (e) => {
    if (!list.current?.contains(e.target)) {
      setOpen(!open);
    }
  };
  return (
    <Chest style={{ width: '100vw', height: '100vh' }}>
      <Drawer
        inline={inline}
        onClick={handleClick}
        open={open}
        peekaboo={peekaboo}
        position={position}
        title="Rebecca">
        <List ref={list}>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
          <div>Item 4</div>
          <div>Item 5</div>
          <div>Item 6</div>
        </List>
      </Drawer>
      <Component
        title="Cornflower"
        style={{ backgroundColor: 'cornflowerblue', height: '100%', width: '100%' }}
        onClick={handleClick}
      />
    </Chest>
  );
};

export const LeftInlineDrawerPeek = () => <InlineDrawer position="left" inline peekaboo />;

export const RightInlineDrawerPeek = () => <InlineDrawer position="right" inline peekaboo />;

export const TopInlineDrawerPeek = () => <InlineDrawer position="top" inline peekaboo />;

export const BottomInlineDrawerPeek = () => <InlineDrawer position="bottom" inline peekaboo />;

export const LeftOverlayDrawerPeek = () => <InlineDrawer position="left" peekaboo />;

export const RightOverlayDrawerPeek = () => <InlineDrawer position="right" peekaboo />;

export const TopOverlayDrawerPeek = () => <InlineDrawer position="top" peekaboo />;

export const BottomOverlayDrawerPeek = () => <InlineDrawer position="bottom" peekaboo />;

export const LeftInlineDrawer = () => <InlineDrawer position="left" inline />;

export const RightInlineDrawer = () => <InlineDrawer position="right" inline />;

export const TopInlineDrawer = () => <InlineDrawer position="top" inline />;

export const BottomInlineDrawer = () => <InlineDrawer position="bottom" inline />;

export const LeftOverlayDrawer = () => <InlineDrawer position="left" />;

export const RightOverlayDrawer = () => <InlineDrawer position="right" />;

export const TopOverlayDrawer = () => <InlineDrawer position="top" />;

export const BottomOverlayDrawer = () => <InlineDrawer position="bottom" />;

export const LeftInlineDrawerStack = () => {
  const [open, setOpen] = useState(false);
  const handleClick = () => setOpen(!open);
  return (
    <Flexbox style={{ width: 900, height: 700, flexDirection: 'column' }}>
      <Chest style={{ flex: 1, '--hw-chest-bg': 'inherit' }}>
        <Drawer
          inline
          peekaboo
          onClick={handleClick}
          open={open}
          position="left"
          title="Rebecca"></Drawer>
        <Stack showTabs style={{ width: '100%', height: '100%' }}>
          <Component
            title="Cornflower"
            resizeable
            style={{ backgroundColor: 'cornflowerblue', flex: 1 }}
            header
            onClick={handleClick}
          />
          <Component
            title="Rebeccas"
            resizeable
            style={{ backgroundColor: 'rebeccapurple', flex: 1 }}
            header
            onClick={handleClick}
          />
        </Stack>
      </Chest>

      <div style={{ height: 40, backgroundColor: '#ccc' }} />
    </Flexbox>
  );
};
export const LeftInlineDrawerFlexbox = () => {
  const [open, setOpen] = useState(false);
  const handleClick = () => setOpen(!open);
  return (
    <Chest style={{ width: '100vw', height: '100vh' }}>
      <Drawer inline onClick={handleClick} open={open} position="left" title="Rebecca">
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ height: 40, width: '100%', backgroundColor: '#ddd' }}>
            {open ? <ChevronDoubleLeftButton onClick={handleClick} /> : null}
          </div>
        </div>
      </Drawer>
      <Flexbox style={{ width: '100%', height: '100%', flexDirection: 'column' }}>
        <Flexbox style={{ flex: 1 }}>
          <View className="viewCornflower" title="Cornflower" header resizeable style={{ flex: 1 }}>
            <Component onClick={handleClick} style={{ height: '100%' }} />
          </View>
          <View
            className="viewRebecca"
            title="Rebecca"
            header
            style={{ flex: 1 }}
            resizeable
            resize="defer">
            <Component onClick={handleClick} />
          </View>
        </Flexbox>
        <div style={{ height: 40, backgroundColor: '#ccc' }}>
          {open ? null : <ChevronDoubleRightButton onClick={handleClick} />}
        </div>
      </Flexbox>
    </Chest>
  );
};

export const InlineDrawerFlexboxVariants = () => {
  const [open, setOpen] = useState(false);
  const handleClick = () => setOpen(!open);
  return (
    <>
      <Chest style={{ width: 700, height: 300, margin: 50 }}>
        <Drawer inline onClick={handleClick} open={open} position="left" title="Rebecca">
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ height: 40, width: '100%' }}>
              {open ? <ChevronDoubleLeftButton onClick={handleClick} /> : null}
            </div>
          </div>
        </Drawer>
        <Flexbox style={{ width: '100%', height: '100%', flexDirection: 'column' }}>
          <Flexbox style={{ flex: 1 }}>
            <Component
              title="Cornflower"
              resizeable
              style={{ backgroundColor: 'cornflowerblue', flex: 1 }}
              header
              onClick={handleClick}
            />
            <Component
              title="Rebeccas"
              resizeable
              style={{ backgroundColor: 'rebeccapurple', flex: 1 }}
              header
              onClick={handleClick}
            />
          </Flexbox>
          <div style={{ height: 40, backgroundColor: '#ccc' }}>
            {open ? null : <ChevronDoubleLeftButton onClick={handleClick} />}
          </div>
        </Flexbox>
      </Chest>

      <Flexbox style={{ width: 700, height: 300, margin: 50, flexDirection: 'column' }}>
        <Chest style={{ flex: 1 }}>
          <Drawer inline onClick={handleClick} open={open} position="left" title="Rebecca">
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'flex-end'
              }}></div>
          </Drawer>
          <Flexbox style={{ width: '100%', height: '100%' }}>
            <Component
              title="Cornflower"
              resizeable
              style={{ backgroundColor: 'cornflowerblue', flex: 1 }}
              header
              onClick={handleClick}
            />
            <Component
              title="Rebeccas"
              resizeable
              style={{ backgroundColor: 'rebeccapurple', flex: 1 }}
              header
              onClick={handleClick}
            />
          </Flexbox>
        </Chest>
        <div style={{ height: 40, backgroundColor: '#ccc' }}>
          {open ? (
            <ChevronDoubleLeftButton onClick={handleClick} />
          ) : (
            <ChevronDoubleRightButton onClick={handleClick} />
          )}
        </div>
      </Flexbox>
    </>
  );
};

export const CustomSizeDrawer = () => {
  return (
    <Chest style={{ width: '100vw', height: '100vh' }}>
      <Drawer clickToOpen inline sizeClosed={24} sizeOpen={100} position="left" peekaboo>
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ height: 40, width: '100%', backgroundColor: '#ddd' }}></div>
        </div>
      </Drawer>
      <Flexbox style={{ width: '100%', height: '100%', flexDirection: 'column' }}>
        <Flexbox style={{ flex: 1 }}>
          <Component
            title="Cornflower"
            resizeable
            style={{ backgroundColor: 'cornflowerblue', flex: 1 }}
            header
          />
          <Component
            title="Rebeccas"
            resizeable
            style={{ backgroundColor: 'rebeccapurple', flex: 1 }}
            header
          />
        </Flexbox>
        <div style={{ height: 40, backgroundColor: '#ccc' }}></div>
      </Flexbox>
    </Chest>
  );
};

export const WithToggleButton = () => {
  return (
    <Chest style={{ width: '100vw', height: '100vh' }}>
      <Drawer inline position="left" peekaboo toggleButton="end" />
      <Flexbox style={{ width: '100%', height: '100%', flexDirection: 'column' }}>
        <Flexbox style={{ flex: 1 }}>
          <Component
            title="Cornflower"
            resizeable
            style={{ backgroundColor: 'cornflowerblue', flex: 1 }}
            header
          />
          <Component
            title="Rebeccas"
            resizeable
            style={{ backgroundColor: 'rebeccapurple', flex: 1 }}
            header
          />
        </Flexbox>
      </Flexbox>
    </Chest>
  );
};
