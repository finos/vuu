import {
  DraggableLayout,
  Flexbox,
  LayoutProvider,
  Placeholder,
  View,
} from "@vuu-ui/vuu-layout";
import { ToolkitProvider } from "@heswell/uitk-core";

import { AppSidePanel } from "app-vuu-example/src/app-sidepanel";
import { useAutoLoginToVuuServer } from "../utils/useAutoLoginToVuuServer";
import { useViewserver } from "@vuu-ui/vuu-data";
import { useMemo } from "react";

export const DefaultAppSidePanel = () => {
  const tables = useMemo(() => {
    return {
      Test1: {},
      Test2: {},
      Test3: {},
    };
  }, []);

  return (
    <LayoutProvider>
      <Flexbox style={{ width: 800, height: 900 }}>
        <View resizeable style={{ flexBasis: 200, flexShrink: 0, flexGrow: 0 }}>
          <AppSidePanel tables={tables} />
        </View>
        <DraggableLayout style={{ flex: 1 }} dropTarget resizeable>
          <View resizeable style={{ height: "calc(100% - 6px)" }}>
            <Placeholder />
          </View>
        </DraggableLayout>
      </Flexbox>
    </LayoutProvider>
  );
};

export const VuuConnectedAppSidePanel = () => {
  const error = useAutoLoginToVuuServer();
  const { tables } = useViewserver();

  console.log({ tables });

  if (error) {
    return <ToolkitProvider>{error}</ToolkitProvider>;
  }

  return (
    <LayoutProvider>
      <Flexbox style={{ width: 800, height: 900 }}>
        <View resizeable style={{ flexBasis: 200, flexShrink: 0, flexGrow: 0 }}>
          <AppSidePanel tables={tables} />
        </View>
        <DraggableLayout style={{ flex: 1 }} dropTarget resizeable>
          <View resizeable style={{ height: "calc(100% - 6px)" }}>
            <Placeholder />
          </View>
        </DraggableLayout>
      </Flexbox>
    </LayoutProvider>
  );
};
