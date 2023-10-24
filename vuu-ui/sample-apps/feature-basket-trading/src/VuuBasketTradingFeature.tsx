import { TableSchema } from "@finos/vuu-data";
import { FlexboxLayout, Stack } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { useCallback, useEffect, useMemo, useState } from "react";
// import { BasketSelectorProps } from "./basket-selector";
// import { BasketTableEdit } from "./basket-table-edit";
// import { BasketTableLive } from "./basket-table-live";
// import { BasketToolbar } from "./basket-toolbar";
import { useBasketTabMenu } from "./useBasketTabMenu";
import { useBasketTradingDataSources } from "./useBasketTradingDatasources";
import { NewBasketPanel } from "./new-basket-panel";

import "./VuuBasketTradingFeature.css";
import { EmptyBasketsPanel } from "./empty-baskets-panel";

const classBase = "VuuBasketTradingFeature";

export type BasketStatus = "design" | "on-market";
const basketStatus: [BasketStatus, BasketStatus] = ["design", "on-market"];

export interface BasketTradingFeatureProps {
  basketSchema: TableSchema;
  // basketDefinitionsSchema: TableSchema;
  // basketDesignSchema: TableSchema;
  // basketOrdersSchema: TableSchema;
  instrumentsSchema: TableSchema;
}

const VuuBasketTradingFeature = (props: BasketTradingFeatureProps) => {
  const {
    basketSchema,
    // basketDefinitionsSchema,
    // basketDesignSchema,
    // basketOrdersSchema,
    instrumentsSchema,
  } = props;

  const [dialog, setDialog] = useState<JSX.Element | null>(null);
  const {
    // activeTabIndex,
    dataSourceBasket,
    // dataSourceBasketDefinitions,
    // dataSourceBasketDefinitionsSearch,
    // dataSourceBasketDesign,
    // dataSourceBasketOrders,
    dataSourceInstruments,
    // onSendToMarket,
    // onTakeOffMarket,
    saveNewBasket,
  } = useBasketTradingDataSources({
    basketSchema,
    // basketDefinitionsSchema,
    // basketDesignSchema,
    // basketOrdersSchema,
    instrumentsSchema,
  });

  // useEffect(() => {
  //   dataSourceBasketDesign.resume?.();
  //   return () => {
  //     dataSourceBasketDesign.suspend?.();
  //   };
  // }, [dataSourceBasketDesign]);

  const [buildMenuOptions, handleMenuAction] = useBasketTabMenu({
    dataSourceInstruments,
  });

  const handleClose = useCallback(() => {
    setDialog(null);
  }, []);

  const handleSaveNewBasket = useCallback(
    (basketName, basketId) => {
      saveNewBasket(basketName, basketId);
      setDialog(null);
    },
    [saveNewBasket]
  );

  const handleAddBasket = useCallback(() => {
    setDialog(
      <NewBasketPanel
        basketDataSource={dataSourceBasket}
        basketSchema={basketSchema}
        onClose={handleClose}
        onSaveBasket={handleSaveNewBasket}
      />
    );
  }, [basketSchema, dataSourceBasket, handleClose, handleSaveNewBasket]);

  // const basketSelectorProps = useMemo<BasketSelectorProps>(
  //   () => ({
  //     basketId: "001",
  //     dataSourceBasket: dataSourceBasketDefinitions,
  //     dataSourceBasketSearch: dataSourceBasketDefinitionsSearch,
  //     onClickAddBasket: handleAddBasket,
  //   }),
  //   [
  //     dataSourceBasketDefinitions,
  //     dataSourceBasketDefinitionsSearch,
  //     handleAddBasket,
  //   ]
  // );

  // if (dataSourceBasketDefinitions.size === 0) {
  return (
    <>
      <EmptyBasketsPanel onClickAddBasket={handleAddBasket} />
      {dialog}
    </>
  );
  // }

  // return (
  //   <ContextMenuProvider
  //     menuActionHandler={handleMenuAction}
  //     menuBuilder={buildMenuOptions}
  //   >
  //     <FlexboxLayout
  //       className={classBase}
  //       style={{ flexDirection: "column", height: "100%" }}
  //     >
  //       <BasketToolbar
  //         BasketSelectorProps={basketSelectorProps}
  //         basketStatus={basketStatus[activeTabIndex]}
  //         onSendToMarket={onSendToMarket}
  //         onTakeOffMarket={onTakeOffMarket}
  //       />
  //       <Stack
  //         active={activeTabIndex}
  //         className={`${classBase}-stack`}
  //         // onTabSelectionChanged={setActive}
  //         style={{ flex: 1 }}
  //       >
  //         <BasketTableEdit
  //           data-tab-location="basket-design"
  //           data-tab-title="Design"
  //           dataSource={dataSourceBasketDesign}
  //           tableSchema={basketDesignSchema}
  //         />
  //         <BasketTableLive
  //           data-tab-title="On Market"
  //           dataSource={dataSourceBasketOrders}
  //           tableSchema={basketOrdersSchema}
  //         />
  //       </Stack>
  //     </FlexboxLayout>
  //     {dialog}
  //   </ContextMenuProvider>
  // );
};

export default VuuBasketTradingFeature;
