import React, { useState } from 'react';

import '@vuu-ui/theme';

import { ConfigWrapper, Flexbox, FlexboxLayout, Stack, View, Component } from '@vuu-ui/layout';
import { Brown, Red } from './sample-components';

const story = {
  title: 'Layout/FlexboxLayout',
  component: FlexboxLayout
};

export default story;

// const StandardToolbar = () => (
//   <Toolbar style={{ justifyContent: "flex-end" }} draggable showTitle>
//   </Toolbar>
// );
// registerComponent("StandardToolbar", StandardToolbar);

export const Empty = () => (
  <FlexboxLayout
    style={{
      width: 600,
      height: 300,
      flexDirection: 'row',
      border: '2px solid black',
      backgroundColor: '#ccc'
    }}
  />
);

export const SingleChild = () => {
  return (
    <ConfigWrapper>
      <Flexbox
        style={{
          width: 600,
          height: 300,
          flexDirection: 'row',
          border: '2px solid black',
          backgroundColor: '#ccc'
        }}
      >
        <Component
          title="R Component"
          style={{
            flex: 1,
            backgroundColor: 'red',
            margin: 10,
            border: '3px solid limegreen'
          }}
        />
      </Flexbox>
    </ConfigWrapper>
  );
};

export const SimpleTower = () => {
  const handleSplitterMoved = (sizes) => {
    console.log(`splitter moved ${JSON.stringify(sizes)}`);
  };
  return (
    <div style={{ width: 700, height: 600, display: 'flex', gap: 25 }}>
      <Flexbox
        style={{
          width: 300,
          height: 600,
          flexDirection: 'column',
          border: 'solid 1px lightgrey'
        }}
        onSplitterMoved={handleSplitterMoved}
      >
        <View resizeable style={{ flexBasis: 150, flexShrink: 0, flexGrow: 0 }}>
          <Component style={{ flex: 1, backgroundColor: 'yellow' }} />
        </View>
        <View resizeable style={{ flex: 1 }}>
          <Component style={{ flex: 1, backgroundColor: 'red' }} />
        </View>
      </Flexbox>

      <FlexboxLayout
        style={{
          width: 300,
          height: 600,
          flexDirection: 'column',
          border: 'solid 1px lightgrey'
        }}
        onSplitterMoved={handleSplitterMoved}
      >
        <View resizeable style={{ flexBasis: 150, flexShrink: 0, flexGrow: 0 }}>
          <Component style={{ flex: 1, backgroundColor: 'yellow' }} />
        </View>
        <View resizeable style={{ flex: 1 }}>
          <Component style={{ flex: 1, backgroundColor: 'red' }} />
        </View>
      </FlexboxLayout>
    </div>
  );
};

export const ThreeChildTower = () => {
  const handleSplitterMoved = (sizes) => {
    console.log(`splitter moved ${JSON.stringify(sizes)}`);
  };
  return (
    <div style={{ width: 700, height: 600, display: 'flex', gap: 25 }}>
      <Flexbox
        style={{
          width: 300,
          height: 600,
          flexDirection: 'column',
          border: 'solid 1px lightgrey'
        }}
        onSplitterMoved={handleSplitterMoved}
      >
        <View resizeable style={{ flexBasis: 150, flexShrink: 0, flexGrow: 0 }}>
          <Component style={{ flex: 1, backgroundColor: 'yellow' }} />
        </View>
        <View resizeable style={{ flex: 1 }}>
          <Component style={{ flex: 1, backgroundColor: 'orange' }} />
        </View>
        <View resizeable style={{ flex: 1 }}>
          <Component style={{ flex: 1, backgroundColor: 'red' }} />
        </View>
      </Flexbox>

      <FlexboxLayout
        style={{
          width: 300,
          height: 600,
          flexDirection: 'column',
          border: 'solid 1px lightgrey'
        }}
        onSplitterMoved={handleSplitterMoved}
      >
        <View resizeable style={{ flexBasis: 150, flexShrink: 0, flexGrow: 0 }}>
          <Component style={{ flex: 1, backgroundColor: 'yellow' }} />
        </View>
        <View resizeable style={{ flex: 1 }}>
          <Component style={{ flex: 1, backgroundColor: 'orange' }} />
        </View>
        <View resizeable style={{ flex: 1 }}>
          <Component style={{ flex: 1, backgroundColor: 'red' }} />
        </View>
      </FlexboxLayout>
    </div>
  );
};
export const TerraceWithBorderPaddingMargin = () => (
  <FlexboxLayout
    style={{
      width: 600,
      height: 300,
      flexDirection: 'row',
      border: '2px solid black',
      margin: 20,
      padding: '10px 30px',
      backgroundColor: '#ccc'
    }}
  >
    <Component
      title="Y Component"
      style={{
        flex: 1,
        backgroundColor: 'yellow',
        border: '10px solid rgba(0,0,0,.4)'
      }}
    />
    <Component title="R Component" style={{ flex: 1, backgroundColor: 'red' }} />
  </FlexboxLayout>
);

