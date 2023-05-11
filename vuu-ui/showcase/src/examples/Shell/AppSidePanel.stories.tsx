import {
  DraggableLayout,
  Flexbox,
  LayoutProvider,
  Placeholder,
  View,
} from "@finos/vuu-layout";
import { SaltProvider } from "@salt-ds/core";
import { useMockFeatureData } from "../utils/mock-data";

import { useVuuTables } from "@finos/vuu-data";
import { AppSidePanel } from "app-vuu-example/src/app-sidepanel";
import { useAutoLoginToVuuServer } from "../utils/useAutoLoginToVuuServer";

export const DefaultAppSidePanel = () => {
  const { features, schemas } = useMockFeatureData();
  return (
    <LayoutProvider>
      <Flexbox style={{ width: 800, height: 900 }}>
        <View resizeable style={{ flexBasis: 200, flexShrink: 0, flexGrow: 0 }}>
          <AppSidePanel features={features} tables={schemas} />
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
  const tables = useVuuTables();
  const { features } = useMockFeatureData();

  if (error) {
    return <SaltProvider>{error}</SaltProvider>;
  }

  return (
    <LayoutProvider>
      <Flexbox style={{ width: 800, height: 900 }}>
        <View resizeable style={{ flexBasis: 200, flexShrink: 0, flexGrow: 0 }}>
          <AppSidePanel features={features} tables={tables} />
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
