import VuuBasketTradingFeature, {
  BasketTradingFeatureProps,
  basketDataSourceKey,
} from "feature-basket-trading";

import { useViewContext } from "@finos/vuu-layout";
import { TableSchema } from "@finos/vuu-data";
import { useMemo } from "react";
import { createArrayDataSource } from "../examples/utils/createArrayDataSource";

export const BasketTradingNoBasketsFeature = ({
  basketSchema,
  // basketDefinitionsSchema,
  // basketDesignSchema,
  // basketOrdersSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps) => {
  const { saveSession } = useViewContext();

  useMemo(() => {
    const dataSourceConfig: [basketDataSourceKey, TableSchema, number?][] = [
      ["data-source-basket", basketSchema, 4],
      // ["data-source-basket-definitions", basketDefinitionsSchema, 0],
      // ["data-source-basket-definitions-search", basketDefinitionsSchema, 0],
      // ["data-source-basket-design", basketDesignSchema],
      // ["data-source-basket-orders", basketOrdersSchema],
      ["data-source-instruments", instrumentsSchema],
    ];
    for (const [key, schema, count] of dataSourceConfig) {
      const dataSource = createArrayDataSource({ count, table: schema.table });
      saveSession?.(dataSource, key);
    }
  }, [
    basketSchema,
    // basketDefinitionsSchema,
    // basketDesignSchema,
    // basketOrdersSchema,
    instrumentsSchema,
    saveSession,
  ]);

  return (
    <VuuBasketTradingFeature
      basketSchema={basketSchema}
      // basketDefinitionsSchema={basketDefinitionsSchema}
      // basketDesignSchema={basketDesignSchema}
      // basketOrdersSchema={basketOrdersSchema}
      instrumentsSchema={instrumentsSchema}
    />
  );
};

export default BasketTradingNoBasketsFeature;