export const TerraceAutoSizing = () => (
  <FlexboxLayout
    style={{
      width: '80%',
      height: 300,
      flexDirection: 'row',
      border: '2px solid black',
      margin: 20,
      padding: '10px 30px',
      backgroundColor: '#ccc'
    }}
  >
    {/* <div style={{flexBasis: 0, flexShrink: 0, flexGrow: 0,  backgroundColor: 'rgba(0,0,0,.2)'}} data-resizeable data-placeholder data-zero-size/> */}
    <Component
      title="Y Component"
      style={{
        // flex: 1,
        width: 200,
        boxSizing: 'border-box',
        minHeight: 200,
        maxHeight: 230,
        backgroundColor: 'yellow',
        border: '10px solid rgba(0,0,0,.4)'
      }}
      data-resizeable
    />
    <Component
      title="R Component"
      style={{
        // flex: 1,
        width: 300,
        height: 300,
        backgroundColor: 'red'
      }}
      data-resizeable
    />
    {/* <div style={{flexBasis: 0, flexShrink: 1, flexGrow: 1, backgroundColor: 'rgba(0,0,0,.2)'}} data-resizeable data-placeholder/> */}
  </FlexboxLayout>
);

export const TerraceWithHeader = () => (
  <FlexboxLayout
    title="Flexie"
    header={true}
    style={{
      width: 600,
      height: 300,
      flexDirection: 'row',
      border: '2px solid black',
      margin: 20,
      padding: '10 30',
      backgroundColor: '#ccc'
    }}
  >
    <Component
      title="Y Component"
      style={{
        flex: 1,
        backgroundColor: 'yellow',
        border: '10px solid rgba(0,0,0,.4)'
      }}
    />
    <Component title="R Component" style={{ flex: 1, backgroundColor: 'red' }} />
  </FlexboxLayout>
);

const handleLayoutChanged = (layout) => console.log(JSON.stringify(layout, null, 2));

export const TowerWithinTerrace = () => (
  <div>
    <Flexbox
      style={{
        width: 600,
        height: 300,
        flexDirection: 'row',
        border: 'solid 1px grey'
      }}
    >
      <View title="Y Component" style={{ flex: 1, backgroundColor: 'yellow' }} resizeable />
      <Flexbox style={{ flex: 1, flexDirection: 'column' }} resizeable>
        <View title="B Component" style={{ flex: 1, backgroundColor: 'red' }} resizeable />
        <View
          title="R Component"
          style={{ flexBasis: 100, flexShrink: 0, flexGrow: 0, backgroundColor: 'green' }}
          resizeable
        />
      </Flexbox>
    </Flexbox>
    <br />
    <FlexboxLayout
      style={{
        width: 600,
        height: 300,
        flexDirection: 'row',
        border: 'solid 1px grey'
      }}
    >
      <View title="Y Component" style={{ flex: 1, backgroundColor: 'yellow' }} resizeable />
      <FlexboxLayout style={{ flex: 1, flexDirection: 'column' }} resizeable>
        <View title="B Component" style={{ flex: 1, backgroundColor: 'red' }} resizeable />
        <View
          title="R Component"
          style={{ flexBasis: 100, flexShrink: 0, flexGrow: 0, backgroundColor: 'green' }}
          resizeable
        />
      </FlexboxLayout>
    </FlexboxLayout>
  </div>
);

//export const TerraceWithAlignment = () => <TerraceAlignment />;

