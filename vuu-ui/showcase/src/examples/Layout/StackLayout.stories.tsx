import {
  Component,
  Flexbox,
  StackLayout as Stack,
  View,
} from "@finos/vuu-layout";
import { StatefulComponent } from "./components";

let displaySequence = 1;

export const FourTabs = () => {
  return (
    <Stack showTabs style={{ width: 800, height: 500 }} active={0}>
      <View title="Rebecca" header>
        <Component style={{ backgroundColor: "rebeccapurple", flex: 1 }} />
      </View>
      <View title="Red" header>
        <Component style={{ backgroundColor: "red", flex: 1 }} />
      </View>
      <View title="Alice" header>
        <Component style={{ backgroundColor: "aliceblue", flex: 1 }} />
      </View>
      <View title="Cornflower" header>
        <Component style={{ backgroundColor: "cornflowerblue", flex: 1 }} />
      </View>
    </Stack>
  );
};
FourTabs.displaySequence = displaySequence++;

export const RemovableTabs = () => {
  return (
    <Stack showTabs style={{ width: 800, height: 500 }} active={0}>
      <View title="Rebecca" header>
        <Component style={{ backgroundColor: "rebeccapurple", flex: 1 }} />
      </View>
      <View title="Red" header closeable>
        <Component style={{ backgroundColor: "red", flex: 1 }} />
      </View>
      <View title="Alice" header closeable>
        <Component style={{ backgroundColor: "aliceblue", flex: 1 }} />
      </View>
      <View title="Cornflower" header closeable>
        <Component style={{ backgroundColor: "cornflowerblue", flex: 1 }} />
      </View>
    </Stack>
  );
};
RemovableTabs.displaySequence = displaySequence++;

export const EnableAddTab = () => {
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
    <Stack
      TabstripProps={{
        allowAddTab: true,
      }}
      showTabs
      createNewChild={createContent}
      style={{ width: 800, height: 500 }}
      active={0}
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
    </Stack>
  );
};
EnableAddTab.displaySequence = displaySequence++;

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
    <Stack
      TabstripProps={{
        allowAddTab: true,
      }}
      showTabs
      createNewChild={createContent}
      style={{ width: 800, height: 500 }}
    ></Stack>
  );
};
EmptyStackAddTab.displaySequence = displaySequence++;

export const TabsWithinTabs = () => (
  <Stack showTabs style={{ width: 800, height: 500 }} active={0}>
    <Stack showTabs active={0} title="Substack 1">
      <View title="Rebecca" header>
        <Component style={{ backgroundColor: "rebeccapurple", flex: 1 }} />
      </View>
      <View title="Red" header>
        <Component style={{ backgroundColor: "red", flex: 1 }} />
      </View>
      <View title="Alice" header>
        <Component style={{ backgroundColor: "aliceblue" }} />
      </View>
    </Stack>

    <Flexbox title="Nested Substack" style={{ flexDirection: "column" }}>
      <View title="Red" header>
        <Component style={{ backgroundColor: "red", flex: 1 }} />
      </View>
      <Stack showTabs active={0} title="Substack 2">
        <View title="Alice" header>
          <Component style={{ backgroundColor: "aliceblue", flex: 1 }} />
        </View>
        <View title="Gordon" header>
          <Component style={{ backgroundColor: "brown", flex: 1 }} />
        </View>
        <View title="Jack" header>
          <Component style={{ backgroundColor: "black", flex: 1 }} />
        </View>
      </Stack>
    </Flexbox>
    <View title="Cornflower" header>
      <Component style={{ backgroundColor: "cornflowerblue" }} />
    </View>
  </Stack>
);
TabsWithinTabs.displaySequence = displaySequence++;

export const SaveAndRestoreState = () => (
  <Stack showTabs style={{ width: 800, height: 500 }} active={0}>
    <View style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }} title="Page 1">
      <StatefulComponent
        style={{ backgroundColor: "yellow", flex: 1 }}
        initialState={JSON.stringify({
          hello: "mum",
        })}
      />
    </View>
    <View style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }} title="Page 2">
      <StatefulComponent style={{ backgroundColor: "#fdfdcb", flex: 1 }} />
    </View>
    <View style={{ flexGrow: 1, flexShrink: 0, flexBasis: 0 }} title="Page 3">
      <StatefulComponent
        style={{ flex: 1, backgroundColor: "yellow" }}
        stateKey="bill"
      />
      <StatefulComponent
        style={{ flex: 1, backgroundColor: "orange" }}
        stateKey="ben"
      />
    </View>
  </Stack>
);
SaveAndRestoreState.displaySequence = displaySequence++;
