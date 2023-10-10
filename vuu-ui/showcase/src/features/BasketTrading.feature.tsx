import VuuBasketTradingFeature, {
  BasketTradingFeatureProps,
} from "feature-vuu-basket-trading";

import { useViewContext } from "@finos/vuu-layout";
import { useTableConfig } from "../examples/utils";
import { TableSchema } from "@finos/vuu-data";

const useTableConfigTable = (schema: TableSchema, count = 1000) =>
  useTableConfig({
    count,
    dataSourceConfig: {
      columns: schema.columns.map((column) => column.name),
    },
    table: schema.table,
    rangeChangeRowset: "delta",
  });

export const BasketTradingFeature = ({
  basketDefinitionsSchema,
  basketDesignSchema,
  basketOrdersSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps) => {
  const { id, saveSession } = useViewContext();
  console.log({ saveSession });
  const { dataSource: basketDesignDataSource } =
    useTableConfigTable(basketDesignSchema);
  const { dataSource: basketOrdersDataSource } =
    useTableConfigTable(basketOrdersSchema);
  const { dataSource: basketDefinitions } = useTableConfigTable(
    basketDefinitionsSchema,
    5
  );
  const { dataSource: basketDefinitionsSearch } = useTableConfigTable(
    basketDefinitionsSchema,
    5
  );
  const { dataSource: instrumentsDataSource } =
    useTableConfigTable(instrumentsSchema);

  saveSession?.(basketDesignDataSource, "basket-design-data-source");
  saveSession?.(basketOrdersDataSource, "basket-orders-data-source");
  saveSession?.(basketDefinitions, "basket-definitions");
  saveSession?.(basketDefinitionsSearch, "basket-definitions-search");
  saveSession?.(instrumentsDataSource, "instruments-data-source");

  return (
    <VuuBasketTradingFeature
      basketDefinitionsSchema={basketDefinitionsSchema}
      basketDesignSchema={basketDesignSchema}
      basketOrdersSchema={basketOrdersSchema}
      instrumentsSchema={instrumentsSchema}
    />
  );
};

export default BasketTradingFeature;
