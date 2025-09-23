import { getSchema } from "@vuu-ui/vuu-data-test";
import { LayoutProvider, View } from "@vuu-ui/vuu-layout";
import { Feature } from "@vuu-ui/vuu-shell";
import { DynamicFeatureProps, registerComponent } from "@vuu-ui/vuu-utils";
import { InstrumentTilesFeature } from "../../features/InstrumentTiles.feature";
import { VuuBlotterHeader } from "./VuuBlotterHeader";

registerComponent("InstrumentTilesFeature", InstrumentTilesFeature, "view");

export const DefaultInstrumentTilesFeature = () => {
  const schema = getSchema("instrumentPrices");

  return (
    <LayoutProvider>
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
