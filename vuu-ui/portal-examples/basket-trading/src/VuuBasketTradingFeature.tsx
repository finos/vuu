import { FlexboxLayout, Stack } from "@vuu-ui/vuu-layout";
import { SlotContextPanelProvider } from "@vuu-ui/core";
import { DragDropProvider } from "@vuu-ui/vuu-ui-controls";
import { BasketTableEdit } from "./basket-table-edit";
import { BasketTableLive } from "./basket-table-live";
import { BasketToolbar } from "./basket-toolbar";
import { EmptyBasketsPanel } from "./empty-baskets-panel";
import { useBasketTrading } from "./useBasketTrading";
import { ActiveBasketContext } from "./cell-renderers/col-header-add-symbol/ConstituentSearch";

import "./VuuBasketTradingFeature.css";

const classBase = "vuuBasketTradingFeature";

export type BasketStatus = "design" | "on-market";
const basketStatus: [BasketStatus, BasketStatus] = ["design", "on-market"];
const dragSources = {
  "basket-instruments": { dropTargets: "basket-constituents" },
};

const VuuBasketTradingFeature = () => {
  const basketTradingProps = useBasketTrading();
  if (basketTradingProps === undefined) {
    return null;
  }
  const {
    basket,
    basketCount,
    basketDesignContextMenuConfig,
    basketSelectorProps,
    dataSourceBasketTradingConstituentJoin,
    dialog,
    editConfig,
    liveConfig,
    onClickAddBasket,
    onCommitBasketChange,
    onConfigChangeEdit,
    onConfigChangeLive,
    onDropInstrument,
    onSendToMarket,
    onTakeOffMarket,
  } = basketTradingProps;

  if (
    basketCount === -1 ||
    dataSourceBasketTradingConstituentJoin === undefined ||
    basketSelectorProps === undefined
  ) {
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
    <ActiveBasketContext.Provider value={basket?.instanceId}>
      <SlotContextPanelProvider>
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
            showTabs={false}
            style={{ flex: 1 }}
          >
            <BasketTableEdit
              config={editConfig}
              data-tab-title="Design"
              contextMenuConfig={basketDesignContextMenuConfig}
              dataSource={dataSourceBasketTradingConstituentJoin}
              onConfigChange={onConfigChangeEdit}
              onDrop={onDropInstrument}
            />
            <BasketTableLive
              config={liveConfig}
              data-tab-title="On Market"
              dataSource={dataSourceBasketTradingConstituentJoin}
              onConfigChange={onConfigChangeLive}
            />
          </Stack>
        </FlexboxLayout>
        {dialog}
      </SlotContextPanelProvider>
    </ActiveBasketContext.Provider>
  );
};

const BasketTradingWithDragDrop = () => (
  <DragDropProvider dragSources={dragSources}>
    <VuuBasketTradingFeature />
  </DragDropProvider>
);

export default BasketTradingWithDragDrop;
