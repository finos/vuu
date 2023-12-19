import VuuBasketTradingFeature, {
  basketDataSourceKey,
  BasketTradingFeatureProps,
} from "feature-basket-trading";

import { getSchema, vuuModule, VuuModuleName } from "@finos/vuu-data-test";
import { TableSchema } from "@finos/vuu-data-types";
import { usePersistentState, useViewContext } from "@finos/vuu-layout";
import { useMemo } from "react";

export const BasketTradingFeature = ({
  basketSchema,
  basketConstituentSchema,
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
      basketConstituentSchema={basketConstituentSchema}
      basketTradingSchema={basketTradingSchema}
      basketTradingConstituentJoinSchema={basketTradingConstituentJoinSchema}
    />
  );
};

export default BasketTradingFeature;
