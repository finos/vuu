import VuuBasketTradingFeature, {
  BasketTradingFeatureProps,
} from "feature-basket-trading";

import { useViewContext } from "@finos/vuu-layout";
import { useTableConfig } from "../examples/utils";

export const BasketTradingFeature = ({
  basketDesignSchema,
  basketDefinitionsSchema,
}: BasketTradingFeatureProps) => {
  const { id, saveSession } = useViewContext();

  console.log({ basketDesignSchema });

  const { dataSource: basketDesignDataSource } = useTableConfig({
    count: 1000,
    dataSourceConfig: {
      columns: basketDesignSchema.columns.map((column) => column.name),
    },
    table: basketDesignSchema.table,
    rangeChangeRowset: "delta",
  });
  console.log({ basketDesignDataSource });

  const { dataSource: basketDefinitionsDataSource } = useTableConfig({
    count: 5,
    dataSourceConfig: {
      columns: basketDefinitionsSchema.columns.map((column) => column.name),
    },
    table: basketDefinitionsSchema.table,
    rangeChangeRowset: "delta",
  });

  console.log({ basketDefinitionsDataSource });

  saveSession?.(basketDesignDataSource, "basket-design-data-source");
  saveSession?.(basketDefinitionsDataSource, "basket-definitions-data-source");

  return (
    <VuuBasketTradingFeature
      basketDesignSchema={basketDesignSchema}
      basketDefinitionsSchema={basketDefinitionsSchema}
    />
  );
};

export default BasketTradingFeature;
