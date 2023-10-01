import VuuBasketTradingFeature, {
  BasketTradingFeatureProps,
} from "feature-vuu-basket-trading";

import { useViewContext } from "@finos/vuu-layout";
import { useTableConfig } from "../examples/utils";

export const BasketTradingFeature = ({
  basketDesignSchema,
}: BasketTradingFeatureProps) => {
  const { id, saveSession } = useViewContext();

  console.log({ basketDesignSchema });

  const { dataSource } = useTableConfig({
    count: 1000,
    dataSourceConfig: {
      columns: basketDesignSchema.columns.map((column) => column.name),
    },
    table: basketDesignSchema.table,
    rangeChangeRowset: "delta",
  });

  saveSession?.(dataSource, "data-source");

  return <VuuBasketTradingFeature basketDesignSchema={basketDesignSchema} />;
};

export default BasketTradingFeature;
