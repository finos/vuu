import { simulSchemas } from "@finos/vuu-data-test";
import {
  LayoutContainer,
  Flexbox,
  LayoutProvider,
  Placeholder,
  View,
} from "@finos/vuu-layout";
import type { SettingsSchema } from "@finos/vuu-shell";
import {
  ApplicationProvider,
  ContextPanel,
  WorkspaceProvider,
  PersistenceProvider,
  StaticPersistenceManager,
} from "@finos/vuu-shell";
import { VuuShellLocation, registerComponent } from "@finos/vuu-utils";
import { useMemo } from "react";
import layoutMetadata from "../../_test-data/layoutMetadata";
import { LayoutComponentsPanel } from "./LayoutComponentsPanel";
import { AppHeader } from "./app-header";

registerComponent("LayoutComponentsPanel", LayoutComponentsPanel, "view");

export const TabbedLayoutComponents = () => {
  const demoPersistenceManager = useMemo(
    () => new StaticPersistenceManager({ layoutMetadata }),
    [],
  );

  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <WorkspaceProvider>
        <div style={{ width: 292 }}>
          <LayoutComponentsPanel tableSchemas={Object.values(simulSchemas)} />
        </div>
      </WorkspaceProvider>
    </PersistenceProvider>
  );
};

export const TabbedLayoutComponentsWithDragDrop = () => {
  const demoPersistenceManager = useMemo(
    () => new StaticPersistenceManager({ layoutMetadata }),
    [],
  );

  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <WorkspaceProvider>
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
            <LayoutContainer style={{ flex: 1 }} dropTarget resizeable>
              <View resizeable style={{ height: "calc(100% - 6px)" }}>
                <Placeholder />
              </View>
            </LayoutContainer>
          </Flexbox>
        </LayoutProvider>
      </WorkspaceProvider>
    </PersistenceProvider>
  );
};

export const FlyoutLayoutAndSettingsWithDragDrop = () => {
  const demoPersistenceManager = useMemo(
    () => new StaticPersistenceManager({ layoutMetadata }),
    [],
  );

  const applicationSettingsSchema: SettingsSchema = {
    properties: [
      {
        name: "themeMode",
        label: "Mode",
        values: ["light", "dark"],
        defaultValue: "light",
        type: "string",
      },
      {
        name: "dateFormatPattern",
        label: "Date Formatting",
        values: ["dd/mm/yyyy", "mm/dd/yyyy", "dd MMMM yyyy"],
        defaultValue: "dd/mm/yyyy",
        type: "string",
      },
      {
        name: "region",
        label: "Region",
        values: [
          { value: "us", label: "US" },
          { value: "apac", label: "Asia Pacific" },
          { value: "emea", label: "Europe, Middle East & Africa" },
        ],
        defaultValue: "apac",
        type: "string",
      },
      {
        name: "greyscale",
        label: "Greyscale",
        defaultValue: false,
        type: "boolean",
      },
    ],
  };

  return (
    <PersistenceProvider persistenceManager={demoPersistenceManager}>
      <ApplicationProvider userSettingsSchema={applicationSettingsSchema}>
        <WorkspaceProvider>
          <LayoutProvider>
            <Flexbox
              style={{
                width: "100%",
                height: "100%",
                padding: 10,
              }}
            >
              <Flexbox style={{ flex: 1, flexDirection: "column" }}>
                <AppHeader tableSchemas={Object.values(simulSchemas)} />
                <LayoutContainer style={{ flex: 1 }} dropTarget resizeable>
                  <View resizeable style={{ height: "calc(100% - 6px)" }}>
                    <Placeholder />
                  </View>
                </LayoutContainer>
              </Flexbox>
              <ContextPanel
                id={VuuShellLocation.ContextPanel}
                overlay
              ></ContextPanel>
            </Flexbox>
          </LayoutProvider>
        </WorkspaceProvider>
      </ApplicationProvider>
    </PersistenceProvider>
  );
};
