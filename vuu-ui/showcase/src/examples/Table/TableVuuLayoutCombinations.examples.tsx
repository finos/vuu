import { LayoutProvider, Stack, View } from "@finos/vuu-layout";
import { useState } from "react";
import { TestTable } from "./Table.examples";

let displaySequence = 1;

export const TwoTabbedTables = () => {
  const [active, setActive] = useState(0);
  return (
    <LayoutProvider>
      <Stack
        active={active}
        onTabSelectionChanged={setActive}
        style={{
          border: "solid 1px var(--salt-container-secondary-borderColor)",
          height: 500,
          margin: 10,
          width: 600,
        }}
      >
        <View title="Instruments 1">
          <TestTable height="100%" width="100%" />
        </View>
        <View title="Instruments 2">
          <TestTable height="100%" width="100%" />
        </View>
      </Stack>
    </LayoutProvider>
  );
};
TwoTabbedTables.displaySequence = displaySequence++;

export const FourTabbedTables = () => {
  const [active, setActive] = useState(0);
  return (
    <Stack
      active={active}
      onTabSelectionChanged={setActive}
      style={{
        border: "solid 1px var(--salt-container-secondary-borderColor)",
        height: 500,
        margin: 10,
        width: 600,
      }}
    >
      <View title="Instruments 1"></View>
      <View title="Instruments 2"></View>
      <View title="Instruments 3"></View>
      <View title="Instruments 4"></View>
    </Stack>
  );
};
FourTabbedTables.displaySequence = displaySequence++;
