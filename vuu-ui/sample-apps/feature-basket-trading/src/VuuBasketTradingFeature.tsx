import { TableSchema } from "@finos/vuu-data";
import { FlexboxLayout, Stack } from "@finos/vuu-layout";
import { ContextMenuProvider } from "@finos/vuu-popups";
import { BasketTableEdit } from "./basket-table-edit";
import { BasketTableLive } from "./basket-table-live";
import { BasketToolbar } from "./basket-toolbar";

import "./VuuBasketTradingFeature.css";
import { EmptyBasketsPanel } from "./empty-baskets-panel";
import { useBasketTrading } from "./useBasketTrading";

const classBase = "VuuBasketTradingFeature";

export type BasketStatus = "design" | "on-market";
const basketStatus: [BasketStatus, BasketStatus] = ["design", "on-market"];

export interface BasketTradingFeatureProps {
  basketSchema: TableSchema;
  basketTradingSchema: TableSchema;
  basketTradingConstituentJoinSchema: TableSchema;
  basketConstituentSchema: TableSchema;
}

const VuuBasketTradingFeature = (props: BasketTradingFeatureProps) => {
  const {
    basketSchema,
    basketTradingSchema,
    basketTradingConstituentJoinSchema,
    basketConstituentSchema,
  } = props;

  const {
    basket,
    basketCount,
    basketDesignContextMenuConfig,
    basketSelectorProps,
    contextMenuProps,
    dataSourceBasketTradingConstituentJoin,
    dialog,
    onClickAddBasket,
    onCommitBasketChange,
    onDropInstrument,
    onSendToMarket,
    onTakeOffMarket,
  } = useBasketTrading({
    basketSchema,
    basketTradingSchema,
    basketTradingConstituentJoinSchema,
    basketConstituentSchema,
  });

  if (basketCount === -1) {
    // TODO loading
    return null;
  } else if (basketCount === 0) {
    return (
      <>
        <EmptyBasketsPanel onClickAddBasket={onClickAddBasket} />
        {dialog}
      </>
    );
  }

  const activeTabIndex = basket?.status === "ON_MARKET" ? 1 : 0;

  return (
    <ContextMenuProvider {...contextMenuProps}>
      <FlexboxLayout
        className={classBase}
        style={{ flexDirection: "column", height: "100%" }}
      >
        <BasketToolbar
          basket={basket}
          BasketSelectorProps={basketSelectorProps}
          basketStatus={basketStatus[activeTabIndex]}
          onCommit={onCommitBasketChange}
          onSendToMarket={onSendToMarket}
          onTakeOffMarket={onTakeOffMarket}
        />
        <Stack
          active={activeTabIndex}
          className={`${classBase}-stack`}
          style={{ flex: 1 }}
        >
          <BasketTableEdit
            data-tab-location="basket-design"
            data-tab-title="Design"
            contextMenuConfig={basketDesignContextMenuConfig}
            dataSource={dataSourceBasketTradingConstituentJoin}
            onDrop={onDropInstrument}
            tableSchema={basketTradingConstituentJoinSchema}
          />
          <BasketTableLive
            data-tab-title="On Market"
            dataSource={dataSourceBasketTradingConstituentJoin}
            tableSchema={basketTradingConstituentJoinSchema}
          />
        </Stack>
      </FlexboxLayout>
      {dialog}
    </ContextMenuProvider>
  );
};

export default VuuBasketTradingFeature;
