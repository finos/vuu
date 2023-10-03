import VuuBasketTradingFeature, {
  BasketTradingFeatureProps,
} from "feature-basket-trading";

import { useViewContext } from "@finos/vuu-layout";
import { useTableConfig } from "../examples/utils";

export const BasketTradingFeature = ({
  basketDesignSchema,
  basketDefinitionsSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps) => {
  const { id, saveSession } = useViewContext();

  const { dataSource: basketDesignDataSource } = useTableConfig({
    count: 1000,
    dataSourceConfig: {
      columns: basketDesignSchema.columns.map((column) => column.name),
    },
    table: basketDesignSchema.table,
    rangeChangeRowset: "delta",
  });

  const { dataSource: basketDefinitions } = useTableConfig({
    count: 5,
    dataSourceConfig: {
      columns: basketDefinitionsSchema.columns.map((column) => column.name),
    },
    table: basketDefinitionsSchema.table,
    rangeChangeRowset: "delta",
  });

  const { dataSource: basketDefinitionsSearch } = useTableConfig({
    count: 5,
    dataSourceConfig: {
      columns: basketDefinitionsSchema.columns.map((column) => column.name),
    },
    table: basketDefinitionsSchema.table,
    rangeChangeRowset: "delta",
  });

  const { dataSource: instrumentsDataSource } = useTableConfig({
    dataSourceConfig: {
      columns: instrumentsSchema.columns.map((column) => column.name),
    },
    table: instrumentsSchema.table,
    rangeChangeRowset: "delta",
  });

  saveSession?.(basketDesignDataSource, "basket-design-data-source");
  saveSession?.(basketDefinitions, "basket-definitions");
  saveSession?.(basketDefinitionsSearch, "basket-definitions-search");
  saveSession?.(instrumentsDataSource, "instruments-data-source");

  return (
    <VuuBasketTradingFeature
      basketDesignSchema={basketDesignSchema}
      basketDefinitionsSchema={basketDefinitionsSchema}
      instrumentsSchema={instrumentsSchema}
    />
  );
};

export default BasketTradingFeature;
