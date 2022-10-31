import React, { useCallback, useState } from "react";
import {
  Component,
  FlexboxLayout as Flexbox,
  LayoutProvider,
  StackLayout,
  View,
} from "@vuu-ui/layout";

// import '@vuu-ui/theme/index.css';
// import '@vuu-ui/layout/index.css';

export default {
  title: "Layout/Stack",
  component: StackLayout,
};

export const FourTabsControlled = () => {
  const [active, setActive] = useState(0);

  const handleTabSelection = useCallback((e, tabIndex) => {
    console.log(`setActive ${tabIndex}`);
    setActive(tabIndex);
  }, []);

  return (
    <LayoutProvider>
      <StackLayout
        active={active}
        onTabSelectionChanged={handleTabSelection}
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

export const EnableAddTab = () => {
  // const createContent = (index) => (
  //   <View
  //     style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }}
  //     title={`Tab ${index}`}
  //     header
  //     closeable
  //   >
  //     <Component style={{ backgroundColor: "green", height: "100%" }} />
  //   </View>
  // );

  return (
    <LayoutProvider>
      <StackLayout
        showTabs
        enableAddTab
        // createNewChild={createContent}
        style={{ width: 800, height: 500 }}
        active={0}
        resizeable
        preserve
      >
        <View title="Rebecca" header>
          <Component
            style={{
              backgroundColor: "rebeccapurple",
              height: "100%",
              width: "100%",
            }}
          />
        </View>
      </StackLayout>
    </LayoutProvider>
  );
};

export const EmptyStackAddTab = () => {
  const createContent = (index) => (
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
      showTabs
      enableAddTab
      createNewChild={createContent}
      style={{ width: 800, height: 500 }}
      resizeable
      preserve
    ></StackLayout>
  );
};

export const TabsWithinTabs = () => (
  <LayoutProvider>
    <StackLayout
      showTabs
      style={{ width: 800, height: 500 }}
      active={0}
      resizeable
    >
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

      <Flexbox title="Nested Substack" style={{ flexDirection: "column" }}>
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

export const TabsWithFlexChildren = () => {
  const handleLayoutChange = (layout) => {
    console.log(JSON.stringify(layout, null, 2));
  };

  return (
    <LayoutProvider>
      <StackLayout
        showTabs
        style={{ width: 800, height: 500 }}
        active={0}
        resizeable
        onLayoutChange={handleLayoutChange}
      >
        <Flexbox title="Tower" style={{ flexDirection: "column", flex: 1 }}>
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
