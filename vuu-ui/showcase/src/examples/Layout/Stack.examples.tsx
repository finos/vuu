import {
  Component,
  FlexboxLayout as Flexbox,
  LayoutProvider,
  StackLayout,
  View,
} from "@finos/vuu-layout";
import { useState } from "react";

let displaySequence = 1;

const allowAddTab = true;
const allowCloseTab = true;
const allowRenameTab = true;

export const FourTabStack = () => {
  return (
    <LayoutProvider>
      <StackLayout active={0} style={{ width: 800, height: 500 }}>
        <Component
          title="Rebecca "
          style={{ backgroundColor: "rebeccapurple" }}
        />
        <Component title="Red" style={{ backgroundColor: "red" }} />
        <Component title="Alice" style={{ backgroundColor: "aliceblue" }} />
        <Component
          title="Cornflower"
          style={{ backgroundColor: "cornflowerblue" }}
        />
      </StackLayout>
    </LayoutProvider>
  );
};

FourTabStack.displaySequence = displaySequence++;

export const FourTabStackAllowRename = () => {
  return (
    <LayoutProvider>
      <StackLayout
        active={0}
        style={{ width: 800, height: 500 }}
        TabstripProps={{ allowRenameTab }}
      >
        <Component
          title="Rebecca "
          style={{ backgroundColor: "rebeccapurple" }}
        />
        <Component title="Red" style={{ backgroundColor: "red" }} />
        <Component title="Alice" style={{ backgroundColor: "aliceblue" }} />
        <Component
          title="Cornflower"
          style={{ backgroundColor: "cornflowerblue" }}
        />
      </StackLayout>
    </LayoutProvider>
  );
};

FourTabStackAllowRename.displaySequence = displaySequence++;

export const FourTabStackAllowClose = () => {
  return (
    <LayoutProvider>
      <StackLayout
        active={0}
        style={{ width: 800, height: 500 }}
        TabstripProps={{ allowCloseTab }}
      >
        <Component
          title="Rebecca "
          style={{ backgroundColor: "rebeccapurple" }}
        />
        <Component title="Red" style={{ backgroundColor: "red" }} />
        <Component title="Alice" style={{ backgroundColor: "aliceblue" }} />
        <Component
          title="Cornflower"
          style={{ backgroundColor: "cornflowerblue" }}
        />
      </StackLayout>
    </LayoutProvider>
  );
};

FourTabStackAllowClose.displaySequence = displaySequence++;

export const FourTabStackAllowAddCloseRenameTab = () => {
  return (
    <LayoutProvider>
      <StackLayout
        active={0}
        style={{ width: 800, height: 500 }}
        TabstripProps={{ allowAddTab, allowCloseTab, allowRenameTab }}
      >
        <Component
          title="Rebecca "
          style={{ backgroundColor: "rebeccapurple" }}
        />
        <Component title="Red" style={{ backgroundColor: "red" }} />
        <Component title="Alice" style={{ backgroundColor: "aliceblue" }} />
        <Component
          title="Cornflower"
          style={{ backgroundColor: "cornflowerblue" }}
        />
      </StackLayout>
    </LayoutProvider>
  );
};

FourTabStackAllowAddCloseRenameTab.displaySequence = displaySequence++;

export const VerticalTabsControlled = () => {
  const [active] = useState(0);

  return (
    <LayoutProvider>
      <StackLayout
        TabstripProps={{ orientation: "vertical" }}
        active={active}
        showTabs
        style={{ width: 800, height: 500 }}
      >
        <Component
          title="Rebecca "
          style={{ backgroundColor: "rebeccapurple" }}
        />
        <Component title="Red" style={{ backgroundColor: "red" }} />
        <Component title="Alice" style={{ backgroundColor: "aliceblue" }} />
        <Component
          title="Cornflower"
          style={{ backgroundColor: "cornflowerblue" }}
        />
      </StackLayout>
    </LayoutProvider>
  );
};

VerticalTabsControlled.displaySequence = displaySequence++;

export const EmptyStackAddTab = () => {
  const createContent = (index: number) => (
    <View
      style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }}
      title={`Tab ${index}`}
      header
      closeable
    >
      <Component style={{ backgroundColor: "green", height: "100%" }} />
    </View>
  );

  return (
    <StackLayout
      TabstripProps={{
        allowAddTab: true,
      }}
      showTabs
      createNewChild={createContent}
      style={{ width: 800, height: 500 }}
    ></StackLayout>
  );
};

EmptyStackAddTab.displaySequence = displaySequence++;

export const TabsWithinTabs = () => (
  <LayoutProvider>
    <StackLayout showTabs style={{ width: 800, height: 500 }} active={0}>
      <StackLayout showTabs active={0} title="Substack 1">
        <View title="Rebecca" header>
          <Component style={{ backgroundColor: "rebeccapurple", flex: 1 }} />
        </View>
        <View title="Red" header>
          <Component style={{ backgroundColor: "red", flex: 1 }} />
        </View>
        <View title="Alice" header>
          <Component style={{ backgroundColor: "aliceblue" }} />
        </View>
      </StackLayout>

      <Flexbox
        title="Nested Substack"
        style={{ flexDirection: "column" }}
        path=""
      >
        <View title="Red" header>
          <Component title="Red" style={{ backgroundColor: "red", flex: 1 }} />
        </View>
        <StackLayout showTabs active={0} title="Substack 2">
          <View title="Alice" header>
            <Component style={{ backgroundColor: "aliceblue", flex: 1 }} />
          </View>
          <View title="Gordon" header>
            <Component style={{ backgroundColor: "brown", flex: 1 }} />
          </View>
          <View title="Jack" header>
            <Component style={{ backgroundColor: "black", flex: 1 }} />
          </View>
        </StackLayout>
      </Flexbox>
      <View title="Cornflower" header>
        <Component style={{ backgroundColor: "cornflowerblue" }} />
      </View>
    </StackLayout>
  </LayoutProvider>
);

TabsWithinTabs.displaySequence = displaySequence++;

export const TabsWithFlexChildren = () => {
  const handleLayoutChange = (layout: any) => {
    console.log(JSON.stringify(layout, null, 2));
  };

  return (
    <LayoutProvider onLayoutChange={handleLayoutChange}>
      <StackLayout showTabs style={{ width: 800, height: 500 }} active={0}>
        <Flexbox
          title="Tower"
          style={{ flexDirection: "column", flex: 1 }}
          path=""
        >
          <View
            title="Red"
            header
            resizeable
            style={{ flex: 1, backgroundColor: "red" }}
          />
          <View
            title="Red"
            header
            resizeable
            style={{ flex: 1, backgroundColor: "blue" }}
          />
        </Flexbox>
        <Flexbox
          title="Terrace"
          style={{ flexDirection: "row", height: "100%" }}
          path=""
        >
          <View
            title="Red"
            header
            resizeable
            style={{ flex: 1, backgroundColor: "red" }}
          />
          <View
            title="Red"
            header
            resizeable
            style={{ flex: 1, backgroundColor: "blue" }}
          />
        </Flexbox>
      </StackLayout>
    </LayoutProvider>
  );
};

TabsWithFlexChildren.displaySequence = displaySequence++;
