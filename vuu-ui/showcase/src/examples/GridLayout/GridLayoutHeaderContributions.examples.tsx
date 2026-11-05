import { Button } from "@salt-ds/core";
import {
  GridLayout,
  GridLayoutHeaderContribution,
  GridLayoutItem,
  useGridLayoutItem,
} from "@vuu-ui/grid-layout";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { type CSSProperties, useEffect, useState } from "react";

import "./GridLayoutHeaderContributions.examples.css";

const classBase = "vuuHeaderContributionExample";

const useTickingPrice = (initialPrice: number) => {
  const [price, setPrice] = useState(initialPrice);
  const [direction, setDirection] = useState<"up" | "down">("up");
  useEffect(() => {
    const timer = window.setInterval(() => {
      const delta = (Math.random() - 0.5) * 0.2;
      setDirection(delta >= 0 ? "up" : "down");
      setPrice((current) => Math.max(0.01, current + delta));
    }, 500);
    return () => window.clearInterval(timer);
  }, []);
  return { direction, price };
};

/** A component that shows a custom icon before its header title. */
const OrdersPanel = () => (
  <div className={`${classBase}-content`}>
    <GridLayoutHeaderContribution location="start">
      <Icon name="folder" />
    </GridLayoutHeaderContribution>
    Orders
  </div>
);

/** A component that shows a link icon, left of close, while linked. */
const LinkedBlotter = () => {
  const [linked, setLinked] = useState(true);
  return (
    <div className={`${classBase}-content`}>
      {linked ? (
        <GridLayoutHeaderContribution location="end">
          <Icon aria-label="Visual link active" name="link" />
        </GridLayoutHeaderContribution>
      ) : null}
      <Button onClick={() => setLinked((value) => !value)}>
        {linked ? "Remove link" : "Create link"}
      </Button>
    </div>
  );
};

/**
 * A component that shows a channel icon before the title, and the instrument
 * and a ticking price in the centre of the header.
 */
const InstrumentTicker = ({
  channel,
  initialPrice,
  ric,
}: {
  channel: string;
  initialPrice: number;
  ric: string;
}) => {
  const { direction, price } = useTickingPrice(initialPrice);
  const item = useGridLayoutItem();
  return (
    <div className={`${classBase}-content`}>
      <GridLayoutHeaderContribution location={item?.stacked ? "tab-start" : "start"}>
        <span
          aria-label={`Channel ${channel}`}
          className={`${classBase}-channel`}
          data-channel={channel}
        />
      </GridLayoutHeaderContribution>
      <GridLayoutHeaderContribution location="center">
        <span className={`${classBase}-ric`}>{ric}</span>
        <span className={`${classBase}-price`} data-direction={direction}>
          {price.toFixed(2)}
        </span>
      </GridLayoutHeaderContribution>
      Hosted in {item?.id ?? "nothing"}
    </div>
  );
};

/** A component that replaces the default title with its own content. */
const CustomTitle = () => (
  <div className={`${classBase}-content`}>
    <GridLayoutHeaderContribution location="title">
      <Icon name="user" />
      <strong>Custom title</strong>
    </GridLayoutHeaderContribution>
    The default title is replaced
  </div>
);

export const HeaderContributions = () => (
  // prettier-ignore
  <GridLayout
    colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr", "1fr"] }}
    full-page
    id="header-contributions"
  >
    <GridLayoutItem id="orders" title="Orders" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
      <OrdersPanel />
    </GridLayoutItem>
    <GridLayoutItem id="blotter" title="Linked blotter" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
      <LinkedBlotter />
    </GridLayoutItem>
    <GridLayoutItem id="ticker" title="Ticker" header resizeable="hv" style={{ gridArea: "2/1/3/2" }}>
      <InstrumentTicker channel="red" initialPrice={182.4} ric="AAPL.OQ" />
    </GridLayoutItem>
    <GridLayoutItem id="custom-title" title="Custom" header resizeable="hv" style={{ gridArea: "2/2/3/3" }}>
      <CustomTitle />
    </GridLayoutItem>
  </GridLayout>
);

export const StackedHeaderContributions = () => (
  // prettier-ignore
  <GridLayout
    colsAndRows={{ cols: ["1fr"], rows: ["1fr"] }}
    full-page
    id="stacked-header-contributions"
  >
    <GridLayoutItem id="aapl" title="Apple" stackId="tickers" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
      <InstrumentTicker channel="red" initialPrice={182.4} ric="AAPL.OQ" />
    </GridLayoutItem>
    <GridLayoutItem id="vod" title="Vodafone" stackId="tickers" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
      <InstrumentTicker channel="blue" initialPrice={72.1} ric="VOD.L" />
    </GridLayoutItem>
    <GridLayoutItem id="linked" title="Linked blotter" stackId="tickers" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
      <LinkedBlotter />
    </GridLayoutItem>
  </GridLayout>
);

/** Header API variables overridden for one layout. */
const themedHeaderStyle = {
  "--vuuGridLayoutItemHeader-height": "32px",
  "--vuuGridLayoutItemHeader-background":
    "var(--salt-container-tertiary-background)",
  "--vuuGridLayoutItemHeader-background-active":
    "var(--salt-selectable-background-selected)",
  "--vuuGridLayoutItemHeader-title-fontWeight":
    "var(--salt-text-label-fontWeight)",
} as CSSProperties;

export const ThemedHeader = () => (
  // prettier-ignore
  <GridLayout
    colsAndRows={{ cols: ["1fr", "1fr"], rows: ["1fr"] }}
    full-page
    id="themed-header"
    style={themedHeaderStyle}
  >
    <GridLayoutItem id="themed-orders" title="Orders" header resizeable="hv" style={{ gridArea: "1/1/2/2" }}>
      <OrdersPanel />
    </GridLayoutItem>
    <GridLayoutItem id="themed-ticker" title="Ticker" header resizeable="hv" style={{ gridArea: "1/2/2/3" }}>
      <InstrumentTicker channel="green" initialPrice={41.7} ric="BARC.L" />
    </GridLayoutItem>
  </GridLayout>
);
