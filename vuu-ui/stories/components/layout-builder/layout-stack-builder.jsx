import React from 'react';

import {
  FlexboxLayout,
  Component,
  DraggableLayout,
  Palette,
  PaletteItem,
  Placeholder,
  StackLayout,
  View
} from '@vuu-ui/layout';
import * as layout from '../layouts';

import './layout-builder.css';

export default function LayoutStackBuilder({ width = 800, height = 1000 }) {
  const onLayoutModel = (layoutModel) => {
    console.log({ layoutModel });
    // setState(prevState => ({
    //     ...prevState,
    //     managedLayoutNode: layoutModel
    // }));
  };

  return (
    <DraggableLayout style={{ width: '100vw', height: '100vh' }}>
      <FlexboxLayout
        className="LayoutBuilder"
        style={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        <div style={{ height: 60, borderBottom: 'solid 1px #ccc' }} />
        <FlexboxLayout style={{ flexDirection: 'row', flex: 1 }} id="flex-main">
          <View
            className="builder-top"
            header
            resizeable
            style={{ flexBasis: 200, flexGrow: 0, flexShrink: 0 }}
            title="Palette"
            dropTargets={['flex-main']}>
            <Palette
              collapsibleHeaders
              orientation="vertical"
              style={{ backgroundColor: 'inherit' }}>
              <div data-header>Pages</div>
              <PaletteItem title="Page 1" template closeable resizeable header>
                {layout.twoRows}
              </PaletteItem>
              <PaletteItem title="Page 2" template closeable resizeable header>
                {layout.twoRows}
              </PaletteItem>

              <div data-header>Flex Layouts</div>
              <PaletteItem title="Holy Grail" template closeable resizeable header>
                {layout.holyGrail}
              </PaletteItem>
              <PaletteItem title="Responsive Example" template>
                {layout.responsiveExample}
              </PaletteItem>
              <PaletteItem title="2 Rows" template closeable resizeable header>
                {layout.twoRows}
              </PaletteItem>
              <PaletteItem title="3 Rows" template closeable resizeable header>
                {layout.threeRows}
              </PaletteItem>
              <PaletteItem title="4 Rows" template closeable resizeable header>
                {layout.fourRows}
              </PaletteItem>
              <PaletteItem title="Fluid Grid 12 rows" template>
                {layout.responsive_12_col}
              </PaletteItem>

              <div data-header>Intrinsic Size Components</div>
              <PaletteItem
                title="Small 200 x 150"
                closeable
                header
                style={{ width: 200, height: 150 }}>
                <Component
                  style={{
                    backgroundColor: 'rgba(0,0,255,.3)',
                    height: '100%'
                  }}
                />
              </PaletteItem>
              <PaletteItem
                title="Medium 300 x 250"
                closeable
                header
                style={{ width: 300, height: 250 }}>
                <Component
                  style={{
                    backgroundColor: 'rgba(0,255,255,.3)',
                    height: '100%'
                  }}
                />
              </PaletteItem>
              <div data-header>Flex Components</div>
              <PaletteItem label="Brown Sugar" closeable resizeable header>
                <Component
                  style={{
                    backgroundColor: 'rgba(255,0,0,.5)',
                    height: '100%'
                  }}
                />
              </PaletteItem>
              <PaletteItem label="Green Day" closeable resizeable header>
                <Component
                  style={{
                    backgroundColor: 'rgba(0,255,0,.5)',
                    height: '100%'
                  }}
                />
              </PaletteItem>
              <PaletteItem label="Lemonheads" closeable resizeable header>
                <Component
                  style={{
                    backgroundColor: 'rgba(255,255,0,.4)',
                    height: '100%'
                  }}
                />
              </PaletteItem>
              <div data-header>Content Layouts</div>
              <PaletteItem title="3 Rows" template closeable resizeable header>
                {layout.threeRowsContent}
              </PaletteItem>
              <PaletteItem title="3 Columns" template closeable resizeable header>
                {layout.threeColumnsContent}
              </PaletteItem>
              <div data-header>Sized Components</div>
              <PaletteItem title="Yellow 150" closeable resizeable template header>
                <Component
                  style={{
                    backgroundColor: 'yellow',
                    flexBasis: 150,
                    flexGrow: 0,
                    flexShrink: 0,
                    minHeight: 100
                  }}
                />
              </PaletteItem>
              <PaletteItem title="Pink 250" closeable resizeable template header>
                <Component
                  style={{
                    backgroundColor: 'pink',
                    flexBasis: 250,
                    flexGrow: 0,
                    flexShrink: 0
                  }}
                />
              </PaletteItem>
              <PaletteItem title="Blue 400" closeable resizeable template header>
                <Component
                  style={{
                    backgroundColor: 'cornflowerblue',
                    flexBasis: 400,
                    flexGrow: 0,
                    flexShrink: 0
                  }}
                />
              </PaletteItem>
            </Palette>
          </View>
          <DraggableLayout
            style={{ flex: 1 }}
            dropTarget
            onLayoutModel={onLayoutModel}
            resizeable
            id="main-drag">
            <StackLayout
              showTabs
              style={{ width: '100%', height: '100%' }}
              enableCloseTabs
              preserve>
              <Placeholder title="Page 1" closeable={false} />
              <View title="Page 2" style={{ flex: 1 }}>
                <Component
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'yellow'
                  }}
                  resizeable
                />
              </View>
            </StackLayout>
          </DraggableLayout>
        </FlexboxLayout>
      </FlexboxLayout>
    </DraggableLayout>
  );
}
