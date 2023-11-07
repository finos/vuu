import VuuBasketTradingFeature, {
  BasketTradingFeatureProps,
  basketDataSourceKey,
} from "feature-basket-trading";

import { useViewContext } from "@finos/vuu-layout";
import { TableSchema } from "@finos/vuu-data";
import { useMemo } from "react";
import { vuuModule, VuuModuleName } from "@finos/vuu-data-test";

export const BasketTradingFeature = ({
  basketSchema,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps) => {
  const { saveSession } = useViewContext();

  useMemo(() => {
    const dataSourceConfig: [
      basketDataSourceKey,
      TableSchema,
      VuuModuleName
    ][] = [
      ["data-source-basket", basketSchema, "BASKET"],
      ["data-source-basket-trading-control", basketTradingSchema, "BASKET"],
      ["data-source-basket-trading-search", basketTradingSchema, "BASKET"],
      [
        "data-source-basket-trading-constituent-join",
        basketTradingConstituentJoinSchema,
        "BASKET",
      ],
      ["data-source-instruments", instrumentsSchema, "SIMUL"],
    ];
    for (const [key, schema, module] of dataSourceConfig) {
      const dataSource = vuuModule(module).createDataSource(schema.table.table);
      saveSession?.(dataSource, key);
    }
  }, [
    basketSchema,
    basketTradingConstituentJoinSchema,
    basketTradingSchema,
    instrumentsSchema,
    saveSession,
  ]);

  return (
    <VuuBasketTradingFeature
      basketSchema={basketSchema}
      basketTradingSchema={basketTradingSchema}
      basketTradingConstituentJoinSchema={basketTradingConstituentJoinSchema}
      instrumentsSchema={instrumentsSchema}
    />
  );
};

export default BasketTradingFeature;