export const QuadTerraceWithinTower = () => (
  <FlexboxLayout style={{ flexDirection: 'column', width: 500, height: 500 }}>
    <View header closeable seable title="W Component" style={{ height: 100 }}>
      <Component style={{ height: '100%', backgroundColor: 'rebeccapurple' }} />
    </View>
    <FlexboxLayout style={{ flex: 1, flexDirection: 'row' }}>
      <Component
        title="W Component"
        style={{ flex: 1, backgroundColor: 'red' }}
        resizeable
        header
      />
      <Component
        title="Y Component"
        style={{ flex: 1, backgroundColor: 'green' }}
        resizeable
        header
      />
      <Component
        title="ZY Component"
        style={{ flex: 1, backgroundColor: 'blue' }}
        resizeable
        header
      />
      <Component
        title="R Component"
        style={{ flex: 1, backgroundColor: 'yellow' }}
        resizeable
        header
      />
    </FlexboxLayout>
  </FlexboxLayout>
);

export const DeeperNesting = () => (
  <ConfigWrapper>
    <FlexboxLayout
      onLayoutChange={handleLayoutChanged}
      style={{ width: 800, height: 500, flexDirection: 'row' }}
    >
      <View title="Y Component" style={{ flex: 1, backgroundColor: 'yellow' }} header resizeable />
      <FlexboxLayout style={{ flex: 1, flexDirection: 'column' }} resizeable>
        <FlexboxLayout
          style={{ flex: 2, flexGrow: 1, flexShrink: 1, flexDirection: 'row' }}
          resizeable
        >
          <FlexboxLayout style={{ flex: 1, flexDirection: 'column' }} resizeable>
            <View
              title="B Component"
              style={{
                border: '1px solid red',
                flex: 1,
                flexGrow: 1,
                flexShrink: 1,
                backgroundColor: 'orange'
              }}
              header
              resizeable
            />
            <View
              title="R Component"
              style={{
                flex: 1,
                flexGrow: 1,
                flexShrink: 1,
                backgroundColor: 'brown'
              }}
              header
              resizeable
            />
          </FlexboxLayout>
          <View
            title="R Component"
            style={{ flex: 1, backgroundColor: 'rebeccapurple' }}
            header
            resizeable
          />
        </FlexboxLayout>
        <View
          title="B Component"
          style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'blue' }}
          header
          resizeable
        />
        <View
          title="R Component"
          style={{ flex: 1, flexGrow: 1, flexShrink: 1, backgroundColor: 'red' }}
          header
          resizeable
        />
      </FlexboxLayout>
    </FlexboxLayout>
  </ConfigWrapper>
);

export const ComplexNestedLayout = () => (
  <FlexboxLayout column style={{ height: '90vh', width: '100vw' }} className="hw">
    <FlexboxLayout style={{ flex: 1 }}>
      <View
        closeable
        header
        resizeable
        style={{ minWidth: 50, flexBasis: 200, flexGrow: 0, flexShrink: 0 }}
        title="View Palette"
      />
      <FlexboxLayout resizeable column style={{ flex: 1 }}>
        <View closeable header resizeable style={{ flex: 1 }} title="Brown Bear">
          <Brown style={{ height: '100%' }} />
        </View>
        <View closeable header resizeable style={{ flex: 1 }} title="Red Panda">
          <Component style={{ backgroundColor: 'red', height: '100%' }} />
        </View>

        <FlexboxLayout resizeable style={{ flex: 1 }}>
          <Stack enableAddTab resizeable showTabs style={{ flex: 1 }} keyBoardActivation="manual">
            <View closeable header resizeable title="Home">
              <Component style={{ backgroundColor: 'white', height: '100%' }} />
            </View>
            <View title="Transactions">
              <Component style={{ backgroundColor: 'yellow', flex: 1 }} />
            </View>
            <View closeable header resizeable title="Loans">
              <Component style={{ backgroundColor: 'cream', height: '100%' }} />
            </View>
            <View closeable header resizeable title="Checks">
              <Component style={{ backgroundColor: 'ivory', height: '100%' }} />
            </View>
            <View closeable header resizeable title="Liquidity">
              <Component style={{ backgroundColor: 'lightgrey', height: '100%' }} />
            </View>
          </Stack>
          <Component resizeable style={{ backgroundColor: 'green', width: 50 }} />
        </FlexboxLayout>
      </FlexboxLayout>
    </FlexboxLayout>
    <Component style={{ backgroundColor: 'grey', height: 32 }} />
  </FlexboxLayout>
);
