import VuuBasketTradingFeature, {
  basketDataSourceKey,
  BasketTradingFeatureProps,
} from "feature-basket-trading";

import { vuuModule, VuuModuleName } from "@finos/vuu-data-test";
import { TableSchema } from "@finos/vuu-data-types";
import { useViewContext } from "@finos/vuu-layout";
import { useMemo } from "react";

export const BasketTradingFeature = ({
  basketSchema,
  basketConstituentSchema,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
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
      ["data-source-basket-constituent", basketConstituentSchema, "BASKET"],
    ];
    for (const [key, schema, module] of dataSourceConfig) {
      const dataSource = vuuModule(module).createDataSource(schema.table.table);
      saveSession?.(dataSource, key);
    }
  }, [
    basketConstituentSchema,
    basketSchema,
    basketTradingConstituentJoinSchema,
    basketTradingSchema,
    saveSession,
  ]);

  return (
    <VuuBasketTradingFeature
      basketSchema={basketSchema}
      basketConstituentSchema={basketConstituentSchema}
      basketTradingSchema={basketTradingSchema}
      basketTradingConstituentJoinSchema={basketTradingConstituentJoinSchema}
    />
  );
};

export default BasketTradingFeature;
