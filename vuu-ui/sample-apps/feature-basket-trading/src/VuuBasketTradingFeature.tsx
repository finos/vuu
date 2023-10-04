import { TableSchema } from "@finos/vuu-data";
import { FlexboxLayout, Stack } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { useEffect, useMemo } from "react";
import { BasketSelectorProps } from "./basket-selector";
import { BasketTableEdit } from "./basket-table-edit";
import { BasketTableLive } from "./basket-table-live";
import { BasketToolbar } from "./basket-toolbar";
import { useBasketTabMenu } from "./useBasketTabMenu";
import { useBasketTradingDataSources } from "./useBasketTradingDatasources";

import "./VuuBasketTradingFeature.css";

const classBase = "VuuBasketTradingFeature";

export type BasketStatus = "design" | "on-market";
const basketStatus: [BasketStatus, BasketStatus] = ["design", "on-market"];

export interface BasketTradingFeatureProps {
  basketDefinitionsSchema: TableSchema;
  basketDesignSchema: TableSchema;
  basketOrdersSchema: TableSchema;
  instrumentsSchema: TableSchema;
}

const VuuBasketTradingFeature = ({
  basketDefinitionsSchema,
  basketDesignSchema,
  basketOrdersSchema,
  instrumentsSchema,
}: BasketTradingFeatureProps) => {
  const {
    activeTabIndex,
    dataSourceBasket,
    dataSourceBasketSearch,
    dataSourceBasketDesign,
    dataSourceBasketOrders,
    dataSourceInstruments,
    onSendToMarket,
    onTakeOffMarket,
  } = useBasketTradingDataSources({
    basketDefinitionsSchema,
    basketDesignSchema,
    basketOrdersSchema,
    instrumentsSchema,
  });

  // const handleDataSourceConfigChange = useCallback(
  //   (config: DataSourceConfig | undefined, confirmed?: boolean) => {
  //     // confirmed / unconfirmed messages are used for UI updates, not state saving
  //     if (confirmed === undefined) {
  //       save?.(config, "datasource-config");
  //     }
  //   },
  //   [save]
  // );

  useEffect(() => {
    dataSourceBasketDesign.resume?.();
    return () => {
      dataSourceBasketDesign.suspend?.();
    };
  }, [dataSourceBasketDesign]);

  const [buildMenuOptions, handleMenuAction] = useBasketTabMenu({
    dataSourceInstruments,
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
        <BasketToolbar
          BasketSelectorProps={basketSelectorProps}
          basketStatus={basketStatus[activeTabIndex]}
          onSendToMarket={onSendToMarket}
          onTakeOffMarket={onTakeOffMarket}
        />
        <Stack
          active={activeTabIndex}
          className={`${classBase}-stack`}
          // onTabSelectionChanged={setActive}
          style={{ flex: 1 }}
        >
          <BasketTableEdit
            data-tab-location="basket-design"
            data-tab-title="Design"
            dataSource={dataSourceBasketDesign}
            tableSchema={basketDesignSchema}
          />
          <BasketTableLive
            data-tab-title="On Market"
            dataSource={dataSourceBasketOrders}
            tableSchema={basketOrdersSchema}
          />
        </Stack>
      </FlexboxLayout>
    </ContextMenuProvider>
  );
};

export default VuuBasketTradingFeature;
