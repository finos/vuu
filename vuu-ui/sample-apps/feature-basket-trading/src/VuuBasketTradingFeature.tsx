import { TableSchema } from "@finos/vuu-data";
import { FlexboxLayout, Stack } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { useEffect, useMemo, useState } from "react";
import { BasketSelectorProps } from "./basket-selector";
import { BasketTableEdit } from "./basket-table-edit";
import { BasketTableLive } from "./basket-table-live";
import { BasketToolbar } from "./basket-toolbar";
import { useBasketTabMenu } from "./useBasketTabMenu";
import { useBasketTradingDataSources } from "./useBasketTradingDatasources";

import "./VuuBasketTradingFeature.css";
import { EmptyBasketsPanel } from "./empty-baskets-panel";
import { useBasketTrading } from "./useBasketTrading";

const classBase = "VuuBasketTradingFeature";

export type BasketStatus = "design" | "on-market";
const basketStatus: [BasketStatus, BasketStatus] = ["design", "on-market"];

export interface BasketTradingFeatureProps {
  basketSchema: TableSchema;
  basketTradingSchema: TableSchema;
  basketTradingConstituentSchema: TableSchema;
  instrumentsSchema: TableSchema;
}

const VuuBasketTradingFeature = (props: BasketTradingFeatureProps) => {
  const {
    basketSchema,
    basketTradingSchema,
    basketTradingConstituentSchema,
    instrumentsSchema,
  } = props;

  const basketInstanceId = "steve-00001";

  const {
    activeTabIndex,
    dataSourceBasket,
    dataSourceBasketTrading,
    dataSourceBasketTradingControl,
    dataSourceBasketTradingSearch,
    dataSourceBasketTradingConstituent,
    dataSourceInstruments,
    onSendToMarket,
    onTakeOffMarket,
  } = useBasketTradingDataSources({
    basketInstanceId,
    basketSchema,
    basketTradingSchema,
    basketTradingConstituentSchema,
    instrumentsSchema,
  });

  const [basketCount, setBasketCount] = useState(-1);
  useMemo(() => {
    dataSourceBasketTradingControl.subscribe(
      {
        range: { from: 0, to: 100 },
      },
      (message) => {
        console.log("message from dataSourceTradingControl", {
          message,
        });
        if (message.size) {
          setBasketCount(message.size);
        }
        if (message.rows) {
          console.table(message.rows);
        }
      }
    );

    // TEMP server is notsending TABLE_ROWS if size is zero
    setTimeout(() => {
      setBasketCount((count) => (count === -1 ? 0 : count));
    }, 1000);
  }, [dataSourceBasketTradingControl]);
  useEffect(() => {
    // dataSourceBasketDesign.resume?.();
    return () => {
      dataSourceBasketTradingControl.unsubscribe?.();
    };
  }, [dataSourceBasketTradingControl]);

  const [buildMenuOptions, handleMenuAction] = useBasketTabMenu({
    dataSourceInstruments,
  });

  const { dialog, handleAddBasket } = useBasketTrading({
    basketSchema,
    dataSourceBasket,
  });

  // useMemo(() => {
  // dataSourceBasketTrading.filter = {
  //   filter: `basketId = "${basketId}"`,
  // };
  // }, [basketId, dataSourceBasketTrading]);

  const basketSelectorProps = useMemo<BasketSelectorProps>(
    () => ({
      basketInstanceId,
      dataSourceBasketTrading,
      dataSourceBasketTradingSearch: dataSourceBasketTradingSearch,
      onClickAddBasket: handleAddBasket,
    }),
    [dataSourceBasketTrading, dataSourceBasketTradingSearch, handleAddBasket]
  );

  if (basketCount === -1) {
    // TODO loading
    return null;
  } else if (basketCount === 0) {
    return (
      <>
        <EmptyBasketsPanel onClickAddBasket={handleAddBasket} />
        {dialog}
      </>
    );
  }

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
          basketTradingDataSource={dataSourceBasketTrading}
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
            dataSource={dataSourceBasketTradingConstituent}
            tableSchema={basketTradingConstituentSchema}
          />
          <BasketTableLive
            data-tab-title="On Market"
            dataSource={dataSourceBasketTradingConstituent}
            tableSchema={basketTradingConstituentSchema}
          />
        </Stack>
      </FlexboxLayout>
      {dialog}
    </ContextMenuProvider>
  );
};

export default VuuBasketTradingFeature;
