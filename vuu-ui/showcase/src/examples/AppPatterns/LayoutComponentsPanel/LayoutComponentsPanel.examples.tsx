import { simulSchemas } from "@finos/vuu-data-test";
import {
  DraggableLayout,
  Flexbox,
  LayoutProvider,
  Placeholder,
  View,
} from "@finos/vuu-layout";
import {
  ContextPanel,
  LayoutManagementProvider,
  StaticPersistenceManager,
} from "@finos/vuu-shell";
import { registerComponent } from "@finos/vuu-utils";
import { useMemo } from "react";
import { LayoutComponentsPanel } from "./LayoutComponentsPanel";
import layoutMetadata from "../../_test-data/layoutMetadata";
import { AppHeader } from "./app-header";

registerComponent("LayoutComponentsPanel", LayoutComponentsPanel, "view");

let displaySequence = 0;

export const TabbedLayoutComponents = () => {
  const demoPersistenceManager = useMemo(
    () => new StaticPersistenceManager(layoutMetadata),
    []
  );

  return (
    <LayoutManagementProvider persistenceManager={demoPersistenceManager}>
      <div style={{ width: 292 }}>
        <LayoutComponentsPanel tableSchemas={Object.values(simulSchemas)} />
      </div>
    </LayoutManagementProvider>
  );
};
TabbedLayoutComponents.displaySequence = displaySequence++;

export const TabbedLayoutComponentsWithDragDrop = () => {
  const demoPersistenceManager = useMemo(
    () => new StaticPersistenceManager(layoutMetadata),
    []
  );

  return (
    <LayoutManagementProvider persistenceManager={demoPersistenceManager}>
      <LayoutProvider>
        <Flexbox style={{ height: 800 }}>
          <View
            style={{
              border: "solid 1px #ccc",
              flexBasis: 292,
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            <div style={{ width: 292 }}>
              <LayoutComponentsPanel
                tableSchemas={Object.values(simulSchemas)}
              />
            </div>
          </View>
          <DraggableLayout style={{ flex: 1 }} dropTarget resizeable>
            <View resizeable style={{ height: "calc(100% - 6px)" }}>
              <Placeholder />
            </View>
          </DraggableLayout>
        </Flexbox>
      </LayoutProvider>
    </LayoutManagementProvider>
  );
};
TabbedLayoutComponentsWithDragDrop.displaySequence = displaySequence++;

export const FlyoutTabbedLayoutComponentsWithDragDrop = () => {
  const demoPersistenceManager = useMemo(
    () => new StaticPersistenceManager(layoutMetadata),
    []
  );

  return (
    <LayoutManagementProvider persistenceManager={demoPersistenceManager}>
      <LayoutProvider>
        <Flexbox
          style={{
            width: "100%",
            height: "100%",
            padding: 4,
          }}
        >
          <Flexbox style={{ flex: 1, flexDirection: "column" }}>
            <AppHeader tableSchemas={Object.values(simulSchemas)} />
            <DraggableLayout style={{ flex: 1 }} dropTarget resizeable>
              <View resizeable style={{ height: "calc(100% - 6px)" }}>
                <Placeholder />
              </View>
            </DraggableLayout>
          </Flexbox>
          <ContextPanel id="context-panel" overlay></ContextPanel>
        </Flexbox>
      </LayoutProvider>
    </LayoutManagementProvider>
  );
};
FlyoutTabbedLayoutComponentsWithDragDrop.displaySequence = displaySequence++;
