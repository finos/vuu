import { getSchema } from "@finos/vuu-data-test";
import { LayoutProvider, View } from "@finos/vuu-layout";
import { Feature, useWorkspace } from "@finos/vuu-shell";
import { DynamicFeatureProps, registerComponent } from "@finos/vuu-utils";
import { InstrumentTilesFeature } from "../../features/InstrumentTiles.feature";
import { VuuBlotterHeader } from "./VuuBlotterHeader";

registerComponent("InstrumentTilesFeature", InstrumentTilesFeature, "view");

let displaySequence = 1;

export const DefaultInstrumentTilesFeature = () => {
  const schema = getSchema("instrumentPrices");

  //-----------------------------------------------------------------------------------
  // Note the following functionality is provided by the Shell in a full application.
  // Likewise the Shell provides the LayoutProvider wrapper. Again, in a full Vuu
  // application, the Palette wraps each feature in a View.
  //-----------------------------------------------------------------------------------
  const { workspaceJSON } = useWorkspace();

  // ----------------------------------------------------------------------------------

  return (
    <LayoutProvider workspaceJSON={workspaceJSON}>
      <View
        Header={VuuBlotterHeader}
        id="instrument-tiles-feature"
        className="vuuTableFeature"
        closeable
        header
        title="Instruments"
        style={{ width: 700, height: 500 }}
      >
        <InstrumentTilesFeature instrumentPricesSchema={schema} />
      </View>
    </LayoutProvider>
  );
};
DefaultInstrumentTilesFeature.displaySequence = displaySequence++;

type Environment = "development" | "production";
const env = process.env.NODE_ENV as Environment;
const featurePropsForEnv: Record<Environment, DynamicFeatureProps> = {
  development: {
    url: "/src/features/InstrumentTiles.feature",
  },
  production: {
    url: "/features/InstrumentTilesFeature.feature.js",
    css: "/features/InstrumentTilesFeature.feature.css",
  },
};

export const InstrumentTilesFeatureAsFeature = () => {
  const { url, css } = featurePropsForEnv[env];
  const instrumentPricesSchema = getSchema("instrumentPrices");

  return (
    <View
      Header={VuuBlotterHeader}
      id="instrument-tiles-feature"
      className="vuuTableFeature"
      closeable
      header
      title="Instruments"
      style={{ width: 700, height: 500 }}
    >
      <Feature
        ComponentProps={{ instrumentPricesSchema }}
        url={url}
        css={css}
      />
    </View>
  );
};
InstrumentTilesFeatureAsFeature.displayName = "InstrumentTiles";
InstrumentTilesFeatureAsFeature.displaySequence = displaySequence++;
