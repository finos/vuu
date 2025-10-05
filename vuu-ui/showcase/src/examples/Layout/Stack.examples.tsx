import {
  Component,
  FlexboxLayout as Flexbox,
  LayoutChangeHandler,
  LayoutProvider,
  StackLayout,
  View,
} from "@vuu-ui/vuu-layout";
import { useCallback, useState } from "react";

const allowAddTab = true;
const allowCloseTab = true;
const allowRenameTab = true;

export const FourTabStack = () => {
  return (
    <LayoutProvider>
      <StackLayout style={{ width: 800, height: 500 }}>
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

export const FourTabsLeft = () => {
  return (
    <LayoutProvider>
      <StackLayout style={{ width: 800, height: 500 }} showTabs="left">
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

export const FourTabStackAllowRename = () => {
  return (
    <LayoutProvider>
      <StackLayout
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

export const VerticalTabsControlled = () => {
  const [active] = useState(0);

  return (
    <LayoutProvider>
      <StackLayout
        active={active}
        showTabs="left"
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
      createNewChild={createContent}
      style={{ width: 800, height: 500 }}
    ></StackLayout>
  );
};

export const TabsWithinTabs = () => (
  <LayoutProvider>
    <StackLayout style={{ width: 800, height: 500 }} active={0}>
      <StackLayout active={0} title="Substack 1">
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
        <StackLayout active={0} title="Substack 2">
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
  const handleLayoutChange = useCallback<LayoutChangeHandler>((layout) => {
    console.log(JSON.stringify(layout, null, 2));
  }, []);

  return (
    <LayoutProvider onLayoutChange={handleLayoutChange}>
      <StackLayout style={{ width: 800, height: 500 }} active={0}>
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
