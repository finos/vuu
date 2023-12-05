import VuuBasketTradingFeature, {
  BasketTradingFeatureProps,
  basketDataSourceKey,
} from "feature-basket-trading";

import { usePersistentState, useViewContext } from "@finos/vuu-layout";
import { TableSchema } from "@finos/vuu-data";
import { useMemo } from "react";
import { vuuModule, VuuModuleName, getSchema } from "@finos/vuu-data-test";

export const BasketTradingFeature = ({
  basketSchema,
  basketTradingSchema,
  basketTradingConstituentJoinSchema,
}: BasketTradingFeatureProps) => {
  const { saveSession } = useViewContext();
  const { saveSessionState } = usePersistentState();

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
    ];
    for (const [key, schema, module] of dataSourceConfig) {
      const dataSource = vuuModule(module).createDataSource(schema.table.table);
      saveSession?.(dataSource, key);
    }

    // save the basketConstituent table into session state for the Instrument Search Panel
    const basketConstituentSchema = getSchema("basketConstituent");
    const basketConstituentDataSource = vuuModule("BASKET").createDataSource(
      basketConstituentSchema.table.table
    );
    saveSessionState(
      "context-panel",
      "instrument-search-BASKET-basketConstituent",
      basketConstituentDataSource
    );
  }, [
    basketSchema,
    basketTradingConstituentJoinSchema,
    basketTradingSchema,
    saveSession,
    saveSessionState,
  ]);

  return (
    <VuuBasketTradingFeature
      basketSchema={basketSchema}
      basketTradingSchema={basketTradingSchema}
      basketTradingConstituentJoinSchema={basketTradingConstituentJoinSchema}
    />
  );
};

export default BasketTradingFeature;
