import { Shell } from "@finos/vuu-shell";
import { AppSidePanel } from "app-vuu-example/src/app-sidepanel";
import { CSSProperties } from "react";
import { useMockFeatureData } from "../utils/mock-data";
import { VuuBlotterHeader } from "../VuuFeatures/VuuBlotter/VuuBlotterHeader";

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

const viewProps = {
  Header: VuuBlotterHeader,
};

export const SampleApp = () => {
  const { features, schemas } = useMockFeatureData();
  return (
    <Shell
      leftSidePanel={
        <AppSidePanel
          features={features}
          tables={schemas}
          ViewProps={viewProps}
        />
      }
      loginUrl={window.location.toString()}
      saveLocation="local"
      user={user}
      style={
        {
          "--vuuShell-height": "100vh",
          "--vuuShell-width": "100vw",
        } as CSSProperties
      }
    />
  );
};

SampleApp.displaySequence = displaySequence++;
