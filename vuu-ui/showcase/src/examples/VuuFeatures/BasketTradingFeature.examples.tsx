import { LocalDataSourceProvider } from "@finos/vuu-data-test";
import { LayoutProvider, View } from "@finos/vuu-layout";
import { Feature, ShellContextProvider } from "@finos/vuu-shell";
import {
  DynamicFeatureProps,
  LookupTableProvider,
  registerComponent,
} from "@finos/vuu-utils";
import { useCallback } from "react";
import BasketTradingFeature from "../../features/BasketTrading.feature";
import { VuuBlotterHeader } from "./VuuBlotterHeader";

registerComponent("BasketTradingFeature", BasketTradingFeature, "view");

let displaySequence = 1;

export const DefaultBasketTradingFeature = () => {
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
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <ShellContextProvider value={{ getLookupValues }}>
        <LayoutProvider>
          <View
            Header={VuuBlotterHeader}
            id="table-next-feature"
            className="vuuTableFeature"
            closeable
            header
            title="Basket Trading"
            style={{ width: 1260, height: 600 }}
          >
            <BasketTradingFeature />
          </View>
        </LayoutProvider>
      </ShellContextProvider>
    </LocalDataSourceProvider>
  );
};
DefaultBasketTradingFeature.displaySequence = displaySequence++;

type Environment = "development" | "production";
const env = process.env.NODE_ENV as Environment;
const featurePropsForEnv: Record<Environment, DynamicFeatureProps> = {
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
  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <View
        Header={VuuBlotterHeader}
        id="table-next-feature"
        className="vuuTableFeature"
        closeable
        header
        title="Instruments"
        style={{ width: 1260, height: 600 }}
      >
        <Feature url={url} css={css} />
      </View>
    </LocalDataSourceProvider>
  );
};
BasketTradingFeatureAsFeature.displayName = "BasketTrading";
BasketTradingFeatureAsFeature.displaySequence = displaySequence++;
