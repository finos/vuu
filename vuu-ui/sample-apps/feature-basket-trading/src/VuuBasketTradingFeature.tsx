import { RemoteDataSource, TableSchema } from "@finos/vuu-data";
import { FlexboxLayout, Stack, useViewContext } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { useEffect, useMemo, useState } from "react";
import { BasketSelectorProps } from "./basket-selector";
import { BasketTableEdit } from "./basket-table-edit";
import { BasketTableLive } from "./basket-table-live";
import { BasketToolbar } from "./basket-toolbar";
import { useBasketTabMenu } from "./useBasketTabMenu";

import "./VuuBasketTradingFeature.css";

const classBase = "VuuBasketTradingFeature";

export interface BasketTradingFeatureProps {
  basketDefinitionsSchema: TableSchema;
  basketDesignSchema: TableSchema;
  instrumentsSchema: TableSchema;
}

const VuuBasketTradingFeature = ({
  basketDesignSchema,
  basketDefinitionsSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps) => {
  const { id, save, loadSession, saveSession, title } = useViewContext();
  const [active, setActive] = useState(0);

  // const handleDataSourceConfigChange = useCallback(
  //   (config: DataSourceConfig | undefined, confirmed?: boolean) => {
  //     // confirmed / unconfirmed messages are used for UI updates, not state saving
  //     if (confirmed === undefined) {
  //       save?.(config, "datasource-config");
  //     }
  //   },
  //   [save]
  // );

  const [
    dataSourceBasket,
    dataSourceBasketSearch,
    basketDesignDataSource,
    instrumentsDataSource,
  ] = useMemo(() => {
    // prettier-ignore
    let ds1 = loadSession?.("basket-definitions") as RemoteDataSource;
    // prettier-ignore
    let ds2 = loadSession?.("basket-definitions-search") as RemoteDataSource;
    let ds3 = loadSession?.("basket-design-data-source") as RemoteDataSource;
    let ds4 = loadSession?.("instruments-data-source") as RemoteDataSource;
    if (ds1 && ds2 && ds3 && ds4) {
      return [ds1, ds2, ds3, ds4];
    }

    ds1 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: basketDefinitionsSchema.table,
      columns: basketDefinitionsSchema.columns.map((col) => col.name),
      title,
    });
    ds2 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: basketDefinitionsSchema.table,
      columns: basketDefinitionsSchema.columns.map((col) => col.name),
      title,
    });
    ds3 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: basketDesignSchema.table,
      columns: basketDesignSchema.columns.map((col) => col.name),
      title,
    });
    ds4 = new RemoteDataSource({
      bufferSize: 200,
      viewport: id,
      table: instrumentsSchema.table,
      columns: instrumentsSchema.columns.map((col) => col.name),
      title,
    });
    // ds.on("config", handleDataSourceConfigChange);
    saveSession?.(ds1, "basket-definitions");
    saveSession?.(ds2, "basket-definitions-search");
    saveSession?.(ds3, "basket-design-data-source");
    saveSession?.(ds4, "instruments-data-source");
    return [ds1, ds2, ds3, ds4];
  }, [
    basketDefinitionsSchema.columns,
    basketDefinitionsSchema.table,
    basketDesignSchema.columns,
    basketDesignSchema.table,
    id,
    instrumentsSchema.columns,
    instrumentsSchema.table,
    loadSession,
    saveSession,
    title,
  ]);

  useEffect(() => {
    basketDesignDataSource.resume?.();
    return () => {
      basketDesignDataSource.suspend?.();
    };
  }, [basketDesignDataSource]);

  const [buildMenuOptions, handleMenuAction] = useBasketTabMenu({
    instrumentsDataSource,
  });

  const basketSelectorProps = useMemo<BasketSelectorProps>(
    () => ({
      basketId: "001",
      dataSourceBasket,
      dataSourceBasketSearch,
    }),
    [dataSourceBasket, dataSourceBasketSearch]
  );

  return (
    <ContextMenuProvider
      menuActionHandler={handleMenuAction}
      menuBuilder={buildMenuOptions}
    >
      <FlexboxLayout
        className={classBase}
        style={{ flexDirection: "column", height: "100%" }}
      >
        <BasketToolbar BasketSelectorProps={basketSelectorProps} />
        <Stack
          active={active}
          className={`${classBase}-stack`}
          onTabSelectionChanged={setActive}
          style={{ flex: 1 }}
        >
          <BasketTableEdit
            data-tab-location="basket-design"
            data-tab-title="Design"
            dataSource={basketDesignDataSource}
            tableSchema={basketDesignSchema}
          />
          <BasketTableLive data-tab-title="On Market" />
        </Stack>
      </FlexboxLayout>
    </ContextMenuProvider>
  );
};

export default VuuBasketTradingFeature;
