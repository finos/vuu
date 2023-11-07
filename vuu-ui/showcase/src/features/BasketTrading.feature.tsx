import VuuBasketTradingFeature, {
  BasketTradingFeatureProps,
  basketDataSourceKey,
} from "feature-basket-trading";

import { useViewContext } from "@finos/vuu-layout";
import { TableSchema } from "@finos/vuu-data";
import { useMemo } from "react";
import { createArrayDataSource } from "../examples/utils/createArrayDataSource";

export const BasketTradingFeature = ({
  basketSchema,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps) => {
  const { saveSession } = useViewContext();

  useMemo(() => {
    const dataSourceConfig: [basketDataSourceKey, TableSchema][] = [
      ["data-source-basket", basketSchema],
      ["data-source-basket-trading-control", basketTradingSchema],
      ["data-source-basket-trading-search", basketTradingSchema],
      [
        "data-source-basket-trading-constituent-join",
        basketTradingConstituentJoinSchema,
      ],
      ["data-source-instruments", instrumentsSchema],
    ];
    for (const [key, schema] of dataSourceConfig) {
      const dataSource = createArrayDataSource({ table: schema.table });
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
