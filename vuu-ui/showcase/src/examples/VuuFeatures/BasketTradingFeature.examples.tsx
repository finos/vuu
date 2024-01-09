import { getAllSchemas } from "@finos/vuu-data-test";
import { LayoutProvider, registerComponent, View } from "@finos/vuu-layout";
import {
  Feature,
  FeatureProps,
  LookupTableProvider,
  ShellContextProvider,
  useLayoutManager,
} from "@finos/vuu-shell";
import { useCallback, useEffect } from "react";
import { BasketTradingFeatureProps } from "sample-apps/feature-basket-trading";
import { BasketTradingFeature } from "../../features/BasketTrading.feature";
import { VuuBlotterHeader } from "./VuuBlotterHeader";

registerComponent("BasketTradingFeature", BasketTradingFeature, "view");

let displaySequence = 1;

export const DefaultBasketTradingFeature = () => {
  const schemas = getAllSchemas();
  //-----------------------------------------------------------------------------------
  // Note the following functionality is provided by the Shell in a full application.
  // Likewise the Shell provides the LayoutProvider wrapper. Again, in a full Vuu
  // application, the Palette wraps each feature in a View.
  //-----------------------------------------------------------------------------------
  const { applicationJson: applicationLayout, saveApplicationLayout } =
    useLayoutManager();

  useEffect(() => {
    console.log(`%clayout changed`, "color: blue; font-weight: bold;");
  }, [applicationLayout]);

  const handleLayoutChange = useCallback(
    (layout) => {
      console.log("layout change");
      saveApplicationLayout(layout);
    },
    [saveApplicationLayout]
  );
  // ----------------------------------------------------------------------------------

  const getLookupValues = useCallback<LookupTableProvider>((table) => {
    if (table.table === "algoType") {
      return [
        { label: "Sniper", value: 0 },
        { label: "Dark Liquidity", value: 1 },
        { label: "VWAP", value: 2 },
        { label: "POV", value: 3 },
        { label: "Dynamic CLose", value: 4 },
      ];
    } else if (table.table === "priceStrategyType") {
      return [
        { label: "Peg to Near Touch", value: 0 },
        { label: "Far Touch", value: 1 },
        { label: "Limit", value: 2 },
        { label: "Algo", value: 3 },
      ];
    }
    return [];
  }, []);

  return (
    <ShellContextProvider value={{ getLookupValues }}>
      <LayoutProvider
        layout={applicationLayout.applicationLayout}
        onLayoutChange={handleLayoutChange}
      >
        <View
          Header={VuuBlotterHeader}
          id="table-next-feature"
          className="vuuTableFeature"
          closeable
          header
          title="Basket Trading"
          style={{ width: 1260, height: 600 }}
        >
          <BasketTradingFeature
            basketSchema={schemas.basket}
            basketConstituentSchema={schemas.basketConstituent}
            basketTradingSchema={schemas.basketTrading}
            basketTradingConstituentJoinSchema={
              schemas.basketTradingConstituentJoin
            }
          />
        </View>
      </LayoutProvider>
    </ShellContextProvider>
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
  const schemas = getAllSchemas();
  return (
    <View
      Header={VuuBlotterHeader}
      id="table-next-feature"
      className="vuuTableFeature"
      closeable
      header
      title="Instruments"
      style={{ width: 1260, height: 600 }}
    >
      <Feature
        ComponentProps={
          {
            basketSchema: schemas.basket,
            basketConstituentSchema: schemas.basketConstituent,
            basketTradingSchema: schemas.basketTrading,
            basketTradingConstituentJoinSchema:
              schemas.basketTradingConstituentJoin,
          } as BasketTradingFeatureProps
        }
        url={url}
        css={css}
      />
    </View>
  );
};
BasketTradingFeatureAsFeature.displayName = "BasketTrading";
BasketTradingFeatureAsFeature.displaySequence = displaySequence++;
