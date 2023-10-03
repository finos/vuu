import { LayoutProvider, View } from "@finos/vuu-layout";
import { Feature, FeatureProps, useLayoutConfig } from "@finos/vuu-shell";
import { useCallback, useEffect } from "react";
import { BasketTradingFeature } from "../../features/BasketTrading.feature";
import { useTableSchema } from "../utils";
import { VuuBlotterHeader } from "./VuuBlotterHeader";
import { registerComponent } from "@finos/vuu-layout";

registerComponent("BasketTradingFeature", BasketTradingFeature, "view");

let displaySequence = 1;

export const DefaultBasketTradingFeature = () => {
  const basketDefinitionsSchema = useTableSchema("basketDefinitions");
  const basketDesignSchema = useTableSchema("basketDesign");
  const instrumentsSchema = useTableSchema("instruments");

  //-----------------------------------------------------------------------------------
  // Note the following functionality is provided by the Shell in a full application.
  // Likewise the Shell provides the LayoutProvider wrapper. Again, in a full Vuu
  // application, the Palette wraps each feature in a View.
  //-----------------------------------------------------------------------------------
  const [layout, saveLayoutConfig] = useLayoutConfig({
    // save to local storage. Use browser devtools to purge this
    saveLocation: "local",
    saveUrl: "table-next-feature",
  });

  useEffect(() => {
    console.log(`%clayout changed`, "color: blue; font-weight: bold;");
  }, [layout]);

  const handleLayoutChange = useCallback(
    (layout) => {
      console.log("layout change");
      saveLayoutConfig(layout);
    },
    [saveLayoutConfig]
  );
  // ----------------------------------------------------------------------------------

  return (
    <LayoutProvider layout={layout} onLayoutChange={handleLayoutChange}>
      <View
        Header={VuuBlotterHeader}
        id="table-next-feature"
        className="vuuTableNextFeature"
        closeable
        header
        title="Instruments"
        style={{ width: 700, height: 500 }}
      >
        <BasketTradingFeature
          basketDefinitionsSchema={basketDefinitionsSchema}
          basketDesignSchema={basketDesignSchema}
          instrumentsSchema={instrumentsSchema}
        />
      </View>
    </LayoutProvider>
  );
};
DefaultBasketTradingFeature.displaySequence = displaySequence++;

type Environment = "development" | "production";
const env = process.env.NODE_ENV as Environment;
const featurePropsForEnv: Record<Environment, FeatureProps> = {
  development: {
    url: "/src/features/BasketTrading.feature",
  },
  production: {
    url: "/features/TableNext.feature.js",
    css: "/features/TableNext.feature.css",
  },
};

export const BasketTradingFeatureAsFeature = () => {
  const { url, css } = featurePropsForEnv[env];
  const basketDesignSchema = useTableSchema("basketDesign");

  return (
    <Feature ComponentProps={{ basketDesignSchema }} url={url} css={css} />
  );
};
BasketTradingFeatureAsFeature.displayName = "BasketTrading";
BasketTradingFeatureAsFeature.displaySequence = displaySequence++;
